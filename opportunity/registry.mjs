export const MONETIZATION = Object.freeze({ OFF:'MONETIZATION_OFF', ELIGIBLE:'ELIGIBLE', PARTNER_REQUIRED:'PARTNER_REQUIRED' });

export const OPPORTUNITIES = Object.freeze({
  JOB_SEARCH:{category:'employment',risk:'low',models:['affiliate','cpl','booking']},
  CV_SERVICE:{category:'employment',risk:'low',models:['booking','cpl','affiliate']},
  INTERVIEW_COACHING:{category:'employment',risk:'low',models:['booking','cpl']},
  TRAINING:{category:'education',risk:'medium',models:['affiliate','cpl','revenue_share'],requiresEvidence:true},
  LEGAL_LABOR:{category:'legal',risk:'medium',models:['cpl','booking'],partnerVerification:'required'},
  PSYCHOLOGY:{category:'health',risk:'high',models:['booking','cpl'],explicitNeedPreferred:true,partnerVerification:'required'},
  COUPLES_THERAPY:{category:'health',risk:'high',models:['booking','cpl'],partnerVerification:'required'},
  FAMILY_MEDIATION:{category:'legal_social',risk:'medium',models:['booking','cpl'],partnerVerification:'required'},
  MATCHMAKING:{category:'relationships',risk:'low',models:['affiliate','cpl','booking'],explicitIntentRequired:true},
  DEBT_CONSOLIDATION:{category:'finance',risk:'high',models:['cpl','cpa'],explicitIntentRequired:true,partnerVerification:'required'},
  LOAN:{category:'finance',risk:'high',models:['cpl','cpa'],explicitIntentRequired:true,affordabilityRequired:true,partnerVerification:'required'},
  DEBT_ADVICE:{category:'finance',risk:'medium',models:['booking','cpl'],partnerVerification:'required'},
  INSOLVENCY_LEGAL:{category:'legal_finance',risk:'high',models:['cpl','booking'],partnerVerification:'required'},
  MORTGAGE_HELP:{category:'finance',risk:'high',models:['cpl','booking'],partnerVerification:'required'},
  INSURANCE:{category:'finance',risk:'medium',models:['affiliate','cpl','cpa'],partnerVerification:'required'},
  ENERGY_SWITCH:{category:'home',risk:'low',models:['affiliate','cpl','cpa']},
  TELECOM_SWITCH:{category:'home',risk:'low',models:['affiliate','cpl','cpa']},
  CARE_SERVICES:{category:'care',risk:'medium',models:['cpl','booking','marketplace'],partnerVerification:'required'},
  SENIOR_RESIDENCE:{category:'care',risk:'medium',models:['cpl','booking'],partnerVerification:'required'},
  HOME_SERVICES:{category:'home',risk:'low',models:['cpl','marketplace','booking']}
});

export const SAFETY_BLOCK_FLAGS = Object.freeze(['critical_safety','urgent_protection','urgent_health','minor_protection']);
export const COMMERCIAL_STATES = Object.freeze(['detected','eligible','available','shown','clicked','consented','lead','converted']);
