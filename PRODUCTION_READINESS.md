# Governed marketplace fulfillment

The durable path is `/api/governed-marketplace-orders`. Authenticated tenant membership plus tenant/idempotency headers are required. Orders move through authoritative availability reservation, versioned pricing/tax, payment receipt verification, staff assignment, execution, exception/refund review, fulfillment, reconciliation, and close. Integer minor units, optimistic versions, scoped access, immutable evidence, refund dual control, and safe replay are enforced.

`server/migrations/001_governed_fulfillment.sql` is applied separately by an approved deployment migrator. Payment, tax, inventory, scheduling, messaging, accounting, delivery, and partner connectors are receipt-only declarations pending credentials, webhook signature/replay tests, reconciliation, and owner approval. Generated scoring/recommendation agents and inline provider routes are quarantined in production.

Double reservation, stock races, payment divergence, cancellations, refunds, no-shows, partial fulfillment, and retry recovery require controlled partner sandboxes before launch. The governed workflow never charges, refunds, reserves stock, or promises delivery without verified external receipts.

Use secret management with `.env.example`, leaving bootstrap/demo/provider flags false. Run `node --test server/governance/workflow.test.cjs` and `bash -n start.sh`. Startup performs no install, seed, migration, database creation, or port termination.
