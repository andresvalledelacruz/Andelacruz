import { receiveProfessionalApplication } from './professional-intake.js';

export async function handleProfessionalApplication(request, reply, { pool, environment,
  configuration, allowPublicOriginOrDeny } = {}) {
  if (!allowPublicOriginOrDeny(request, reply)) return;
  try {
    const receipt = await receiveProfessionalApplication(pool, request.body,
      {configuration,synthetic:environment !== 'production'});
    return reply.code(202).send(receipt);
  } catch (error) {
    const known = ['professional_intake_disabled','invalid_application','request_conflict','request_expired',
      'intake_capacity_reached','professional_intake_unavailable'].includes(error.code);
    return reply.code(known ? error.status : 503).send({error:known ? error.code : 'professional_intake_unavailable'});
  }
}
