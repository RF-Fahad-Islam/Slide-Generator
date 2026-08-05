# Implementation Plan — Phase 1: SaaS Marketing Site

## What we are building
A B2B marketing site at `brainsaas.com` that sells the multi-tenant course platform to coaching centers and schools. Separate from BrainSum's student-facing landing page.

## Decisions made
- **Route strategy**: Separate `(saas-marketing)` route group, proxy.ts rewrites `brainsaas.com/` → it
- **Pricing**: Hardcoded 3 tiers (Basic 2,000 BDT, Pro 4,250 BDT, Enterprise 6,500 BDT) referencing limits from `tenants.plan_limits`
- **Contact form**: `contact_inquiries` table, simple API handler, no email for MVP
- **Layout**: New SaaS navbar + footer, enterprise messaging

## How to build it

1. Migration `011_contact_inquiries.sql` — simple table
2. `src/app/(saas-marketing)/layout.tsx` — SaaS navbar + footer
3. `src/app/(saas-marketing)/page.tsx` — hero, features, pricing, contact sections
4. SaaS components under `src/components/saas/`
5. `POST /api/contact` route handler
6. Update `proxy.ts` — rewrite brainsaas.com to SaaS route group
7. Run build verification
