import test from 'node:test';
import assert from 'node:assert/strict';
import { registerPartner, findEligiblePartners, PARTNER_STATUS } from '../opportunity/partners.mjs';
import { createOpportunityEvent } from '../opportunity/events.mjs';

test('only active verified matching partners are eligible', () => {
  const good = registerPartner({id:'p1',name:'Partner 1',opportunities:['CV_SERVICE'],territories:['ES'],status:PARTNER_STATUS.ACTIVE,verification:'verified'});
  const paused = registerPartner({id:'p2',name:'Partner 2',opportunities:['CV_SERVICE'],territories:['ES'],status:PARTNER_STATUS.PAUSED,verification:'verified'});
  const out = findEligiblePartners({opportunityId:'CV_SERVICE',territory:'ES',registry:[good,paused]});
  assert.deepEqual(out.map(p=>p.id), ['p1']);
});

test('event schema removes direct personal fields from metadata', () => {
  const event = createOpportunityEvent({type:'clicked',opportunityId:'TRAINING',metadata:{name:'X',email:'x@example.com',variant:'A'}});
  assert.equal(event.metadata.name, undefined);
  assert.equal(event.metadata.email, undefined);
  assert.equal(event.metadata.variant, 'A');
});
