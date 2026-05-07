import { Institution, NeedItem } from '../types'

const n = (
  id: string, category: string, subcategory: string, description: string,
  urgency: 'alta' | 'media' | 'baixa', sdgGoals: number[], esgPillar: 'E' | 'S' | 'G',
  impactMetric: string, estimatedValue?: number, beneficiaries?: number, quantity?: string
): NeedItem => {
  const securedFundingById: Record<string, number> = {
    'n1-2': 6000,
    'n2-1': 45000,
    'n4-1': 18000,
    'n5-2': 32000,
    'n7-1': 25000,
    'n10-1': 41000,
    'n15-1': 55000,
  }
  const productKeywords = ['material', 'equipamento', 'hardware', 'veículo', 'carrinha', 'sensores', 'software', 'árvores', 'unidade', 'kits']
  const text = `${category} ${subcategory} ${description} ${quantity || ''}`.toLowerCase()
  const supportType = productKeywords.some(keyword => text.includes(keyword)) ? 'produtos' : 'dinheiro'
  return {
    id,
    category,
    subcategory,
    description,
    urgency,
    sdgGoals,
    esgPillar,
    impactMetric,
    estimatedValue,
    beneficiaries,
    quantity,
    supportType,
    implementationPhase: securedFundingById[id] ? 'a-decorrer' : 'candidatura',
    requestedAmount: supportType === 'dinheiro' ? estimatedValue : undefined,
    productOrService: supportType === 'produtos' ? subcategory : undefined,
    totalProjectCost: estimatedValue,
    securedFunding: securedFundingById[id] || 0,
    status: 'ativo',
  }
}

export const sampleInstitutions: Institution[] = [

  // ─── 1. INFÂNCIA E JUVENTUDE ───────────────────
  {
    id: '1', name: 'Associação Crescer Juntos',
    legalName: 'Associação de Apoio à Infância Crescer Juntos', category: 'Infância e Juventude',
    description: 'Apoio integral a crianças e jovens em situação de vulnerabilidade social nos concelhos de Setúbal e Palmela.',
    mission: 'Garantir que nenhuma criança fica para trás.', logo: '👶',
    municipality: 'Setúbal', district: 'Setúbal', peopleReachedPerYear: 1200, volunteers: 85, fullTimeStaff: 12,
    annualBudget: '250.000€ - 500.000€', utilidadePublica: true, verified: true,
    needs: [
      n('n1-1', 'Educação', 'Material Escolar', 'Mochilas, cadernos, material de escrita e livros para 200 crianças do 1.º ao 6.º ano', 'alta', [4], 'S', '200 crianças com material escolar durante 1 ano letivo', 8000, 200, '200 kits'),
      n('n1-2', 'Alimentação', 'Refeições', 'Financiamento de refeições diárias para crianças em pobreza alimentar severa', 'alta', [2, 3], 'S', 'Eliminação da pobreza alimentar nas crianças apoiadas', 24000, 80),
      n('n1-3', 'Tecnologia', 'Equipamento Informático', 'Tablets e computadores portáteis para laboratório digital', 'media', [4, 10], 'S', '150 crianças com acesso a literacia digital', 15000, 150, '30 unidades'),
      n('n1-4', 'Saúde', 'Saúde Mental', 'Sessões de psicologia para crianças e famílias em crise', 'alta', [3, 10], 'S', '60 famílias com acompanhamento psicológico', 18000, 180),
    ],
    esgScore: { environmental: 52, social: 91, governance: 78, total: 78, sdgAlignment: [2, 3, 4, 10], beneficiaries: 1200,
      impactNarrative: 'Impacto direto na redução da desigualdade infantil e promoção da educação.',
      highlights: ['1.200 crianças/ano', '85 voluntários ativos', 'Estatuto de Utilidade Pública'],
      risks: ['Dependência de financiamento público', 'Rotatividade de voluntários'] },
  },

  // ─── 2. SAÚDE ──────────────────────────────────
  {
    id: '2', name: 'Centro de Reabilitação Horizonte',
    legalName: 'Centro de Medicina de Reabilitação Horizonte, CRL', category: 'Saúde',
    description: 'Reabilitação física e psicossocial de pessoas com deficiência adquirida e congénita.',
    mission: 'Promover a autonomia e a inclusão plena de pessoas com deficiência.', logo: '♿',
    municipality: 'Lisboa', district: 'Lisboa', peopleReachedPerYear: 450, volunteers: 30, fullTimeStaff: 28,
    annualBudget: '500.000€ - 1.000.000€', utilidadePublica: true, verified: true,
    needs: [
      n('n2-1', 'Saúde', 'Equipamento Médico', 'Exosqueleto robótico para reabilitação neuromotora de doentes com AVC', 'alta', [3, 10], 'S', 'Redução do tempo de reabilitação em 40% para 30 doentes/ano', 180000, 30, '1 unidade'),
      n('n2-2', 'Mobilidade', 'Transporte Adaptado', 'Veículo adaptado para deslocações de doentes sem autonomia', 'alta', [10, 11], 'S', '120 doentes sem transporte beneficiados', 65000, 120, '1 veículo'),
      n('n2-3', 'Tecnologia', 'Realidade Virtual', 'Licenças e hardware para realidade virtual em fisioterapia', 'media', [3], 'S', '50 pacientes/mês com terapia imersiva', 35000, 600),
    ],
    esgScore: { environmental: 44, social: 88, governance: 85, total: 76, sdgAlignment: [3, 10, 11], beneficiaries: 450,
      impactNarrative: 'Intervenção especializada que restaura a autonomia de pessoas com deficiência.',
      highlights: ['28 profissionais de saúde', 'Taxa de sucesso 73%', 'Parceria com 3 hospitais'],
      risks: ['Equipamentos com manutenção dispendiosa', 'Listas de espera longas'] },
  },

  // ─── 3. CULTURA E PATRIMÓNIO ──────────────────
  {
    id: '3', name: 'Fundação Arte & Memória',
    legalName: 'Fundação para a Preservação do Património Cultural Português', category: 'Cultura e Património',
    description: 'Preservação, investigação e divulgação do património cultural imaterial e das artes contemporâneas.',
    mission: 'Garantir que a identidade cultural portuguesa é preservada para as gerações futuras.', logo: '🎨',
    municipality: 'Porto', district: 'Porto', peopleReachedPerYear: 35000, volunteers: 55, fullTimeStaff: 18,
    annualBudget: '250.000€ - 500.000€', utilidadePublica: true, verified: true,
    needs: [
      n('n3-1', 'Cultura', 'Digitalização', 'Digitalização de 15.000 documentos históricos em risco de degradação', 'alta', [11, 4], 'E', 'Preservação permanente de 15.000 documentos do séc. XVIII-XIX', 45000, 35000, '15.000 docs'),
      n('n3-2', 'Cultura', 'Exposições', 'Itinerância nacional de exposição sobre artistas contemporâneos', 'media', [11], 'S', '20.000 visitantes em 8 cidades', 38000, 20000),
      n('n3-3', 'Educação', 'Programas Escolares', 'Oficinas de artes para escolas em territórios de baixa densidade cultural', 'media', [4, 11], 'S', '3.000 alunos com formação artística gratuita', 22000, 3000),
    ],
    esgScore: { environmental: 68, social: 75, governance: 80, total: 74, sdgAlignment: [4, 11], beneficiaries: 35000,
      impactNarrative: 'Preservação do capital cultural que define a identidade portuguesa.',
      highlights: ['35.000 visitantes/ano', '50.000+ obras catalogadas', '8 parcerias universitárias'],
      risks: ['Dependência de mecenas para grandes projetos', 'Degradação acelerada de espólios'] },
  },

  // ─── 4. AMBIENTE ──────────────────────────────
  {
    id: '4', name: 'Associação Raiz Verde',
    legalName: 'Associação Portuguesa para a Sustentabilidade Ambiental', category: 'Ambiente',
    description: 'Projetos de reflorestação, educação ambiental e monitorização de ecossistemas em risco.',
    mission: 'Combater as alterações climáticas através da ação local e da sensibilização ambiental.', logo: '🌳',
    municipality: 'Évora', district: 'Évora', peopleReachedPerYear: 8000, volunteers: 200, fullTimeStaff: 9,
    annualBudget: '100.000€ - 250.000€', utilidadePublica: false, verified: true,
    needs: [
      n('n4-1', 'Ambiente', 'Reflorestação', 'Plantação de 50.000 árvores autóctones no Alentejo com monitorização', 'alta', [13, 15], 'E', 'Captura estimada de 500 ton CO₂/ano; recuperação de 25ha', 75000, 8000, '50.000 árvores'),
      n('n4-2', 'Ambiente', 'Monitorização', 'Estações meteorológicas e sensores IoT para biodiversidade', 'media', [13, 15], 'E', 'Cobertura de monitorização de 200km²', 28000, 8000, '10 estações'),
      n('n4-3', 'Educação', 'Sensibilização', 'Programa de educação ambiental em 50 escolas do Alentejo', 'media', [4, 13], 'E', '12.000 alunos sensibilizados para alterações climáticas', 18000, 12000),
    ],
    esgScore: { environmental: 96, social: 65, governance: 60, total: 74, sdgAlignment: [4, 13, 15], beneficiaries: 8000,
      impactNarrative: 'Ação direta na mitigação climática e preservação da biodiversidade.',
      highlights: ['200 voluntários ativos', '500 ton CO₂/ano', 'Parceria com Agência do Ambiente'],
      risks: ['Dependência de voluntários', 'Risco de incêndios sobre áreas reflorestadas'] },
  },

  // ─── 5. DESPORTO ──────────────────────────────
  {
    id: '5', name: 'Academia Desportiva Inclusiva',
    legalName: 'Academia Desportiva para a Inclusão Social, IPSS', category: 'Desporto',
    description: 'Promoção do desporto como veículo de inclusão social, combate ao abandono escolar e saúde comunitária.',
    mission: 'Usar o desporto para transformar vidas e construir comunidades mais coesas.', logo: '⚽',
    municipality: 'Amadora', district: 'Lisboa', peopleReachedPerYear: 2800, volunteers: 120, fullTimeStaff: 15,
    annualBudget: '250.000€ - 500.000€', utilidadePublica: false, verified: true,
    needs: [
      n('n5-1', 'Desporto', 'Equipamento', 'Equipamento desportivo completo para 8 modalidades', 'alta', [3, 10], 'S', '600 jovens com acesso a equipamento adequado', 35000, 600),
      n('n5-2', 'Infraestrutura', 'Instalações', 'Requalificação do campo multiusos e balneários acessíveis', 'alta', [10, 11], 'S', 'Aumento de capacidade em 40%', 120000, 2800),
      n('n5-3', 'Social', 'Bolsas', 'Bolsas de participação para jovens em carência económica', 'alta', [1, 10], 'S', '150 jovens sem barreiras ao desporto', 22000, 150),
    ],
    esgScore: { environmental: 38, social: 87, governance: 70, total: 68, sdgAlignment: [1, 3, 10, 11], beneficiaries: 2800,
      impactNarrative: 'O desporto como alavanca de coesão social e redução de desigualdades.',
      highlights: ['Retenção escolar 30% acima da média', '8 modalidades inclusivas', 'IPSS reconhecida'],
      risks: ['Instalações degradadas', 'Dependência de quotas de sócios'] },
  },

  // ─── 6. CIÊNCIA ───────────────────────────────
  {
    id: '6', name: 'Instituto de Investigação Oceânica',
    legalName: 'Instituto Português de Investigação e Monitorização Oceânica', category: 'Ciência e Investigação',
    description: 'Investigação científica sobre ecossistemas marinhos, alterações climáticas e conservação dos oceanos.',
    mission: 'Produzir conhecimento que proteja os oceanos e informe políticas públicas.', logo: '🔬',
    municipality: 'Faro', district: 'Faro', peopleReachedPerYear: 500, volunteers: 25, fullTimeStaff: 22,
    annualBudget: '500.000€ - 1.000.000€', utilidadePublica: true, verified: true,
    needs: [
      n('n6-1', 'Ciência', 'Equipamento Laboratorial', 'Espectrómetro de massa e equipamento de análise de microplásticos', 'alta', [14], 'E', '5 estudos/ano sobre contaminação marinha', 220000, 500, '1 set'),
      n('n6-2', 'Ciência', 'Bolsas', '5 bolsas de doutoramento em oceanografia', 'alta', [4, 14], 'S', '5 investigadores formados; 15+ publicações', 150000, 5, '5 bolsas'),
      n('n6-3', 'Tecnologia', 'Drones Submarinos', 'Drones de exploração submarina para monitorização de recifes', 'media', [14, 15], 'E', 'Monitorização de 500km² de fundo marinho/ano', 85000, 500, '3 unidades'),
    ],
    esgScore: { environmental: 95, social: 60, governance: 88, total: 81, sdgAlignment: [4, 14, 15], beneficiaries: 500,
      impactNarrative: 'Investigação de fronteira que sustenta políticas de proteção oceânica.',
      highlights: ['22 investigadores', '40+ publicações/ano', 'Parceria IPMA e universidades'],
      risks: ['Dependência de financiamento FCT', 'Equipamentos com ciclos de vida curtos'] },
  },

  // ─── 7. AÇÃO SOCIAL — ALIMENTAR ───────────────
  {
    id: '7', name: 'Banco Alimentar do Porto',
    legalName: 'Banco Alimentar Contra a Fome — Porto', category: 'Ação Social',
    description: 'Recolha, triagem e distribuição de alimentos a instituições sociais do Grande Porto.',
    mission: 'Combater o desperdício alimentar e a fome em Portugal.', logo: '🍽️',
    municipality: 'Porto', district: 'Porto', peopleReachedPerYear: 42000, volunteers: 3200, fullTimeStaff: 18,
    annualBudget: '500.000€ - 1.000.000€', utilidadePublica: true, verified: true,
    needs: [
      n('n7-1', 'Alimentação', 'Logística', 'Câmara frigorífica industrial para armazenamento de frescos', 'alta', [2, 12], 'E', 'Capacidade de armazenar 15 ton de frescos; redução de 30% do desperdício', 95000, 42000, '1 unidade'),
      n('n7-2', 'Alimentação', 'Transporte', 'Carrinha frigorífica para recolha e distribuição diária', 'alta', [2, 11], 'S', 'Aumento de 40% na capacidade de distribuição', 55000, 42000, '1 veículo'),
      n('n7-3', 'Tecnologia', 'Software', 'Plataforma digital de gestão de stock e matching com instituições', 'media', [2, 9], 'G', 'Redução de 50% no tempo de triagem e distribuição', 18000, 42000),
      n('n7-4', 'Social', 'Voluntariado', 'Programa de formação e fidelização de voluntários regulares', 'media', [17], 'G', '500 novos voluntários formados e integrados por ano', 12000, 500),
    ],
    esgScore: { environmental: 78, social: 95, governance: 82, total: 87, sdgAlignment: [2, 9, 11, 12, 17], beneficiaries: 42000,
      impactNarrative: 'Combate à fome e ao desperdício alimentar à escala metropolitana.',
      highlights: ['42.000 pessoas apoiadas/ano', '3.200 voluntários', '250 instituições parceiras'],
      risks: ['Variabilidade das doações alimentares', 'Custos energéticos da cadeia de frio'] },
  },

  // ─── 8. INFÂNCIA — COIMBRA ────────────────────
  {
    id: '8', name: 'Casa da Criança de Coimbra',
    legalName: 'Casa da Criança de Coimbra, IPSS', category: 'Infância e Juventude',
    description: 'Acolhimento residencial e apoio socioeducativo a crianças e jovens em risco no distrito de Coimbra.',
    mission: 'Dar um lar seguro e um futuro a crianças que perderam o apoio familiar.', logo: '🏠',
    municipality: 'Coimbra', district: 'Coimbra', peopleReachedPerYear: 65, volunteers: 40, fullTimeStaff: 22,
    annualBudget: '250.000€ - 500.000€', utilidadePublica: true, verified: true,
    needs: [
      n('n8-1', 'Habitação', 'Remodelação', 'Remodelação dos quartos e casas de banho do lar de acolhimento', 'alta', [1, 11], 'S', '35 crianças com condições dignas de habitabilidade', 85000, 35),
      n('n8-2', 'Educação', 'Apoio Escolar', 'Programa de tutoria e explicações individuais para 40 crianças', 'alta', [4], 'S', 'Aumento de 25% na taxa de aprovação escolar', 16000, 40),
      n('n8-3', 'Saúde', 'Saúde Mental', 'Psicólogo e pedopsiquiatra a tempo parcial durante 12 meses', 'alta', [3], 'S', '65 crianças com acompanhamento de saúde mental', 28000, 65),
    ],
    esgScore: { environmental: 40, social: 94, governance: 75, total: 76, sdgAlignment: [1, 3, 4, 11], beneficiaries: 65,
      impactNarrative: 'Proteção e desenvolvimento integral de crianças em situação de risco.',
      highlights: ['22 profissionais dedicados', 'Taxa de reintegração familiar de 40%', 'Parceria com Segurança Social'],
      risks: ['Orçamento dependente da Segurança Social', 'Desgaste emocional da equipa'] },
  },

  // ─── 9. CULTURA — MÚSICA ──────────────────────
  {
    id: '9', name: 'Música Sem Fronteiras',
    legalName: 'Associação Música Sem Fronteiras', category: 'Cultura e Património',
    description: 'Ensino gratuito de música a crianças e jovens de bairros sociais em Lisboa, Setúbal e Faro.',
    mission: 'Democratizar o acesso à educação musical como ferramenta de inclusão social.', logo: '🎵',
    municipality: 'Lisboa', district: 'Lisboa', peopleReachedPerYear: 800, volunteers: 45, fullTimeStaff: 8,
    annualBudget: '100.000€ - 250.000€', utilidadePublica: false, verified: true,
    needs: [
      n('n9-1', 'Cultura', 'Instrumentos', 'Aquisição de 60 instrumentos musicais para 3 núcleos', 'alta', [4, 10], 'S', '200 crianças com instrumento individual durante o programa', 32000, 200, '60 instrumentos'),
      n('n9-2', 'Infraestrutura', 'Espaços', 'Insonorização e equipamento de 2 salas de ensaio', 'media', [11], 'S', 'Condições acústicas adequadas para 300 alunos', 25000, 300),
      n('n9-3', 'Social', 'Bolsas', 'Bolsas de transporte para alunos que vivem longe dos núcleos', 'media', [1, 10], 'S', '80 alunos sem barreiras de distância', 9600, 80),
    ],
    esgScore: { environmental: 35, social: 89, governance: 65, total: 68, sdgAlignment: [1, 4, 10, 11], beneficiaries: 800,
      impactNarrative: 'A música como porta de entrada para a inclusão e a autoestima.',
      highlights: ['800 alunos/ano', '3 núcleos em bairros sociais', 'Concertos públicos trimestrais'],
      risks: ['Financiamento irregular', 'Dificuldade em reter professores voluntários'] },
  },

  // ─── 10. AMBIENTE — REFLORESTAÇÃO ─────────────
  {
    id: '10', name: 'Refloresta Portugal',
    legalName: 'Refloresta — Associação Ambiental', category: 'Ambiente',
    description: 'Recuperação de áreas ardidas através da plantação de espécies autóctones e criação de corredores ecológicos.',
    mission: 'Devolver à floresta portuguesa a biodiversidade que os incêndios destruíram.', logo: '🌲',
    municipality: 'Leiria', district: 'Leiria', peopleReachedPerYear: 15000, volunteers: 350, fullTimeStaff: 6,
    annualBudget: '100.000€ - 250.000€', utilidadePublica: false, verified: true,
    needs: [
      n('n10-1', 'Ambiente', 'Reflorestação', 'Plantação de 100.000 árvores autóctones em Pinhal de Leiria', 'alta', [13, 15], 'E', 'Recuperação de 50ha de floresta; 1.000 ton CO₂/ano', 120000, 15000, '100.000 árvores'),
      n('n10-2', 'Ambiente', 'Viveiro', 'Construção de viveiro para produção de 200.000 plantas/ano', 'alta', [15], 'E', 'Autonomia na produção de plantas autóctones', 45000, 15000),
      n('n10-3', 'Educação', 'Voluntariado', 'Programa de voluntariado corporativo com 50 empresas/ano', 'media', [13, 17], 'G', '2.000 voluntários corporativos envolvidos/ano', 15000, 2000),
    ],
    esgScore: { environmental: 98, social: 62, governance: 58, total: 73, sdgAlignment: [13, 15, 17], beneficiaries: 15000,
      impactNarrative: 'Recuperação florestal e envolvimento comunitário pós-incêndio.',
      highlights: ['350 voluntários regulares', '1.000 ton CO₂/ano', 'Parceria com ICNF'],
      risks: ['Vulnerabilidade a novos incêndios', 'Financiamento sazonal'] },
  },

  // ─── 11. AÇÃO SOCIAL — IDOSOS ─────────────────
  {
    id: '11', name: 'Apoio Maior — Idosos',
    legalName: 'Apoio Maior — Centro de Dia e Apoio Domiciliário, IPSS', category: 'Ação Social',
    description: 'Combate ao isolamento de idosos através de centro de dia, apoio domiciliário e atividades intergeracionais.',
    mission: 'Nenhum idoso deve viver sozinho ou esquecido.', logo: '👴',
    municipality: 'Bragança', district: 'Bragança', peopleReachedPerYear: 320, volunteers: 60, fullTimeStaff: 14,
    annualBudget: '100.000€ - 250.000€', utilidadePublica: true, verified: true,
    needs: [
      n('n11-1', 'Saúde', 'Cuidados ao Domicílio', 'Equipa de enfermagem para apoio ao domicílio 7 dias/semana', 'alta', [3], 'S', '180 idosos com cuidados de saúde ao domicílio', 48000, 180),
      n('n11-2', 'Mobilidade', 'Transporte', 'Carrinha adaptada para transporte de idosos com mobilidade reduzida', 'alta', [10, 11], 'S', '120 idosos com acesso a transporte diário', 42000, 120, '1 veículo'),
      n('n11-3', 'Social', 'Atividades', 'Programa intergeracional com escolas locais', 'media', [3, 10], 'S', '200 idosos e 300 crianças em atividades conjuntas', 8000, 500),
      n('n11-4', 'Tecnologia', 'Teleassistência', 'Sistema de teleassistência com botão de emergência para 100 idosos', 'alta', [3, 9], 'S', 'Redução de 60% no tempo de resposta a emergências', 15000, 100, '100 dispositivos'),
    ],
    esgScore: { environmental: 30, social: 92, governance: 72, total: 70, sdgAlignment: [3, 9, 10, 11], beneficiaries: 320,
      impactNarrative: 'Combate ao isolamento e à solidão em territórios envelhecidos do interior.',
      highlights: ['320 idosos apoiados', '60 voluntários', 'Cobertura de 12 freguesias rurais'],
      risks: ['Despovoamento agrava a logística', 'Custos de transporte elevados no interior'] },
  },

  // ─── 12. EDUCAÇÃO — TECNOLOGIA ────────────────
  {
    id: '12', name: 'CodeKids — Programação para Todos',
    legalName: 'Associação CodeKids', category: 'Educação',
    description: 'Ensino de programação, robótica e pensamento computacional a crianças de comunidades desfavorecidas.',
    mission: 'Garantir que a literacia digital não é um privilégio.', logo: '💻',
    municipality: 'Braga', district: 'Braga', peopleReachedPerYear: 1500, volunteers: 70, fullTimeStaff: 5,
    annualBudget: '50.000€ - 100.000€', utilidadePublica: false, verified: true,
    needs: [
      n('n12-1', 'Tecnologia', 'Hardware', '50 Raspberry Pi + kits de robótica para 5 escolas', 'alta', [4, 9], 'S', '500 alunos com acesso a programação e robótica', 12000, 500, '50 kits'),
      n('n12-2', 'Educação', 'Formação', 'Formação de 20 professores em metodologias STEAM', 'media', [4], 'G', '20 professores certificados; efeito multiplicador em 2.000 alunos', 8000, 20),
      n('n12-3', 'Social', 'Inclusão', 'Bolsas de participação para alunos de famílias carenciadas', 'media', [1, 4, 10], 'S', '200 alunos sem barreiras económicas', 6000, 200),
    ],
    esgScore: { environmental: 42, social: 85, governance: 68, total: 69, sdgAlignment: [1, 4, 9, 10], beneficiaries: 1500,
      impactNarrative: 'Democratização da literacia digital e do pensamento computacional.',
      highlights: ['1.500 alunos/ano', '5 escolas parceiras', 'Método pedagógico próprio'],
      risks: ['Equipamentos com obsolescência rápida', 'Financiamento por projeto'] },
  },

  // ─── 13. CULTURA — TEATRO ─────────────────────
  {
    id: '13', name: 'Teatro Social de Lisboa',
    legalName: 'Teatro Social de Lisboa — Associação Cultural', category: 'Cultura e Património',
    description: 'Produção teatral com elencos mistos de atores profissionais e pessoas em situação de exclusão social.',
    mission: 'Dar palco a quem a sociedade tirou a voz.', logo: '🎭',
    municipality: 'Lisboa', district: 'Lisboa', peopleReachedPerYear: 5000, volunteers: 35, fullTimeStaff: 6,
    annualBudget: '50.000€ - 100.000€', utilidadePublica: false, verified: true,
    needs: [
      n('n13-1', 'Cultura', 'Produção', 'Produção de 3 espetáculos/ano com elencos mistos', 'alta', [10, 16], 'S', '5.000 espetadores; 30 pessoas em exclusão integradas', 35000, 5030),
      n('n13-2', 'Infraestrutura', 'Equipamento', 'Sistema de iluminação e som para espaço polivalente', 'media', [11], 'S', 'Condições técnicas para 50 apresentações/ano', 18000, 5000),
      n('n13-3', 'Social', 'Workshops', 'Workshops de expressão dramática em prisões e centros de acolhimento', 'alta', [10, 16], 'S', '120 reclusos e 80 pessoas acolhidas participantes', 12000, 200),
    ],
    esgScore: { environmental: 32, social: 90, governance: 62, total: 67, sdgAlignment: [10, 11, 16], beneficiaries: 5000,
      impactNarrative: 'O teatro como instrumento de reintegração e visibilidade social.',
      highlights: ['Elencos mistos únicos em Portugal', '5.000 espetadores/ano', 'Parceria com DGRSP'],
      risks: ['Financiamento cultural instável', 'Dificuldade em manter elencos'] },
  },

  // ─── 14. AMBIENTE — ANIMAIS ───────────────────
  {
    id: '14', name: 'Animais em Risco',
    legalName: 'Associação Animais em Risco', category: 'Ambiente',
    description: 'Resgate, reabilitação e adoção responsável de animais abandonados e maltratados.',
    mission: 'Proteger os animais que a sociedade descartou.', logo: '🐾',
    municipality: 'Sintra', district: 'Lisboa', peopleReachedPerYear: 3500, volunteers: 180, fullTimeStaff: 8,
    annualBudget: '100.000€ - 250.000€', utilidadePublica: false, verified: true,
    needs: [
      n('n14-1', 'Saúde', 'Veterinária', 'Clínica veterinária para esterilização, vacinação e tratamento de 800 animais/ano', 'alta', [15], 'E', '800 animais com cuidados veterinários; redução de 40% na sobrepopulação', 60000, 800),
      n('n14-2', 'Infraestrutura', 'Abrigo', 'Ampliação do abrigo com 30 novos canis cobertos e aquecidos', 'alta', [15, 11], 'E', '30 animais adicionais em condições dignas', 45000, 30, '30 canis'),
      n('n14-3', 'Educação', 'Sensibilização', 'Programa de sensibilização em 40 escolas sobre posse responsável', 'media', [4, 15], 'S', '8.000 alunos sensibilizados para bem-estar animal', 10000, 8000),
      n('n14-4', 'Alimentação', 'Ração', 'Ração e alimentação para 200 animais em abrigo durante 12 meses', 'alta', [15], 'E', '200 animais alimentados diariamente', 24000, 200),
    ],
    esgScore: { environmental: 85, social: 70, governance: 55, total: 71, sdgAlignment: [4, 11, 15], beneficiaries: 3500,
      impactNarrative: 'Proteção animal com impacto direto na saúde pública e no bem-estar comunitário.',
      highlights: ['180 voluntários', '600 adoções/ano', 'Taxa de reincidência de abandono <5%'],
      risks: ['Custos veterinários imprevisíveis', 'Capacidade do abrigo no limite'] },
  },

  // ─── 15. AÇÃO SOCIAL — HABITAÇÃO ──────────────
  {
    id: '15', name: 'Habitação Solidária',
    legalName: 'Habitação Solidária — Cooperativa de Solidariedade Social', category: 'Ação Social',
    description: 'Reabilitação de habitações degradadas de famílias em pobreza extrema e construção de alojamento de emergência.',
    mission: 'Uma casa digna é um direito, não um privilégio.', logo: '🏗️',
    municipality: 'Viseu', district: 'Viseu', peopleReachedPerYear: 120, volunteers: 90, fullTimeStaff: 10,
    annualBudget: '250.000€ - 500.000€', utilidadePublica: true, verified: true,
    needs: [
      n('n15-1', 'Habitação', 'Remodelação', 'Reabilitação de 15 habitações degradadas em freguesias rurais', 'alta', [1, 11], 'S', '15 famílias (60 pessoas) com condições habitacionais dignas', 180000, 60, '15 casas'),
      n('n15-2', 'Habitação', 'Alojamento de Emergência', 'Construção de 5 módulos de alojamento temporário', 'alta', [1, 11], 'S', '20 pessoas em situação de emergência com abrigo imediato', 75000, 20, '5 módulos'),
      n('n15-3', 'Social', 'Integração', 'Programa de acompanhamento social pós-realojamento durante 12 meses', 'media', [1, 10], 'G', '40 famílias com acompanhamento para autonomia', 20000, 120),
      n('n15-4', 'Ambiente', 'Eficiência Energética', 'Instalação de painéis solares e isolamento térmico em 10 casas', 'media', [7, 13], 'E', 'Redução de 50% nos custos energéticos de 10 famílias', 35000, 40),
    ],
    esgScore: { environmental: 65, social: 93, governance: 80, total: 82, sdgAlignment: [1, 7, 10, 11, 13], beneficiaries: 120,
      impactNarrative: 'Habitação digna como base para a reintegração social de famílias em pobreza extrema.',
      highlights: ['90 voluntários (muitos com competências técnicas)', 'Parceria com câmaras municipais', 'Estatuto de Utilidade Pública'],
      risks: ['Custos de materiais de construção voláteis', 'Dependência de voluntários especializados'] },
  },
]
