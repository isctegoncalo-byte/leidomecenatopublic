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
    { key: 'peopleWithIncomeSupport', label: 'Pessoas com apoio financeiro/social direto', type: 'number' },
    { key: 'basicNeedsCovered', label: 'Necessidades básicas cobertas', type: 'text', placeholder: 'Ex: alimentação, higiene, habitação' },
    { key: 'householdsStabilized', label: 'Agregados familiares estabilizados', type: 'number' },
    { key: 'povertyRiskReduced', label: 'Casos com redução de risco social', type: 'number' },
  ],
  2: [
    { key: 'mealsProvided', label: 'Refeições/cabazes financiados', type: 'number' },
    { key: 'peopleWithFoodSupport', label: 'Pessoas com apoio alimentar regular', type: 'number' },
    { key: 'foodWasteReducedKg', label: 'Desperdício alimentar reduzido (kg)', type: 'number' },
    { key: 'freshFoodDistributedKg', label: 'Alimentos frescos distribuídos (kg)', type: 'number' },
    { key: 'nutritionActions', label: 'Ações de educação alimentar realizadas', type: 'number' },
  ],
  3: [
    { key: 'healthSessions', label: 'Consultas/sessões de saúde realizadas', type: 'number' },
    { key: 'patientsSupported', label: 'Utentes/pacientes apoiados', type: 'number' },
    { key: 'screeningsPerformed', label: 'Rastreios ou avaliações realizados', type: 'number' },
    { key: 'therapyHours', label: 'Horas de terapia/acompanhamento clínico', type: 'number' },
    { key: 'healthOutcomesImproved', label: 'Casos com evolução clínica positiva', type: 'number' },
  ],
  4: [
    { key: 'studentsSupported', label: 'Alunos/crianças apoiadas', type: 'number' },
    { key: 'learningHours', label: 'Horas de formação/aprendizagem', type: 'number' },
    { key: 'schoolRetention', label: 'Alunos com melhoria de assiduidade/retenção', type: 'number' },
    { key: 'teachersEducatorsInvolved', label: 'Professores/educadores envolvidos', type: 'number' },
    { key: 'learningMaterialsDelivered', label: 'Materiais educativos entregues', type: 'number' },
  ],
  5: [
    { key: 'womenGirlsSupported', label: 'Mulheres/raparigas apoiadas', type: 'number' },
    { key: 'genderActions', label: 'Ações de igualdade implementadas', type: 'number' },
    { key: 'safeSpacesCreated', label: 'Espaços seguros ou sessões de apoio criados', type: 'number' },
    { key: 'leadershipParticipants', label: 'Participantes em liderança/capacitação', type: 'number' },
    { key: 'genderAwarenessParticipants', label: 'Pessoas abrangidas por sensibilização', type: 'number' },
  ],
  6: [
    { key: 'peopleWithWaterAccess', label: 'Pessoas com acesso melhorado a água/saneamento', type: 'number' },
    { key: 'waterSavedLiters', label: 'Litros de água poupados/tratados', type: 'number' },
    { key: 'sanitationFacilitiesImproved', label: 'Infraestruturas de saneamento melhoradas', type: 'number' },
    { key: 'waterQualityTests', label: 'Análises/testes de qualidade realizados', type: 'number' },
    { key: 'hygieneActions', label: 'Ações de higiene e sensibilização', type: 'number' },
  ],
  7: [
    { key: 'energySavedKwh', label: 'Energia poupada/produzida (kWh)', type: 'number' },
    { key: 'familiesEnergySupported', label: 'Famílias apoiadas em energia', type: 'number' },
    { key: 'renewableCapacityInstalled', label: 'Capacidade renovável instalada (kW)', type: 'number' },
    { key: 'energyBillsReduced', label: 'Redução estimada de custos energéticos (€)', type: 'number' },
    { key: 'homesImprovedEnergy', label: 'Casas/equipamentos com eficiência melhorada', type: 'number' },
  ],
  8: [
    { key: 'jobsCreated', label: 'Empregos/estágios criados', type: 'number' },
    { key: 'peopleTrainedWork', label: 'Pessoas formadas para empregabilidade', type: 'number' },
    { key: 'trainingHoursWork', label: 'Horas de formação profissional', type: 'number' },
    { key: 'peoplePlacedWork', label: 'Pessoas integradas em emprego/estágio', type: 'number' },
    { key: 'localSuppliersInvolved', label: 'Fornecedores/parceiros locais envolvidos', type: 'number' },
  ],
  9: [
    { key: 'equipmentUnits', label: 'Equipamentos/infraestruturas instalados', type: 'number' },
    { key: 'innovationOutputs', label: 'Resultados de inovação gerados', type: 'text', placeholder: 'Ex: protótipos, publicações, sistemas' },
    { key: 'usersWithTechAccess', label: 'Pessoas com acesso a tecnologia/infraestrutura', type: 'number' },
    { key: 'digitalToolsImplemented', label: 'Ferramentas digitais implementadas', type: 'number' },
    { key: 'serviceCapacityIncrease', label: 'Aumento de capacidade de serviço (%)', type: 'number' },
  ],
  10: [
    { key: 'vulnerablePeopleSupported', label: 'Pessoas vulneráveis apoiadas', type: 'number' },
    { key: 'accessBarriersRemoved', label: 'Barreiras de acesso removidas', type: 'number' },
    { key: 'inclusionActivities', label: 'Atividades de inclusão realizadas', type: 'number' },
    { key: 'minorityParticipants', label: 'Participantes de grupos sub-representados', type: 'number' },
    { key: 'accessibilityImprovements', label: 'Melhorias de acessibilidade implementadas', type: 'number' },
  ],
  11: [
    { key: 'communityUsers', label: 'Utilizadores da comunidade beneficiados', type: 'number' },
    { key: 'spacesImproved', label: 'Espaços/instalações melhorados', type: 'number' },
    { key: 'communityActivities', label: 'Atividades comunitárias realizadas', type: 'number' },
    { key: 'housingUnitsImproved', label: 'Habitações/infraestruturas requalificadas', type: 'number' },
    { key: 'localResilienceActions', label: 'Ações de resiliência local realizadas', type: 'number' },
  ],
  12: [
    { key: 'materialsReusedKg', label: 'Materiais reutilizados/reciclados (kg)', type: 'number' },
    { key: 'wasteAvoidedKg', label: 'Resíduos evitados (kg)', type: 'number' },
    { key: 'itemsReused', label: 'Produtos/equipamentos reutilizados', type: 'number' },
    { key: 'circularEconomyActions', label: 'Ações de economia circular', type: 'number' },
    { key: 'consumptionAwarenessParticipants', label: 'Pessoas sensibilizadas para consumo responsável', type: 'number' },
  ],
  13: [
    { key: 'co2AvoidedKg', label: 'CO₂ evitado/capturado (kg)', type: 'number' },
    { key: 'climateActions', label: 'Ações climáticas realizadas', type: 'number' },
    { key: 'peopleClimatePrepared', label: 'Pessoas abrangidas por adaptação climática', type: 'number' },
    { key: 'greenAreaCreated', label: 'Área verde criada/recuperada (m²)', type: 'number' },
    { key: 'climateRiskReduction', label: 'Medidas de redução de risco implementadas', type: 'number' },
  ],
  14: [
    { key: 'marineAreaProtected', label: 'Área marinha monitorizada/protegida', type: 'text', placeholder: 'Ex: 5 km², 20 km costa' },
    { key: 'plasticRemovedKg', label: 'Plástico removido (kg)', type: 'number' },
    { key: 'waterSamplesAnalyzed', label: 'Amostras de água analisadas', type: 'number' },
    { key: 'marineSpeciesProtected', label: 'Espécies/habitats marinhos monitorizados', type: 'number' },
    { key: 'oceanAwarenessParticipants', label: 'Pessoas envolvidas em sensibilização marinha', type: 'number' },
  ],
  15: [
    { key: 'treesPlanted', label: 'Árvores plantadas', type: 'number' },
    { key: 'landRestoredHa', label: 'Área terrestre recuperada (ha)', type: 'number' },
    { key: 'nativeSpeciesPlanted', label: 'Espécies autóctones introduzidas', type: 'number' },
    { key: 'habitatsProtected', label: 'Habitats protegidos/recuperados', type: 'number' },
    { key: 'biodiversityMonitoringActions', label: 'Ações de monitorização da biodiversidade', type: 'number' },
  ],
  16: [
    { key: 'justiceAccessActions', label: 'Ações de acesso à justiça/cidadania', type: 'number' },
    { key: 'peopleInclusionPrograms', label: 'Pessoas em programas de inclusão cívica', type: 'number' },
    { key: 'mediationSessions', label: 'Sessões de mediação/participação realizadas', type: 'number' },
    { key: 'rightsAwarenessParticipants', label: 'Pessoas sensibilizadas para direitos/cidadania', type: 'number' },
    { key: 'governanceToolsCreated', label: 'Ferramentas de transparência/governação criadas', type: 'number' },
  ],
  17: [
    { key: 'partnersInvolved', label: 'Parceiros envolvidos', type: 'number' },
    { key: 'collaborationOutputs', label: 'Resultados de parceria', type: 'text', placeholder: 'Ex: protocolos, ações, relatórios' },
    { key: 'jointInitiatives', label: 'Iniciativas conjuntas realizadas', type: 'number' },
    { key: 'resourcesMobilized', label: 'Recursos mobilizados por parceiros (€)', type: 'number' },
    { key: 'knowledgeSharingActions', label: 'Ações de partilha de conhecimento', type: 'number' },
  ],
}
