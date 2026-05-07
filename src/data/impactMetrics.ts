export interface MetricDefinition {
  key: string
  label: string
  type: 'text' | 'number' | 'select'
  placeholder?: string
  options?: string[]
}

export const GENERAL_IMPACT_METRICS: MetricDefinition[] = [
  { key: 'durationMonths', label: 'Duração prevista do projeto (meses)', type: 'number', placeholder: 'Ex: 12' },
  { key: 'geographicScope', label: 'Âmbito geográfico', type: 'text', placeholder: 'Ex: Lisboa, Porto, nacional, concelho...' },
  { key: 'indirectBeneficiaries', label: 'Beneficiários indiretos estimados', type: 'number', placeholder: 'Ex: 500' },
  { key: 'volunteersInvolved', label: 'Voluntários envolvidos', type: 'number', placeholder: 'Ex: 25' },
  {
    key: 'evidenceMethod',
    label: 'Como será comprovado o impacto',
    type: 'select',
    options: ['Fotografias', 'Lista de beneficiários', 'Relatório de execução', 'Faturas/recibos', 'Inquéritos', 'Indicadores internos', 'Outro'],
  },
  {
    key: 'reportingFrequency',
    label: 'Frequência de acompanhamento',
    type: 'select',
    options: ['Única', 'Mensal', 'Trimestral', 'Semestral', 'Anual'],
  },
]

export const ODS_IMPACT_METRICS: Record<number, MetricDefinition[]> = {
  1: [
    { key: 'familiesSupported', label: 'Famílias em situação de pobreza apoiadas', type: 'number' },
    { key: 'basicNeedsCovered', label: 'Necessidades básicas cobertas', type: 'text', placeholder: 'Ex: alimentação, higiene, habitação' },
  ],
  2: [
    { key: 'mealsProvided', label: 'Refeições/cabazes financiados', type: 'number' },
    { key: 'foodWasteReducedKg', label: 'Desperdício alimentar reduzido (kg)', type: 'number' },
  ],
  3: [
    { key: 'healthSessions', label: 'Consultas/sessões de saúde realizadas', type: 'number' },
    { key: 'patientsSupported', label: 'Utentes/pacientes apoiados', type: 'number' },
  ],
  4: [
    { key: 'studentsSupported', label: 'Alunos/crianças apoiadas', type: 'number' },
    { key: 'learningHours', label: 'Horas de formação/aprendizagem', type: 'number' },
  ],
  5: [
    { key: 'womenGirlsSupported', label: 'Mulheres/raparigas apoiadas', type: 'number' },
    { key: 'genderActions', label: 'Ações de igualdade implementadas', type: 'number' },
  ],
  6: [
    { key: 'peopleWithWaterAccess', label: 'Pessoas com acesso melhorado a água/saneamento', type: 'number' },
    { key: 'waterSavedLiters', label: 'Litros de água poupados/tratados', type: 'number' },
  ],
  7: [
    { key: 'energySavedKwh', label: 'Energia poupada/produzida (kWh)', type: 'number' },
    { key: 'familiesEnergySupported', label: 'Famílias apoiadas em energia', type: 'number' },
  ],
  8: [
    { key: 'jobsCreated', label: 'Empregos/estágios criados', type: 'number' },
    { key: 'peopleTrainedWork', label: 'Pessoas formadas para empregabilidade', type: 'number' },
  ],
  9: [
    { key: 'equipmentUnits', label: 'Equipamentos/infraestruturas instalados', type: 'number' },
    { key: 'innovationOutputs', label: 'Resultados de inovação gerados', type: 'text', placeholder: 'Ex: protótipos, publicações, sistemas' },
  ],
  10: [
    { key: 'vulnerablePeopleSupported', label: 'Pessoas vulneráveis apoiadas', type: 'number' },
    { key: 'accessBarriersRemoved', label: 'Barreiras de acesso removidas', type: 'number' },
  ],
  11: [
    { key: 'communityUsers', label: 'Utilizadores da comunidade beneficiados', type: 'number' },
    { key: 'spacesImproved', label: 'Espaços/instalações melhorados', type: 'number' },
  ],
  12: [
    { key: 'materialsReusedKg', label: 'Materiais reutilizados/reciclados (kg)', type: 'number' },
    { key: 'wasteAvoidedKg', label: 'Resíduos evitados (kg)', type: 'number' },
  ],
  13: [
    { key: 'co2AvoidedKg', label: 'CO₂ evitado/capturado (kg)', type: 'number' },
    { key: 'climateActions', label: 'Ações climáticas realizadas', type: 'number' },
  ],
  14: [
    { key: 'marineAreaProtected', label: 'Área marinha monitorizada/protegida', type: 'text', placeholder: 'Ex: 5 km², 20 km costa' },
    { key: 'plasticRemovedKg', label: 'Plástico removido (kg)', type: 'number' },
  ],
  15: [
    { key: 'treesPlanted', label: 'Árvores plantadas', type: 'number' },
    { key: 'landRestoredHa', label: 'Área terrestre recuperada (ha)', type: 'number' },
  ],
  16: [
    { key: 'justiceAccessActions', label: 'Ações de acesso à justiça/cidadania', type: 'number' },
    { key: 'peopleInclusionPrograms', label: 'Pessoas em programas de inclusão cívica', type: 'number' },
  ],
  17: [
    { key: 'partnersInvolved', label: 'Parceiros envolvidos', type: 'number' },
    { key: 'collaborationOutputs', label: 'Resultados de parceria', type: 'text', placeholder: 'Ex: protocolos, ações, relatórios' },
  ],
}
