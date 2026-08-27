# Desgracias.es — Opportunity Engine V1

## Purpose

Prepare Desgracias.es to detect legitimate monetizable opportunities behind user problems without allowing commercial incentives to override safety, usefulness, privacy or suitability.

The engine is intentionally decoupled from the public V9 UI. V1 detects and classifies opportunities; it does not show ads, collect commercial lead data or send users to partners.

## Core pipeline

Problem/context -> need -> safety gate -> intent -> opportunity -> eligibility -> partner availability -> commercial disclosure -> conversion -> measurement.

## Non-negotiable order

1. Safety and urgent help.
2. Correctly identify the user's actual need.
3. Explain non-commercial/public/self-service options when relevant.
4. Detect a commercial opportunity only when it can plausibly help.
5. Require explicit intent for sensitive or easily over-inferred categories.
6. Require an approved partner before a commercial CTA can be displayed.
7. Disclose commercial relationships clearly.
8. Measure outcomes without turning vulnerability into a bidding system.

## Global monetization-off gate

Commercial opportunities are suppressed when critical signals include immediate danger, suicidal crisis, medical emergency, active violence or a child safeguarding emergency. Domain-specific blocks can add further restrictions.

## Opportunity states

- `prepared_no_partner`: rule exists but no commercial CTA may be shown.
- `partner_review`: prospective partner is being checked.
- `active_partner`: opportunity may be shown if all other rules pass.
- `paused`: temporarily disabled.
- `retired`: permanently removed.

## Conversion states

`detected -> eligible -> available -> shown -> clicked -> consented -> lead -> accepted -> converted -> revenue`

No personally identifying or sensitive user information should be attached to commercial events unless there is a separate lawful basis, clear notice and explicit consent where required.

## Partner approval checklist

Every partner category needs its own compliance checklist. Baseline requirements:

- real legal identity and contact details;
- transparent pricing/fees/commission model;
- no misleading outcome or approval claims;
- privacy/data-processing review;
- complaint and cancellation path;
- jurisdiction/authorization checks where regulated;
- commercial disclosure copy approved before activation;
- ability to suspend the partner immediately.

Financial, insurance, legal, healthcare/psychology and care-related partners require additional domain review before activation.

## Current registry coverage

V1 prepares opportunities for psychology, couples therapy, matchmaking/dating, family mediation, family law, debt consolidation, debt/insolvency legal advice, mortgage options, insurance, energy, telecoms, employment services, training, CV/career help, home care, residential care and home services.

The registry is expected to grow. New entries must define trigger signals, block signals, whether explicit intent is required, permitted commercial models and partner requirements.

## What V1 deliberately does not do yet

- no public commercial widgets;
- no affiliate links;
- no partner ranking;
- no lead form;
- no automated transmission of user stories or personal data;
- no revenue attribution database;
- no dynamic personalization in production;
- no claim that a user is eligible for a regulated product or legal outcome.

## Next implementation phases

### V1.1 — taxonomy and page mapping
Map every content URL to needs, opportunity categories, safety rules and potential conversion events.

### V1.2 — event model
Define privacy-safe analytics events for detected/shown/clicked/converted opportunities.

### V1.3 — partner registry
Create a separate partner catalog with geography, regulatory status, commercial model, payout, quality score and activation status. Never hard-code partner logic into content pages.

### V1.4 — consent and disclosure
Build reusable disclosure/consent components and rules for when data may be transferred to a partner.

### V1.5 — controlled UI activation
Enable opportunity modules on selected low-risk pages first, with holdout measurement and manual kill switch.

## Success criteria

The engine is successful when Desgracias.es can recognize a legitimate opportunity across many problem categories, refuse monetization when unsafe or unsuitable, activate a new vetted partner without rewriting content pages, and measure commercial performance while preserving user trust.