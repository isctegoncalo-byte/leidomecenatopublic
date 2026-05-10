import { Institution, NeedItem } from '../types'
import { sampleInstitutions } from '../data/institutions'
import { listInstitutionRegistrations } from './institutionRegistry'

export interface ProjectEntry {
  institution: Institution
  project: NeedItem
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function registrationToInstitution(reg: ReturnType<typeof listInstitutionRegistrations>[number], index: number): Institution {
  const sdgAlignment = [...new Set(reg.needs.flatMap(n => n.sdgGoals))]
  return {
    id: reg.accountId || `reg-${reg.nif || index}`,
    name: reg.name,
    legalName: reg.legalName,
    category: reg.category || 'Instituição',
    description: reg.description || reg.mission || 'Instituição registada na plataforma.',
    mission: reg.mission || 'Gerar impacto social através de projetos apoiados por mecenas.',
    logo: reg.logoUrl || '🏛️',
    municipality: reg.municipality || '',
    district: reg.district || '',
    peopleReachedPerYear: reg.peopleReachedPerYear || 0,
    volunteers: reg.volunteers || 0,
    fullTimeStaff: reg.fullTimeStaff || 0,
    annualBudget: reg.annualBudget || '',
    utilidadePublica: reg.utilidadePublica,
    verified: reg.statutes && reg.lastAccountsApproved,
    needs: reg.needs,
    esgScore: {
      environmental: 60,
      social: 72,
      governance: reg.statutes && reg.lastAccountsApproved ? 75 : 55,
      total: 68,
      sdgAlignment,
      beneficiaries: reg.peopleReachedPerYear || 0,
      impactNarrative: reg.mainActivities || reg.mission || '',
      highlights: [reg.category || 'Instituição registada', `${reg.volunteers || 0} voluntários`, `${reg.peopleReachedPerYear || 0} pessoas/ano`],
      risks: ['Dados sujeitos a validação documental'],
    },
  }
}

export function listProjectEntries(): ProjectEntry[] {
  return listProjectInstitutions().flatMap(institution =>
    institution.needs.map(project => ({ institution, project }))
  )
}

export function listProjectInstitutions(): Institution[] {
  const registered = listInstitutionRegistrations().map(registrationToInstitution)
  return [...sampleInstitutions, ...registered]
}

export function projectSlug(institution: Institution, project: NeedItem) {
  return `${slugify(institution.name)}-${slugify(project.category)}-${slugify(project.subcategory)}-${project.id}`
}

export function findProjectEntry(slug: string): ProjectEntry | null {
  return listProjectEntries().find(entry => projectSlug(entry.institution, entry.project) === slug) || null
}
