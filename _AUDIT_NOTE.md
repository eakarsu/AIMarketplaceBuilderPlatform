# Audit Note — AIMarketplaceBuilderPlatform

Source audit: `_AUDIT/reports/batch_05.md` § 16 (verdict: skeleton)

## Note on actual project shape
Despite the name, the project is **not** a generic marketplace builder. The server is a 592-line monolith hosting a "marketplace" of AI mini-apps (trip-planner, content-writer, recipe-chef, resume-builder, social-media, learning-coach, etc.) plus shared CRUD via `createCrudRoutes`. There is one general AI endpoint: `POST /api/ai-center/generate`.

## Original audit recommendations

### Missing AI endpoints
- `/ai/marketplace-recommendations`
- `/ai/seller-match`
- `/ai/fraud-detection`
- `/ai/pricing-advisor`

### Missing non-AI features
- Dispute resolution
- Review/rating system
- Search & filtering
- Seller dashboard
- Payment processing
- Shipping integration
- Notification system

### Custom feature suggestions
- Agentic marketplace curation
- Streaming recommendation engine
- Autonomous customer service agent
- Seller success bot
- Dynamic marketplace pricing
- White-label marketplace networks

## Implemented in this pass
Added three new AI endpoints to the existing monolith (`server/index.js`), reusing the in-file `callOpenRouter`, `aiRateLimiter`, `authMiddleware`, and `parseAIJson` helpers. JSON schemas defined inline.

1. **POST `/api/ai/marketplace-recommendations`** — recommends products from user interests + recent views.
2. **POST `/api/ai/seller-match`** — scores sellers against a customer need.
3. **POST `/api/ai/pricing-advisor`** — suggests pricing strategy with band, tactics, margin impact.

Syntax checked.

## Backlog (priority order)

### Mechanical
- `/ai/fraud-detection` (text-only signal review; safe to add)

### Needs creds / external SDK
- Payment processing (Stripe Connect for marketplaces)
- Shipping integrations (Shippo, EasyPost)
- Notification system (Twilio, SendGrid)

### Needs product decision
- Marketplace data model: there is currently no "Sellers" / "Listings" / "Orders" schema; the platform serves AI feature templates instead. A product call is needed on whether to pivot the data model toward an actual marketplace.
- Dispute resolution workflow
- Review/rating system schema
- Seller dashboard scope (currently no role beyond `user`)

## Apply pass 3 (frontend)

LEFT-AS-IS. The pass-2 endpoints (`marketplace-recommendations`, `seller-match`, `pricing-advisor`) are already registered in `client/src/pages/AIToolsPage.js` with key + endpoint entries. The generic `/api/ai-center/generate` flow has its own page (`AICenter.js`). Auth via Bearer token in `client/src/api.js`. No changes made (idempotence).

## Apply pass 4 (mechanical backlog)

IDEMPOTENT. Sole mechanical item already shipped:
- `POST /api/ai/fraud-detection` — `server/index.js` line 644, uses existing `authMiddleware`, `aiRateLimiter`, `callOpenRouter` (503-on-no-key).

FE registered in `client/src/pages/AIToolsPage.js` lines 46-49; unified runner provides Bearer auth + 503 handling. No new endpoints, no new FE pages, no new deps.
