export const opportunityRegistry = [
  {
    id: 'psychology_general',
    category: 'psychology',
    label: 'Psicología general',
    models: ['booking', 'cpl', 'revenue_share'],
    requiredSignals: ['wants_professional_psychological_help'],
    blockedSignals: ['immediate_danger', 'suicidal_crisis', 'active_violence', 'medical_emergency'],
    requiresExplicitIntent: true,
    partnerRequirements: ['licensed_professional', 'clear_pricing', 'privacy_review'],
    status: 'prepared_no_partner'
  },
  {
    id: 'couples_therapy',
    category: 'psychology',
    label: 'Terapia de pareja',
    models: ['booking', 'cpl'],
    requiredSignals: ['wants_couples_help'],
    blockedSignals: ['active_violence', 'immediate_danger'],
    requiresExplicitIntent: true,
    partnerRequirements: ['licensed_professional', 'privacy_review'],
    status: 'prepared_no_partner'
  },
  {
    id: 'dating_matchmaking',
    category: 'relationships',
    label: 'Agencia de citas o matchmaking',
    models: ['cpl', 'cpa', 'revenue_share'],
    requiredSignals: ['wants_to_meet_people_for_dating'],
    blockedSignals: ['immediate_danger', 'active_violence', 'coercion_risk'],
    requiresExplicitIntent: true,
    partnerRequirements: ['adult_only', 'identity_safety_controls', 'transparent_terms'],
    status: 'prepared_no_partner'
  },
  {
    id: 'family_mediation',
    category: 'legal_mediation',
    label: 'Mediación familiar',
    models: ['cpl', 'booking'],
    requiredSignals: ['wants_family_mediation'],
    blockedSignals: ['active_violence', 'coercion_risk', 'immediate_danger'],
    requiresExplicitIntent: true,
    partnerRequirements: ['qualified_mediator', 'clear_scope'],
    status: 'prepared_no_partner'
  },
  {
    id: 'family_lawyer',
    category: 'legal',
    label: 'Abogado de familia',
    models: ['cpl', 'booking'],
    requiredSignals: ['needs_family_legal_advice'],
    blockedSignals: [],
    requiresExplicitIntent: false,
    partnerRequirements: ['qualified_lawyer', 'jurisdiction_match', 'fee_disclosure'],
    status: 'prepared_no_partner'
  },
  {
    id: 'debt_consolidation',
    category: 'finance',
    label: 'Reunificación o consolidación de deudas',
    models: ['cpl', 'cpa', 'revenue_share'],
    requiredSignals: ['multiple_debts', 'wants_lower_monthly_payment'],
    blockedSignals: ['immediate_danger', 'no_basic_needs_covered', 'unknown_payment_capacity'],
    requiresExplicitIntent: true,
    partnerRequirements: ['regulated_or_authorized_partner', 'total_cost_disclosure', 'no_guaranteed_approval_claims', 'financial_compliance_review'],
    status: 'prepared_no_partner'
  },
  {
    id: 'debt_legal_advice',
    category: 'legal_finance',
    label: 'Asesoramiento jurídico sobre insolvencia o deudas',
    models: ['cpl', 'booking'],
    requiredSignals: ['persistent_insolvency_or_enforcement'],
    blockedSignals: [],
    requiresExplicitIntent: false,
    partnerRequirements: ['qualified_lawyer', 'jurisdiction_match', 'fee_disclosure'],
    status: 'prepared_no_partner'
  },
  {
    id: 'mortgage_help',
    category: 'finance',
    label: 'Revisión o intermediación hipotecaria',
    models: ['cpl', 'cpa'],
    requiredSignals: ['mortgage_problem', 'wants_mortgage_options'],
    blockedSignals: ['unknown_payment_capacity'],
    requiresExplicitIntent: true,
    partnerRequirements: ['registered_credit_intermediary_if_applicable', 'total_cost_disclosure', 'financial_compliance_review'],
    status: 'prepared_no_partner'
  },
  {
    id: 'insurance_review',
    category: 'insurance',
    label: 'Comparación o revisión de seguros',
    models: ['cpl', 'cpa', 'affiliate'],
    requiredSignals: ['wants_insurance_review'],
    blockedSignals: [],
    requiresExplicitIntent: true,
    partnerRequirements: ['regulated_distribution_compliance', 'pricing_transparency'],
    status: 'prepared_no_partner'
  },
  {
    id: 'energy_comparison',
    category: 'utilities',
    label: 'Comparación de energía',
    models: ['cpl', 'cpa', 'affiliate'],
    requiredSignals: ['wants_lower_energy_cost'],
    blockedSignals: ['immediate_service_cutoff_without_support_review'],
    requiresExplicitIntent: true,
    partnerRequirements: ['transparent_tariff_comparison', 'no_hidden_fees'],
    status: 'prepared_no_partner'
  },
  {
    id: 'telecom_comparison',
    category: 'utilities',
    label: 'Comparación de telecomunicaciones',
    models: ['cpl', 'cpa', 'affiliate'],
    requiredSignals: ['wants_lower_telecom_cost'],
    blockedSignals: [],
    requiresExplicitIntent: true,
    partnerRequirements: ['transparent_tariff_comparison'],
    status: 'prepared_no_partner'
  },
  {
    id: 'job_search_services',
    category: 'employment',
    label: 'Servicios de búsqueda de empleo',
    models: ['affiliate', 'cpl', 'subscription'],
    requiredSignals: ['actively_looking_for_job'],
    blockedSignals: [],
    requiresExplicitIntent: false,
    partnerRequirements: ['no_pay_for_job_access', 'transparent_terms'],
    status: 'prepared_no_partner'
  },
  {
    id: 'training_courses',
    category: 'education',
    label: 'Formación y cursos',
    models: ['affiliate', 'cpa', 'revenue_share'],
    requiredSignals: ['wants_training_or_reskilling'],
    blockedSignals: [],
    requiresExplicitIntent: true,
    partnerRequirements: ['clear_price', 'outcome_claims_review'],
    status: 'prepared_no_partner'
  },
  {
    id: 'cv_coaching',
    category: 'employment',
    label: 'CV y orientación profesional',
    models: ['booking', 'affiliate', 'cpl'],
    requiredSignals: ['wants_cv_or_career_help'],
    blockedSignals: [],
    requiresExplicitIntent: true,
    partnerRequirements: ['transparent_pricing'],
    status: 'prepared_no_partner'
  },
  {
    id: 'home_care',
    category: 'care',
    label: 'Ayuda a domicilio y cuidadores',
    models: ['cpl', 'booking', 'marketplace'],
    requiredSignals: ['needs_home_care'],
    blockedSignals: ['medical_emergency', 'immediate_danger'],
    requiresExplicitIntent: false,
    partnerRequirements: ['identity_checks', 'care_quality_controls', 'privacy_review'],
    status: 'prepared_no_partner'
  },
  {
    id: 'senior_residence',
    category: 'care',
    label: 'Residencias y centros de mayores',
    models: ['cpl', 'booking', 'marketplace'],
    requiredSignals: ['looking_for_residential_care'],
    blockedSignals: ['medical_emergency'],
    requiresExplicitIntent: true,
    partnerRequirements: ['licensed_provider', 'transparent_pricing', 'quality_controls'],
    status: 'prepared_no_partner'
  },
  {
    id: 'home_services',
    category: 'home',
    label: 'Servicios del hogar',
    models: ['cpl', 'booking', 'marketplace'],
    requiredSignals: ['needs_home_service'],
    blockedSignals: ['immediate_danger'],
    requiresExplicitIntent: true,
    partnerRequirements: ['provider_identity_checks', 'pricing_transparency'],
    status: 'prepared_no_partner'
  }
];

export const globalMonetizationBlockSignals = new Set([
  'immediate_danger',
  'suicidal_crisis',
  'medical_emergency',
  'active_violence',
  'child_safeguarding_emergency'
]);
