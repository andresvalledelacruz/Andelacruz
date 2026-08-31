const SOURCES = Object.freeze({
  sanidad_cancer_strategy: Object.freeze({
    url: 'https://www.sanidad.gob.es/areas/calidadAsistencial/estrategias/cancer/home.htm',
    authority: 'official_government',
    fronts: ['cancer'],
    modes: '*',
    verified_at: '2026-08-31'
  }),
  sanidad_cancer_psychological_care: Object.freeze({
    url: 'https://www.sanidad.gob.es/areas/calidadAsistencial/estrategias/cancer/docs/RECOMENDACIONES_DE_MEJORA_DE_LA_ATENCION_PSICOLOGICA_AL_CANCER_ACCESIBLE.pdf',
    authority: 'official_government',
    fronts: ['cancer'],
    modes: ['diagnosis_wait', 'recent_diagnosis', 'caregivers', 'anticipatory_grief', 'survivorship'],
    verified_at: '2026-08-31'
  }),
  sanidad_cancer_survivorship: Object.freeze({
    url: 'https://www.sanidad.gob.es/areas/calidadAsistencial/estrategias/cancer/docs/Recomendaciones_largo_superviviente._ACCESIBLE.pdf',
    authority: 'official_government',
    fronts: ['cancer'],
    modes: ['survivorship'],
    verified_at: '2026-08-31'
  }),
  seguridad_social_temporary_disability: Object.freeze({
    url: 'https://www.seg-social.es/wps/portal/wss/internet/InformacionUtil/44539/43384/44673',
    authority: 'official_government',
    fronts: ['cancer'],
    modes: ['work_admin'],
    verified_at: '2026-08-31'
  }),
  sanidad_aquatic_safety: Object.freeze({
    url: 'https://www.sanidad.gob.es/areas/promocionPrevencion/lesiones/medioAcuatico/home.htm',
    authority: 'official_government',
    fronts: ['accidental_emergencies'],
    modes: ['prevention'],
    verified_at: '2026-08-31'
  }),
  sanidad_drowning_prevention_2025: Object.freeze({
    url: 'https://www.sanidad.gob.es/areas/promocionPrevencion/lesiones/medioAcuatico/documentosTecnicos/docs/informeAhogamientosyLesionesGraves.pdf',
    authority: 'official_government',
    fronts: ['accidental_emergencies'],
    modes: ['prevention'],
    verified_at: '2026-08-31'
  }),
  sanidad_asphyxia_prevention: Object.freeze({
    url: 'https://estilosdevidasaludable.sanidad.gob.es/seguridad/asfixia/home.htm',
    authority: 'official_government',
    fronts: ['accidental_emergencies'],
    modes: ['prevention'],
    verified_at: '2026-08-31'
  })
});

export function sensitiveSourceById(id) {
  return SOURCES[String(id || '').trim()] || null;
}

export function sensitiveSourceRegistry() {
  return Object.entries(SOURCES).map(([id, source]) => ({ id, ...source }));
}

