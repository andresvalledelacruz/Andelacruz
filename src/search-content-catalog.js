const RULES = Object.freeze([
  ['breakup', '/rupturas/mi-pareja-me-ha-dejado/', 'Mi pareja me ha dejado', ['mi pareja me ha dejado', 'me ha dejado mi pareja', 'mi novio me ha dejado', 'mi novia me ha dejado', 'hemos roto', 'acabamos de romper']],
  ['ex_rumination', '/rupturas/no-puedo-dejar-de-pensar-en-mi-ex/', 'No puedo dejar de pensar en mi ex', ['no puedo dejar de pensar en mi ex', 'pienso todo el rato en mi ex', 'no paro de pensar en mi ex', 'sigo pensando en mi ex']],
  ['ex_blocked', '/rupturas/mi-ex-me-ha-bloqueado/', 'Mi ex me ha bloqueado', ['mi ex me ha bloqueado', 'me bloqueo mi ex', 'mi ex me bloqueo', 'me ha bloqueado de todas partes']],
  ['shared_children_ex', '/rupturas/tenemos-hijos-en-comun/', 'Tenemos hijos en común', ['tenemos hijos en comun', 'tengo hijos con mi ex', 'mi ex y yo tenemos hijos', 'separados con hijos']],

  ['lonely_with_people', '/soledad/me-siento-solo-aunque-tengo-gente/', 'Me siento solo aunque tengo gente', ['me siento solo aunque tengo gente', 'estoy rodeado de gente pero me siento solo', 'tengo gente pero me siento sola', 'acompanado pero solo']],
  ['no_friends', '/soledad/no-tengo-amigos/', 'No tengo amigos', ['no tengo amigos', 'no tengo amigas', 'me he quedado sin amigos', 'no tengo amistades']],
  ['night_loneliness', '/soledad/me-siento-solo-por-la-noche/', 'Me siento solo por la noche', ['me siento solo por la noche', 'por la noche me siento sola', 'la soledad por la noche', 'las noches se me hacen muy duras']],
  ['general_loneliness', '/soledad/me-siento-solo/', 'Me siento solo', ['me siento solo', 'me siento sola', 'siento mucha soledad', 'estoy muy solo']],

  ['parent_silence', '/familia/mi-madre-o-mi-padre-no-me-habla/', 'Mi madre o mi padre no me habla', ['mi madre no me habla', 'mi padre no me habla', 'mis padres no me hablan', 'mi madre ha dejado de hablarme', 'mi padre ha dejado de hablarme']],
  ['family_silence', '/familia/mi-familia-no-me-habla/', 'Mi familia no me habla', ['mi familia no me habla', 'mi familia ha dejado de hablarme', 'nadie de mi familia me habla']],
  ['family_rejection', '/familia/siento-que-mi-familia-no-me-quiere/', 'Siento que mi familia no me quiere', ['mi familia no me quiere', 'siento que mi familia no me quiere', 'no me siento querido por mi familia', 'no me siento querida por mi familia']],
  ['family_boundaries', '/familia/necesito-poner-limites-a-mi-familia/', 'Necesito poner límites a mi familia', ['poner limites a mi familia', 'necesito poner limites', 'mi familia no respeta mis limites', 'como poner limites a mis padres']],
  ['family_cohabitation', '/familia/vivo-con-mi-familia-y-no-aguanto-mas/', 'Vivo con mi familia y no aguanto más', ['vivo con mi familia y no aguanto mas', 'no aguanto vivir con mi familia', 'convivir con mi familia es imposible', 'quiero irme de casa porque no aguanto mas']],
  ['school_bullying_child', '/familia/mi-hijo-sufre-acoso-escolar-y-no-se-que-hacer/', 'Mi hijo sufre acoso escolar y no sé qué hacer', ['mi hijo sufre acoso escolar', 'mi hija sufre acoso escolar', 'hacen bullying a mi hijo', 'hacen bullying a mi hija', 'acosan a mi hijo en el colegio']],
  ['family_addiction', '/familia/un-familiar-tiene-una-adiccion-y-no-se-como-ayudarle/', 'Un familiar tiene una adicción y no sé cómo ayudarle', ['un familiar tiene una adiccion', 'mi hijo tiene una adiccion', 'mi pareja tiene una adiccion', 'como ayudar a un familiar con una adiccion']],

  ['work_overload', '/trabajo/no-puedo-mas-en-el-trabajo/', 'No puedo más en el trabajo', ['no puedo mas en el trabajo', 'el trabajo me supera', 'estoy desbordado en el trabajo', 'estoy desbordada en el trabajo', 'no aguanto mas trabajando']],
  ['work_disconnect', '/trabajo/no-consigo-desconectar-del-trabajo/', 'No consigo desconectar del trabajo', ['no consigo desconectar del trabajo', 'sigo pensando en el trabajo al llegar a casa', 'no desconecto del trabajo', 'el trabajo no sale de mi cabeza']],
  ['cv_problem', '/trabajo/mi-curriculum-no-funciona/', 'Mi currículum no funciona', ['mi curriculum no funciona', 'mi cv no funciona', 'mando curriculums y no me llaman', 'nadie responde a mi curriculum']],
  ['interviews_no_offer', '/trabajo/hago-entrevistas-pero-no-me-contratan/', 'Hago entrevistas pero no me contratan', ['hago entrevistas pero no me contratan', 'me llaman a entrevistas pero no consigo trabajo', 'llego a entrevistas y no me cogen', 'muchas entrevistas y ninguna oferta']],
  ['job_training', '/trabajo/necesito-formacion-para-encontrar-trabajo/', 'Necesito formación para encontrar trabajo', ['necesito formacion para encontrar trabajo', 'que estudiar para encontrar trabajo', 'necesito reciclarme profesionalmente', 'me falta formacion para trabajar']],
  ['hate_job', '/trabajo/odio-mi-trabajo-pero-no-puedo-dejarlo/', 'Odio mi trabajo pero no puedo dejarlo', ['odio mi trabajo pero no puedo dejarlo', 'no soporto mi trabajo pero necesito el sueldo', 'quiero dejar mi trabajo pero no puedo', 'detesto mi trabajo']],
  ['bad_boss', '/trabajo/mi-jefe-me-hace-la-vida-imposible/', 'Mi jefe me hace la vida imposible', ['mi jefe me hace la vida imposible', 'mi jefe me trata fatal', 'mi jefa me trata fatal', 'mi jefe me tiene amargado', 'mi jefa me tiene amargada']],
  ['fear_mistakes_work', '/trabajo/tengo-miedo-de-equivocarme-en-el-trabajo/', 'Tengo miedo de equivocarme en el trabajo', ['tengo miedo de equivocarme en el trabajo', 'me da miedo cometer errores en el trabajo', 'temo meter la pata en el trabajo', 'reviso todo mil veces en el trabajo']],

  ['ends_meet', '/dinero/no-llego-a-fin-de-mes/', 'No llego a fin de mes', ['no llego a fin de mes', 'no me llega el dinero a final de mes', 'el sueldo no me alcanza', 'no me alcanza para todo']],
  ['urgent_money', '/dinero/necesito-dinero-urgente/', 'Necesito dinero urgente', ['necesito dinero urgente', 'necesito dinero ya', 'me hace falta dinero urgente', 'necesito conseguir dinero rapido']],
  ['debt_reunification', '/dinero/quiero-reunificar-mis-deudas/', 'Quiero reunificar mis deudas', ['quiero reunificar mis deudas', 'reunificar deudas', 'juntar todas mis deudas', 'agrupar mis prestamos']],
  ['loan_affordability', '/dinero/necesito-un-prestamo-pero-no-se-si-puedo-permitirmelo/', 'Necesito un préstamo pero no sé si puedo permitírmelo', ['necesito un prestamo pero no se si puedo permitirmelo', 'puedo permitirme un prestamo', 'estoy pensando pedir un prestamo', 'necesito pedir dinero prestado']],
  ['housing_payment', '/dinero/no-puedo-pagar-la-vivienda/', 'No puedo pagar la vivienda', ['no puedo pagar la vivienda', 'no puedo pagar el alquiler', 'no puedo pagar la hipoteca', 'me van a echar por no pagar el alquiler']],
  ['bank_account_fear', '/dinero/me-da-miedo-mirar-mi-cuenta/', 'Me da miedo mirar mi cuenta', ['me da miedo mirar mi cuenta', 'me da miedo abrir la app del banco', 'evito mirar mi cuenta bancaria', 'no quiero mirar cuanto dinero tengo']],
  ['money_conflict_home', '/dinero/en-casa-discutimos-por-dinero/', 'En casa discutimos por dinero', ['en casa discutimos por dinero', 'mi pareja y yo discutimos por dinero', 'tenemos peleas por dinero', 'el dinero esta creando problemas en casa']],

  ['anticipatory_grief', '/duelo/mi-familiar-se-esta-muriendo-y-no-se-que-hacer/', 'Mi familiar se está muriendo y no sé qué hacer', ['mi familiar se esta muriendo', 'mi madre se esta muriendo', 'mi padre se esta muriendo', 'alguien que quiero se esta muriendo']],
  ['pregnancy_loss', '/duelo/he-perdido-a-mi-bebe-durante-el-embarazo/', 'He perdido a mi bebé durante el embarazo', ['he perdido a mi bebe durante el embarazo', 'he tenido un aborto y estoy destrozada', 'perdida gestacional', 'mi bebe murio durante el embarazo']],
  ['traumatic_death', '/duelo/la-muerte-fue-inesperada-o-traumatica/', 'La muerte fue inesperada o traumática', ['la muerte fue inesperada', 'murio de repente', 'fue una muerte traumatica', 'la muerte fue muy violenta']],
  ['months_grief', '/duelo/han-pasado-meses-y-sigo-muy-mal/', 'Han pasado meses y sigo muy mal', ['han pasado meses y sigo muy mal', 'hace meses que murio y sigo fatal', 'ha pasado mucho tiempo y sigo de duelo', 'sigo muy mal meses despues de su muerte']],
  ['no_goodbye', '/duelo/no-pude-despedirme/', 'No pude despedirme', ['no pude despedirme', 'murio y no pude despedirme', 'no llegue a despedirme', 'me pesa no haberme despedido']],
  ['grief_guilt', '/duelo/me-siento-culpable-desde-que-murio/', 'Me siento culpable desde que murió', ['me siento culpable desde que murio', 'siento culpa por su muerte', 'no dejo de pensar que pude hacer mas', 'me culpo desde que murio']],
  ['pet_grief', '/duelo/ha-muerto-mi-mascota-y-estoy-destrozado/', 'Ha muerto mi mascota y estoy destrozado', ['ha muerto mi mascota', 'se ha muerto mi perro', 'se ha muerto mi gato', 'he perdido a mi mascota']],
  ['support_grieving_person', '/duelo/quiero-ayudar-a-alguien-que-esta-de-duelo/', 'Quiero ayudar a alguien que está de duelo', ['quiero ayudar a alguien que esta de duelo', 'como ayudar a una persona en duelo', 'mi amigo esta de duelo y no se que decir', 'como acompanar a alguien que ha perdido a un familiar']],
  ['general_bereavement', '/duelo/ha-muerto-alguien-que-quiero-y-no-se-como-seguir/', 'Ha muerto alguien que quiero y no sé cómo seguir', ['ha muerto alguien que quiero', 'se ha muerto un ser querido', 'he perdido a alguien que quiero', 'ha fallecido una persona muy cercana']]
].map(([intent, url, label, phrases]) => Object.freeze({ intent, url, label, phrases: Object.freeze(phrases) })));

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsSafetyLanguage(text) {
  return [
    'suicid', 'quiero morir', 'me voy a matar', 'matarme', 'hacerme dano',
    'me pega', 'me esta pegando', 'me va a matar', 'violacion', 'me violaron',
    'me estan violando', 'agresion sexual', 'peligro inmediato', 'sobredosis'
  ].some((signal) => text.includes(signal));
}

export function routeKnownContentQuery(query = '') {
  const text = normalize(query);
  if (!text) {
    return Object.freeze({ matched: false, needs_clarification: true, raw_query_retained: false });
  }

  if (containsSafetyLanguage(text)) {
    return Object.freeze({
      matched: false,
      needs_clarification: false,
      needs_safety_router: true,
      raw_query_retained: false
    });
  }

  for (const rule of RULES) {
    if (rule.phrases.some((phrase) => text.includes(normalize(phrase)))) {
      return Object.freeze({
        matched: true,
        needs_clarification: false,
        intent: rule.intent,
        confidence: 'high',
        route: Object.freeze({ url: rule.url, label: rule.label }),
        safety_level: 'NONE',
        suppress_commercial_ui: false,
        raw_query_retained: false,
        diagnostic: false
      });
    }
  }

  return Object.freeze({ matched: false, needs_clarification: true, raw_query_retained: false });
}

export function searchContentCatalog() {
  return Object.freeze(RULES.map(({ intent, url, label }) => Object.freeze({ intent, url, label })));
}
