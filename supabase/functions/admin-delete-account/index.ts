import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const SITE_ORIGIN = Deno.env.get('SITE_ORIGIN') || '*'

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const localOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173']
  const allowedOrigin = SITE_ORIGIN === '*' || localOrigins.includes(origin) ? (origin || SITE_ORIGIN) : SITE_ORIGIN
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function json(req: Request, payload: Record<string, unknown>, status = 200) {
  return Response.json(payload, { status, headers: corsHeaders(req) })
}

function orValue(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll(',', '\\,').replaceAll(')', '\\)')
}

function clean(value: unknown) {
  return String(value || '').trim()
}

function unique(values: string[]) {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))]
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return json(req, { ok: false, error: 'Metodo nao permitido.' }, 405)
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(req, { ok: false, error: 'Supabase nao esta configurado na Edge Function.' }, 500)
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader) return json(req, { ok: false, error: 'Sessao de administrador em falta.' }, 401)

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: requesterData, error: requesterError } = await userClient.auth.getUser()
    const requester = requesterData?.user
    if (requesterError || !requester) {
      return json(req, { ok: false, error: 'Sessao invalida.' }, 401)
    }

    const { data: adminProfile, error: adminError } = await serviceClient
      .from('profiles')
      .select('id, role, email')
      .eq('id', requester.id)
      .maybeSingle()

    if (adminError || adminProfile?.role !== 'admin') {
      return json(req, { ok: false, error: 'Apenas administradores podem eliminar contas.' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const profileId = typeof body.profileId === 'string' ? body.profileId.trim() : ''
    if (!profileId) {
      return json(req, { ok: false, error: 'Conta a eliminar em falta.' }, 400)
    }
    if (profileId === requester.id) {
      return json(req, { ok: false, error: 'Nao pode eliminar a propria conta de administrador.' }, 400)
    }

    const { data: targetProfile, error: targetError } = await serviceClient
      .from('profiles')
      .select('id, role, email, name, nif')
      .eq('id', profileId)
      .maybeSingle()

    if (targetError) return json(req, { ok: false, error: targetError.message }, 500)
    if (!targetProfile) return json(req, { ok: false, error: 'Conta nao encontrada.' }, 404)

    const { data: documents, error: docsError } = await serviceClient
      .from('documents')
      .select('storage_path')
      .eq('owner_id', profileId)

    if (docsError) return json(req, { ok: false, error: docsError.message }, 500)

    const storagePaths = (documents || [])
      .map((document: { storage_path?: string | null }) => document.storage_path)
      .filter((path: string | null | undefined): path is string => Boolean(path))

    if (storagePaths.length > 0) {
      const { error: storageError } = await serviceClient.storage
        .from('documents')
        .remove(storagePaths)

      if (storageError) return json(req, { ok: false, error: storageError.message }, 500)
    }

    const targetEmail = clean(targetProfile.email).toLowerCase()
    const targetName = clean(targetProfile.name)
    const targetNif = clean(targetProfile.nif)
    const institutionIds = unique([profileId, targetNif ? `reg-${targetNif}` : ''])
    const transactionMatchers = [
      `company_profile_id.eq.${orValue(profileId)}`,
      targetEmail ? `company_email.eq.${orValue(targetEmail)}` : '',
      targetNif ? `company_nif.eq.${orValue(targetNif)}` : '',
      targetName ? `company_name.eq.${orValue(targetName)}` : '',
      ...institutionIds.map(id => `institution_id.eq.${orValue(id)}`),
      targetName ? `institution_name.eq.${orValue(targetName)}` : '',
    ].filter(Boolean)

    const { data: associatedTransactions, error: transactionsFetchError } = await serviceClient
      .from('transactions')
      .select('contract_id')
      .or(transactionMatchers.join(','))

    if (transactionsFetchError) {
      return json(req, { ok: false, error: transactionsFetchError.message }, 500)
    }

    const associatedContractIds = unique(
      (associatedTransactions || []).map((transaction: { contract_id?: string | null }) => transaction.contract_id || '')
    )

    if (associatedContractIds.length > 0) {
      const { error: impactByProofError } = await serviceClient
        .from('impact_measurements')
        .delete()
        .in('proof_id', associatedContractIds)

      if (impactByProofError) return json(req, { ok: false, error: impactByProofError.message }, 500)
    }

    const impactMatchers = [
      `updated_by.eq.${orValue(profileId)}`,
      targetName ? `company_name.eq.${orValue(targetName)}` : '',
      targetName ? `institution_name.eq.${orValue(targetName)}` : '',
    ].filter(Boolean)

    if (impactMatchers.length > 0) {
      const { error: impactDeleteError } = await serviceClient
        .from('impact_measurements')
        .delete()
        .or(impactMatchers.join(','))

      if (impactDeleteError) return json(req, { ok: false, error: impactDeleteError.message }, 500)
    }

    if (transactionMatchers.length > 0) {
      const { error: transactionsDeleteError } = await serviceClient
        .from('transactions')
        .delete()
        .or(transactionMatchers.join(','))

      if (transactionsDeleteError) return json(req, { ok: false, error: transactionsDeleteError.message }, 500)
    }

    const { error: deleteUserError } = await serviceClient.auth.admin.deleteUser(profileId)
    if (deleteUserError) {
      return json(req, { ok: false, error: deleteUserError.message }, 500)
    }

    await serviceClient.from('profiles').delete().eq('id', profileId)
    await serviceClient.from('documents').delete().eq('owner_id', profileId)

    return json(req, {
      ok: true,
      deletedProfile: {
        id: targetProfile.id,
        email: targetProfile.email,
        role: targetProfile.role,
      },
      removed: {
        documents: storagePaths.length,
        transactions: associatedTransactions?.length || 0,
        impactMeasurementsLinkedToTransactions: associatedContractIds.length,
      },
    })
  } catch (error) {
    return json(req, { ok: false, error: error instanceof Error ? error.message : 'Erro inesperado.' }, 500)
  }
})
