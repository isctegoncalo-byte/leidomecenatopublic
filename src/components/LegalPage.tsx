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
    title: 'Politica de Privacidade e RGPD',
    intro: 'Esta politica explica como a plataforma Lei do Mecenato trata dados pessoais de empresas, instituicoes, representantes e utilizadores registados, nos termos do RGPD.',
    sections: [
      {
        title: 'Responsavel pelo tratamento',
        body: [
          'A plataforma e uma iniciativa privada independente. Nao e um organismo publico, autoridade tributaria, entidade certificadora oficial ou substituto de aconselhamento juridico, fiscal ou contabilistico.',
          'Para efeitos do Regulamento (UE) 2016/679, Regulamento Geral sobre a Protecao de Dados (RGPD), a entidade exploradora da plataforma atua como responsavel pelo tratamento dos dados necessarios a gestao da plataforma.',
          'Para questoes sobre dados pessoais, pedidos RGPD ou informacao adicional, deve ser usado o contacto indicado no rodape do site.',
        ],
      },
      {
        title: 'Dados pessoais tratados',
        body: [
          'Podemos tratar nome, email, telefone, NIF/NIPC, entidade representada, cargo ou funcao, dados de registo, dados de autenticacao, documentos submetidos, comprovativos de donativos, mensagens trocadas na plataforma e informacao tecnica necessaria ao funcionamento do servico.',
          'No caso de instituicoes, podem ser tratados dados de representantes, contactos institucionais, documentos de identificacao fiscal, estatutos, relatorios, IBAN, comprovativos e informacao sobre projetos. No caso de empresas, podem ser tratados dados de contacto, setor de atividade, comprovativos, documentos contabilisticos e historico de interacoes.',
          'O utilizador e responsavel por garantir que tem legitimidade para submeter documentos ou dados de terceiros. A plataforma nao deve ser usada para carregar dados sensiveis desnecessarios, como dados de saude, origem racial ou etnica, opinioes politicas, conviccoes religiosas, dados biometricos ou dados de menores, salvo quando exista base legal adequada e necessidade clara.',
        ],
      },
      {
        title: 'Finalidades',
        body: [
          'Tratamos dados para criar e gerir contas, verificar perfis, facilitar contactos entre empresas e instituicoes, receber documentos, acompanhar donativos, emitir relatorios de impacto, gerir pagamentos de servicos, prestar suporte, prevenir abuso e assegurar seguranca e auditoria.',
          'Tambem podemos usar dados agregados e nao identificaveis para estatisticas internas, melhoria do servico, metricas de impacto e comunicacao institucional.',
        ],
      },
      {
        title: 'Bases legais do tratamento',
        body: [
          'O tratamento pode assentar na execucao de contrato ou diligencias pre-contratuais, consentimento, cumprimento de obrigacoes legais, interesse legitimo na seguranca e melhoria da plataforma, ou defesa de direitos.',
          'Quando o tratamento assentar em consentimento, o titular pode retira-lo a qualquer momento, sem comprometer a licitude do tratamento efetuado antes dessa retirada.',
          'O interesse legitimo pode incluir prevencao de fraude, seguranca da conta, prova de operacoes, suporte, auditoria, gestao de conflitos e melhoria proporcional da experiencia de utilizacao.',
        ],
      },
      {
        title: 'Partilha de dados',
        body: [
          'Dados podem ser partilhados entre empresa e instituicao apenas quando necessario para gerir o donativo, confirmar comprovativos, emitir recibos, comunicar sobre o projeto ou produzir relatorios de impacto.',
          'Podem ser utilizados prestadores tecnicos, como alojamento, base de dados, autenticacao, email, armazenamento, pagamentos ou analitica. Esses prestadores devem tratar dados segundo instrucoes da plataforma e com medidas adequadas de confidencialidade e seguranca.',
          'Quando existirem transferencias para fora do Espaco Economico Europeu, devem ser usadas garantias adequadas previstas no RGPD, como decisoes de adequacao ou clausulas contratuais-tipo.',
        ],
      },
      {
        title: 'Conservacao',
        body: [
          'Os dados sao mantidos pelo periodo necessario as finalidades descritas, obrigacoes legais aplicaveis e defesa de direitos.',
          'Dados associados a donativos, recibos, relatorios, pagamentos, comprovativos ou obrigacoes fiscais e contabilisticas podem ser conservados durante os prazos legalmente exigidos. Dados de contacto e conta podem ser eliminados ou anonimizados quando deixarem de ser necessarios, salvo obrigacao legal ou defesa de direitos.',
        ],
      },
      {
        title: 'Direitos dos titulares',
        body: [
          'Nos termos do RGPD, o titular pode solicitar acesso, retificacao, apagamento, limitacao do tratamento, oposicao, portabilidade e retirada de consentimento quando aplicavel.',
          'Os pedidos serao analisados de acordo com a lei aplicavel. Alguns dados podem ter de ser conservados por obrigacao legal, prova de transacoes, exercicio ou defesa de direitos.',
          'O titular tem ainda o direito de apresentar reclamacao junto da Comissao Nacional de Protecao de Dados (CNPD), atraves de www.cnpd.pt.',
        ],
      },
      {
        title: 'Seguranca',
        body: [
          'A plataforma deve adotar medidas tecnicas e organizativas adequadas para proteger dados pessoais contra acesso nao autorizado, perda, alteracao ou divulgacao indevida.',
          'Nenhuma plataforma e totalmente imune a risco. Os utilizadores devem proteger credenciais, evitar partilha de passwords e carregar apenas documentos necessarios ao funcionamento do servico.',
        ],
      },
    ],
  },
  termos: {
    title: 'Termos de Servico',
    intro: 'Estes termos regulam a utilizacao da plataforma Lei do Mecenato por empresas, instituicoes e administradores.',
    sections: [
      {
        title: 'Natureza da plataforma',
        body: [
          'A plataforma e uma iniciativa privada independente para facilitar a ligacao entre empresas e instituicoes e apoiar a organizacao de informacao sobre donativos e impacto.',
          'A plataforma nao presta aconselhamento juridico, fiscal ou contabilistico e nao substitui validacao profissional independente.',
        ],
      },
      {
        title: 'Contas e responsabilidades',
        body: [
          'Cada utilizador deve fornecer informacao verdadeira, atualizada e completa. O acesso a conta e pessoal e deve ser protegido com uma palavra-passe segura.',
          'Empresas e instituicoes sao responsaveis pela veracidade dos documentos, comprovativos, declaracoes e informacoes que submetem.',
          'Ao submeter dados pessoais de representantes, colaboradores, beneficiarios, contactos ou terceiros, o utilizador declara que tem fundamento legal para o fazer e que informou os titulares quando aplicavel.',
        ],
      },
      {
        title: 'Protecao de dados e RGPD',
        body: [
          'A utilizacao da plataforma implica tratamento de dados pessoais nos termos descritos na Politica de Privacidade e RGPD. O utilizador deve respeitar o RGPD e demais legislacao aplicavel sempre que submeta ou trate dados de terceiros atraves da plataforma.',
          'Empresas e instituicoes devem garantir que os dados submetidos sao adequados, pertinentes e limitados ao necessario, mantendo confidencialidade sobre informacao a que tenham acesso na area privada.',
          'A plataforma pode limitar, remover ou pedir substituicao de ficheiros que contenham dados pessoais excessivos, sensiveis ou desnecessarios para a finalidade declarada.',
        ],
      },
      {
        title: 'Documentos e ficheiros',
        body: [
          'Ao carregar ficheiros, o utilizador declara que tem legitimidade para os submeter e que os mesmos nao violam direitos de terceiros.',
          'Os ficheiros devem ser limitados ao estritamente necessario. Sempre que possivel, devem ser omitidos, rasurados ou removidos dados pessoais excessivos que nao sejam necessarios para validar o donativo, a instituicao ou o relatorio.',
          'A plataforma pode remover conteudos manifestamente invalidos, abusivos, ilegais ou incompativeis com o objetivo do servico.',
        ],
      },
      {
        title: 'Relatorios e informacao fiscal',
        body: [
          'Relatorios de impacto, simulacoes e referencias fiscais tem natureza informativa. A elegibilidade concreta de beneficios fiscais deve ser confirmada com contabilista, jurista, Autoridade Tributaria ou entidade competente.',
        ],
      },
      {
        title: 'Alteracoes e disponibilidade',
        body: [
          'Podemos melhorar, suspender ou alterar funcionalidades para manutencao, seguranca, cumprimento legal ou evolucao do servico.',
          'Estes termos podem ser atualizados. A versao em vigor sera a publicada nesta pagina.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Politica de Cookies e Armazenamento Local',
    intro: 'Esta pagina explica como podem ser usados cookies, armazenamento local e tecnologias semelhantes na plataforma.',
    sections: [
      {
        title: 'O que sao cookies',
        body: [
          'Cookies sao pequenos ficheiros guardados no navegador para permitir funcionamento tecnico, manter sessao, recordar preferencias e melhorar a experiencia de utilizacao.',
        ],
      },
      {
        title: 'Cookies necessarios',
        body: [
          'Podem ser usados cookies ou armazenamento local essenciais para login, seguranca, sessao, preferencias tecnicas, consentimento de cookies e funcionamento da area privada.',
          'Estes mecanismos podem envolver identificadores tecnicos, estado de sessao e informacao indispensavel ao funcionamento seguro da plataforma. Sem estes mecanismos, algumas funcionalidades podem nao funcionar corretamente.',
        ],
      },
      {
        title: 'Cookies analiticos e de melhoria',
        body: [
          'Se forem ativadas ferramentas de estatistica, estas devem ser usadas para compreender utilizacao agregada do site e melhorar a plataforma.',
          'Cookies nao essenciais, como analitica ou marketing, so devem ser ativados quando exista consentimento valido, livre, informado, especifico e revogavel.',
        ],
      },
      {
        title: 'Gestao de cookies',
        body: [
          'O utilizador pode bloquear ou apagar cookies nas definicoes do navegador. Essa decisao pode afetar login, preferencias e algumas funcionalidades.',
          'O armazenamento local fica no navegador do utilizador e pode ser apagado nas definicoes do navegador ou ao limpar dados do site.',
        ],
      },
      {
        title: 'Relacao com o RGPD',
        body: [
          'Quando cookies, armazenamento local ou tecnologias semelhantes permitirem identificar direta ou indiretamente um utilizador, o respetivo tratamento e enquadrado pela Politica de Privacidade e pelo RGPD.',
          'A base legal pode variar entre necessidade tecnica, interesse legitimo ou consentimento, consoante a finalidade e a natureza do cookie ou tecnologia utilizada.',
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
