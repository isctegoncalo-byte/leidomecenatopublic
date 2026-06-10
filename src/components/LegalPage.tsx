import { ViewType } from '../types'
import { useBrand } from '../hooks/useBrand'

type LegalKind = 'privacidade' | 'termos' | 'cookies'

interface Props {
  kind: LegalKind
  setCurrentView: (v: ViewType) => void
}

const updatedAt = '8 de maio de 2026'

const content: Record<LegalKind, {
  title: string
  intro: string
  sections: { title: string; body: string[] }[]
}> = {
  privacidade: {
    title: 'Política de Privacidade e RGPD',
    intro: 'Esta política explica como a plataforma Lei do Mecenato trata dados pessoais de empresas, instituições, representantes e utilizadores registados, nos termos do RGPD.',
    sections: [
      {
        title: 'Responsavel pelo tratamento',
        body: [
          'A plataforma é uma iniciativa privada independente. Não é um organismo público, autoridade tributária, entidade certificadora oficial ou substituto de aconselhamento jurídico, fiscal ou contabilístico.',
          'Para efeitos do Regulamento (UE) 2016/679, Regulamento Geral sobre a Proteção de Dados (RGPD), a entidade exploradora da plataforma atua como responsável pelo tratamento dos dados necessários à gestão da plataforma.',
          'Para questoes sobre dados pessoais, pedidos RGPD ou informacao adicional, deve ser usado o contacto indicado no rodape do site.',
        ],
      },
      {
        title: 'Dados pessoais tratados',
        body: [
          'Podemos tratar nome, email, telefone, NIF/NIPC, entidade representada, cargo ou função, dados de registo, dados de autenticação, documentos submetidos, comprovativos de donativos, mensagens trocadas na plataforma e informação técnica necessária ao funcionamento do serviço.',
          'No caso de instituições, podem ser tratados dados de representantes, contactos institucionais, documentos de identificação fiscal, estatutos, relatórios, IBAN, comprovativos e informação sobre projetos. No caso de empresas, podem ser tratados dados de contacto, setor de atividade, comprovativos, documentos contabilísticos e histórico de interações.',
          'O utilizador é responsável por garantir que tem legitimidade para submeter documentos ou dados de terceiros. A plataforma não deve ser usada para carregar dados sensíveis desnecessários, como dados de saúde, origem racial ou étnica, opiniões políticas, convicções religiosas, dados biométricos ou dados de menores, salvo quando exista base legal adequada e necessidade clara.',
        ],
      },
      {
        title: 'Finalidades',
        body: [
          'Tratamos dados para criar e gerir contas, verificar perfis, facilitar contactos entre empresas e instituições, receber documentos, acompanhar donativos, emitir relatórios de impacto, gerir pagamentos de serviços, prestar suporte, prevenir abuso e assegurar segurança e auditoria.',
          'Também podemos usar dados agregados e não identificáveis para estatísticas internas, melhoria do serviço, métricas de impacto e comunicação institucional.',
        ],
      },
      {
        title: 'Bases legais do tratamento',
        body: [
          'O tratamento pode assentar na execução de contrato ou diligências pré-contratuais, consentimento, cumprimento de obrigações legais, interesse legítimo na segurança e melhoria da plataforma, ou defesa de direitos.',
          'Quando o tratamento assentar em consentimento, o titular pode retira-lo a qualquer momento, sem comprometer a licitude do tratamento efetuado antes dessa retirada.',
          'O interesse legítimo pode incluir prevenção de fraude, segurança da conta, prova de operações, suporte, auditoria, gestão de conflitos e melhoria proporcional da experiência de utilização.',
        ],
      },
      {
        title: 'Partilha de dados',
        body: [
          'Dados podem ser partilhados entre empresa e instituição apenas quando necessário para gerir o donativo, confirmar comprovativos, emitir recibos, comunicar sobre o projeto ou produzir relatórios de impacto.',
          'Podem ser utilizados prestadores técnicos, como alojamento, base de dados, autenticação, email, armazenamento, pagamentos ou analítica. Esses prestadores devem tratar dados segundo instruções da plataforma e com medidas adequadas de confidencialidade e segurança.',
          'Quando existirem transferencias para fora do Espaco Economico Europeu, devem ser usadas garantias adequadas previstas no RGPD, como decisoes de adequacao ou clausulas contratuais-tipo.',
        ],
      },
      {
        title: 'Conservacao',
        body: [
          'Os dados são mantidos pelo período necessário às finalidades descritas, obrigações legais aplicáveis e defesa de direitos.',
          'Dados associados a donativos, recibos, relatórios, pagamentos, comprovativos ou obrigações fiscais e contabilísticas podem ser conservados durante os prazos legalmente exigidos. Dados de contacto e conta podem ser eliminados ou anonimizados quando deixarem de ser necessários, salvo obrigação legal ou defesa de direitos.',
        ],
      },
      {
        title: 'Direitos dos titulares',
        body: [
          'Nos termos do RGPD, o titular pode solicitar acesso, retificação, apagamento, limitação do tratamento, oposição, portabilidade e retirada de consentimento quando aplicável.',
          'Os pedidos serao analisados de acordo com a lei aplicavel. Alguns dados podem ter de ser conservados por obrigacao legal, prova de transacoes, exercicio ou defesa de direitos.',
          'O titular tem ainda o direito de apresentar reclamacao junto da Comissao Nacional de Protecao de Dados (CNPD), atraves de www.cnpd.pt.',
        ],
      },
      {
        title: 'Seguranca',
        body: [
          'A plataforma deve adotar medidas técnicas e organizativas adequadas para proteger dados pessoais contra acesso não autorizado, perda, alteração ou divulgação indevida.',
          'Nenhuma plataforma é totalmente imune a risco. Os utilizadores devem proteger credenciais, evitar partilha de passwords e carregar apenas documentos necessários ao funcionamento do serviço.',
        ],
      },
    ],
  },
  termos: {
    title: 'Termos de Servico',
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
          'Ao submeter dados pessoais de representantes, colaboradores, beneficiários, contactos ou terceiros, o utilizador declara que tem fundamento legal para o fazer e que informou os titulares quando aplicável.',
        ],
      },
      {
        title: 'Proteção de dados e RGPD',
        body: [
          'A utilização da plataforma implica tratamento de dados pessoais nos termos descritos na Política de Privacidade e RGPD. O utilizador deve respeitar o RGPD e demais legislação aplicável sempre que submeta ou trate dados de terceiros através da plataforma.',
          'Empresas e instituições devem garantir que os dados submetidos são adequados, pertinentes e limitados ao necessário, mantendo confidencialidade sobre informação a que tenham acesso na área privada.',
          'A plataforma pode limitar, remover ou pedir substituição de ficheiros que contenham dados pessoais excessivos, sensíveis ou desnecessários para a finalidade declarada.',
        ],
      },
      {
        title: 'Documentos e ficheiros',
        body: [
          'Ao carregar ficheiros, o utilizador declara que tem legitimidade para os submeter e que os mesmos não violam direitos de terceiros.',
          'Os ficheiros devem ser limitados ao estritamente necessário. Sempre que possível, devem ser omitidos, rasurados ou removidos dados pessoais excessivos que não sejam necessários para validar o donativo, a instituição ou o relatório.',
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
          'Podemos melhorar, suspender ou alterar funcionalidades para manutenção, segurança, cumprimento legal ou evolução do serviço.',
          'Estes termos podem ser atualizados. A versão em vigor será a publicada nesta página.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Política de Cookies e Armazenamento Local',
    intro: 'Esta página explica como podem ser usados cookies, armazenamento local e tecnologias semelhantes na plataforma.',
    sections: [
      {
        title: 'O que sao cookies',
        body: [
          'Cookies são pequenos ficheiros guardados no navegador para permitir funcionamento técnico, manter sessão, recordar preferências e melhorar a experiência de utilização.',
        ],
      },
      {
        title: 'Cookies necessários',
        body: [
          'Podem ser usados cookies ou armazenamento local essenciais para login, segurança, sessão, preferências técnicas, consentimento de cookies e funcionamento da área privada.',
          'Estes mecanismos podem envolver identificadores técnicos, estado de sessão e informação indispensável ao funcionamento seguro da plataforma. Sem estes mecanismos, algumas funcionalidades podem não funcionar corretamente.',
        ],
      },
      {
        title: 'Cookies analíticos e de melhoria',
        body: [
          'Se forem ativadas ferramentas de estatística, estas devem ser usadas para compreender utilização agregada do site e melhorar a plataforma.',
          'Cookies não essenciais, como analítica ou marketing, só devem ser ativados quando exista consentimento válido, livre, informado, específico e revogável.',
        ],
      },
      {
        title: 'Google Analytics 4',
        body: [
          'Com consentimento, pode ser usado Google Analytics 4 para compreender utilizacao agregada do site, origem de trafego, navegacao entre paginas e conversoes tecnicas como inicio de registo, selecao de pacote ou inicio de checkout.',
          'A configuracao analitica nao deve enviar emails, NIFs, nomes, contactos, valores de donativos ou outros dados pessoais como parametros de eventos.',
        ],
      },
      {
        title: 'Meta Pixel',
        body: [
          'Com consentimento de marketing, pode ser usado Meta Pixel para medir desempenho de campanhas e conversoes tecnicas, como inicio de checkout ou inicio de registo.',
          'A configuracao do Pixel nao deve enviar emails, NIFs, nomes, contactos, valores de donativos ou outros dados pessoais como parametros de eventos.',
        ],
      },
      {
        title: 'Gestao de cookies',
        body: [
          'O utilizador pode bloquear ou apagar cookies nas definições do navegador. Essa decisão pode afetar login, preferências e algumas funcionalidades.',
          'O armazenamento local fica no navegador do utilizador e pode ser apagado nas definições do navegador ou ao limpar dados do site.',
        ],
      },
      {
        title: 'Relacao com o RGPD',
        body: [
          'Quando cookies, armazenamento local ou tecnologias semelhantes permitirem identificar direta ou indiretamente um utilizador, o respetivo tratamento é enquadrado pela Política de Privacidade e pelo RGPD.',
          'A base legal pode variar entre necessidade técnica, interesse legítimo ou consentimento, consoante a finalidade e a natureza do cookie ou tecnologia utilizada.',
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
            Informacao legal
          </p>
          <h1 className="text-3xl md:text-4xl font-black mb-4">{page.title}</h1>
          <p className="text-slate-300 leading-relaxed max-w-3xl">{page.intro}</p>
          <p className="text-xs text-slate-500 mt-4">Ultima atualizacao: {updatedAt}</p>
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

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <h2 className="text-lg font-black text-blue-950 mb-2">Contacto para temas RGPD</h2>
              <p className="text-sm leading-relaxed text-blue-800">
                Para exercer direitos ou colocar questoes sobre privacidade, use o contacto geral indicado no rodape do site,
                identificando o pedido como assunto RGPD.
              </p>
            </div>

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
