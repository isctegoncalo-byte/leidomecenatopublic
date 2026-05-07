import { ViewType } from '../types'
import { useBrand } from '../hooks/useBrand'

type LegalKind = 'privacidade' | 'termos' | 'cookies'

interface Props {
  kind: LegalKind
  setCurrentView: (v: ViewType) => void
}

const updatedAt = '5 de maio de 2026'

const content: Record<LegalKind, {
  title: string
  intro: string
  sections: { title: string; body: string[] }[]
}> = {
  privacidade: {
    title: 'Política de Privacidade',
    intro: 'Esta política explica como a plataforma Lei do Mecenato trata dados pessoais de empresas, instituições e utilizadores registados.',
    sections: [
      {
        title: 'Responsável pelo tratamento',
        body: [
          'A plataforma é uma iniciativa privada independente. Não é um organismo público, autoridade tributária, entidade certificadora oficial ou substituto de aconselhamento jurídico/fiscal.',
          'Para questões sobre dados pessoais, deve ser usado o contacto indicado no rodapé do site.',
        ],
      },
      {
        title: 'Dados que podemos tratar',
        body: [
          'Podemos tratar nome, email, telefone, NIF/NIPC, entidade representada, cargo/função, dados de registo, documentos enviados, comprovativos de donativos, mensagens trocadas na plataforma e informação técnica necessária ao funcionamento do serviço.',
          'Quando são carregados ficheiros, o utilizador é responsável por garantir que tem autorização para submeter esses documentos.',
        ],
      },
      {
        title: 'Finalidades',
        body: [
          'Usamos os dados para criar e gerir contas, facilitar contactos entre empresas e instituições, receber documentos, acompanhar donativos, emitir relatórios de impacto e assegurar segurança, auditoria e suporte.',
          'Podemos usar dados agregados e não identificáveis para estatísticas internas e melhoria do serviço.',
        ],
      },
      {
        title: 'Base legal',
        body: [
          'O tratamento pode assentar na execução de contrato ou diligências pré-contratuais, consentimento, cumprimento de obrigações legais e interesse legítimo na segurança e melhoria da plataforma.',
        ],
      },
      {
        title: 'Conservação e direitos',
        body: [
          'Os dados são mantidos pelo período necessário às finalidades descritas, obrigações legais aplicáveis e defesa de direitos.',
          'O utilizador pode solicitar acesso, retificação, apagamento, limitação, oposição ou portabilidade, nos termos do RGPD.',
        ],
      },
    ],
  },
  termos: {
    title: 'Termos de Serviço',
    intro: 'Estes termos regulam a utilização da plataforma Lei do Mecenato por empresas, instituições e administradores.',
    sections: [
      {
        title: 'Natureza da plataforma',
        body: [
          'A plataforma é uma iniciativa privada independente para facilitar a ligação entre empresas e instituições e apoiar a organização de informação sobre donativos e impacto.',
          'A plataforma não presta aconselhamento jurídico, fiscal ou contabilístico e não substitui validação profissional independente.',
        ],
      },
      {
        title: 'Contas e responsabilidades',
        body: [
          'Cada utilizador deve fornecer informação verdadeira, atualizada e completa. O acesso à conta é pessoal e deve ser protegido com uma palavra-passe segura.',
          'Empresas e instituições são responsáveis pela veracidade dos documentos, comprovativos, declarações e informações que submetem.',
        ],
      },
      {
        title: 'Documentos e ficheiros',
        body: [
          'Ao carregar ficheiros, o utilizador declara que tem legitimidade para os submeter e que os mesmos não violam direitos de terceiros.',
          'A plataforma pode remover conteúdos manifestamente inválidos, abusivos, ilegais ou incompatíveis com o objetivo do serviço.',
        ],
      },
      {
        title: 'Relatórios e informação fiscal',
        body: [
          'Relatórios de impacto, simulações e referências fiscais têm natureza informativa. A elegibilidade concreta de benefícios fiscais deve ser confirmada com contabilista, jurista, Autoridade Tributária ou entidade competente.',
        ],
      },
      {
        title: 'Alterações e disponibilidade',
        body: [
          'Podemos melhorar, suspender ou alterar funcionalidades para manutenção, segurança ou evolução do serviço.',
          'Estes termos podem ser atualizados. A versão em vigor será a publicada nesta página.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    intro: 'Esta página explica como podem ser usados cookies e tecnologias semelhantes na plataforma.',
    sections: [
      {
        title: 'O que são cookies',
        body: [
          'Cookies são pequenos ficheiros guardados no navegador para permitir funcionamento técnico, manter sessão, recordar preferências e melhorar a experiência de utilização.',
        ],
      },
      {
        title: 'Cookies necessários',
        body: [
          'Podem ser usados cookies ou armazenamento local essenciais para login, segurança, sessão, preferências técnicas e funcionamento da área privada.',
          'Sem estes mecanismos, algumas funcionalidades podem não funcionar corretamente.',
        ],
      },
      {
        title: 'Cookies analíticos e de melhoria',
        body: [
          'Se forem ativadas ferramentas de estatística, estas devem ser usadas para compreender utilização agregada do site e melhorar a plataforma.',
          'Sempre que exigido, serão solicitados consentimentos antes da ativação de cookies não essenciais.',
        ],
      },
      {
        title: 'Gestão de cookies',
        body: [
          'O utilizador pode bloquear ou apagar cookies nas definições do navegador. Essa decisão pode afetar login, preferências e algumas funcionalidades.',
        ],
      },
      {
        title: 'Armazenamento local',
        body: [
          'A plataforma pode usar localStorage para guardar sessão, preferências e dados temporários, sobretudo em modo de demonstração ou durante desenvolvimento.',
        ],
      },
    ],
  },
}

export default function LegalPage({ kind, setCurrentView }: Props) {
  const brand = useBrand()
  const page = content[kind]

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white py-14">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-xs uppercase tracking-wide font-bold mb-3" style={{ color: brand.accentColor }}>
            Informação legal
          </p>
          <h1 className="text-3xl md:text-4xl font-black mb-4">{page.title}</h1>
          <p className="text-slate-300 leading-relaxed max-w-3xl">{page.intro}</p>
          <p className="text-xs text-slate-500 mt-4">Última atualização: {updatedAt}</p>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-8">
            {page.sections.map(section => (
              <div key={section.title}>
                <h2 className="text-xl font-black text-slate-900 mb-3">{section.title}</h2>
                <div className="space-y-3">
                  {section.body.map(paragraph => (
                    <p key={paragraph} className="text-sm md:text-base text-slate-600 leading-relaxed">{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-slate-100 pt-6">
              <button
                onClick={() => setCurrentView('home')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-3 rounded-xl"
              >
                Voltar ao site
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
