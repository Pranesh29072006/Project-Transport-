# TravelSure

A responsive React + Vite transport booking prototype with an Express merchant API, SQLite persistence, and a separate insurance integration boundary. All transport inventory, payments, drivers, and policies are demo data. No real tickets, charges, insurance coverage, or IRCTC integration are provided.

## Run locally

Requires **Node.js 24 LTS** (uses built-in `node:sqlite`) and npm.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

- Website: http://localhost:5174
- Merchant API: http://localhost:5002
- Independent mock insurance middleware: http://localhost:5001

Register a test account with a fictional email and a password of at least 8 characters. Select a service, search a route, choose an option, enter fictional passenger details, optionally select protection and explicitly consent, then make one simulated payment. UPI, debit card and credit card all run the server-controlled test payment simulator; no financial details are collected.

```powershell
npm run build
npm test
```

The production frontend bundle is generated in `frontend/dist`. Serve it behind a reverse proxy that forwards `/api` to the merchant API and supports React Router fallback to `index.html`. Do not publish the static frontend alone: it requires the merchant backend. Development is bound to loopback. Hosting the requested Express and SQLite stack requires a Node host with durable disk; Cloudflare static hosting cannot run it as-is.

## Features

- Five service-specific searches: bus, train, flight, cab, rental.
- One-way and round-trip flight fares, flight and train classes, cab pickup time, and rental duration.
- Demo schedules, fare sorting, maximum fare and vehicle filters, bus seat selection, multiple passenger forms.
- Registration/login, salted scrypt password hashes, opaque bearer sessions, per-user booking authorization.
- Optional middleware-provided plans with details, exclusions, limits, terms, explicit consent; no preselection.
- A single merchant-calculated checkout total for ticket, selected insurance and ₹20 booking fee.
- Server-generated and verified simulated payments. Frontend `amount` or `success` fields are not accepted as proof.
- Pending, failed, timed-out and confirmed insurance states, manual retries and idempotency protection.
- Booking dashboard, drafts, completed journeys, cancellation requests, ticket/receipt/policy PDFs.
- Responsive UI, loading, empty and error states, help and privacy pages.

## Insurance integration

`MOCK_INSURANCE=true` uses the adapter in `mock-insurance/adapter.js`, kept outside merchant services. It contains only illustrative sample responses. The standalone API on port 5001 exposes the same contract for testing a network integration.

To exercise the separate REST service:

```dotenv
MOCK_INSURANCE=false
INSURANCE_API_BASE_URL=http://localhost:5001
INSURANCE_API_KEY=demo-key
```

Restart services after changing `.env`. For your real middleware replace the URL and key, confirm the response schema, and update only `backend/src/services/insurance.js` if the contract differs. Never put credentials in Vite variables or browser code.

The merchant invokes:

| Method and path | Request / expected response |
| --- | --- |
| POST `/api/v1/insurance/eligibility` | `{ booking }` → `{ eligible: boolean }` |
| POST `/api/v1/insurance/quotes` | `{ booking }` → `{ quoteId, expiresAt: epochMilliseconds, plans }` |
| POST `/api/v1/insurance/consents` | bookingId, quoteId, planId, consent, terms, recordedAt → `{ id }` |
| POST `/api/v1/insurance/policies/issue` | `{ booking, payment, consent }`, `Idempotency-Key: policy-{bookingId}` → `{ status, policyId?, policyNumber?, coverage?, startDate?, endDate? }` |
| GET `/api/v1/insurance/policies/:id` | → policy status response |

Each plan includes `id, name, premium` (INR for the whole booking), `coverage, limit, duration, exclusions, terms`. The external middleware owns eligibility, all prices, consent acceptance, underwriting and policy issuance. The merchant neither computes insurance premiums nor generates real policies. Only a confirmed `issued` response containing both policy identifiers unlocks policy PDF download. A transport ticket can remain confirmed while protection is pending or failed.

Retries reuse the booking-based idempotency key. An in-process lock prevents concurrent requests, persisted policy status suppresses repeated issuance, and the middleware must durably enforce idempotency across restarts. The standalone mock stores its idempotency responses in memory, so it is strictly a development fixture.

## Merchant API

- `GET /api/search`, `GET /api/cities`
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/POST /api/bookings`, `GET /api/bookings/:id`
- `POST /api/bookings/:id/insurance` — `planId`, explicit `consent`
- `POST /api/bookings/:id/pay` — `method`, optional demo `simulateFailure`
- `POST /api/bookings/:id/retry-policy`
- `POST /api/bookings/:id/cancel` — records request only
- `GET /api/bookings/:id/document/ticket|receipt|policy`
- `POST /api/payments/webhook` — signed mock payment event

Booking endpoints require `Authorization: Bearer <token>`. The webhook accepts `{ eventId, paymentId }` with an `X-Payment-Signature` containing a lowercase SHA-256 HMAC of the exact JSON body, signed with `PAYMENT_WEBHOOK_SECRET`. It verifies the existing merchant payment record, rejects unsigned events and deduplicates event IDs. It never accepts a browser-reported success state. The default secret is demo-only.

## Testing failure states

Expand **Demo testing options** at checkout:

1. Enable payment decline. The booking stays draft; disable it and retry.
2. Select protection and choose pending, failure or API timeout. Ticket confirmation remains visible, and policy download stays unavailable.
3. Repeated payment requests return the existing verified payment, and concurrent policy retries do not create additional policies.

The fixed pending/failure scenarios intentionally remain unresolved on retries, to demonstrate persistent upstream failure. In external mode, retries query an existing policy ID or repeat the idempotent issue request so the middleware can report recovery. A future background job may automate this; this prototype exposes manual retries.

Automated integration tests cover all five services, combined totals, omitted insurance, explicit consent, payment decline/retry, API timeout, policy states, parallel payment idempotency, signed duplicate webhook events, dashboard policy visibility, PDF signatures, ownership and validation. An additional test runs the merchant with `MOCK_INSURANCE=false` against a separate HTTP mock middleware instance.

## Structure

```text
frontend/src/
  components/    layout, search form, shared feedback
  pages/         landing, results, booking, checkout, confirmation, dashboard
  context/       authentication UI state
  data/          display helpers and destination content
  services/      credential-free merchant HTTP client
backend/src/
  config/        SQLite storage
  middleware/    authentication and ownership boundary
  services/      authentication, passengers, booking creation, consent,
                 transport, payment verification, insurance client, confirmation PDFs
  app.js         merchant HTTP routes and orchestration
mock-insurance/  independent development middleware and mock adapter
tests/          HTTP integration tests against an isolated in-memory database
```

## Prototype boundaries

This is runnable demo software, not a production travel/payment/insurance system. Schedules and seats are fixtures, not real inventory. Airport searches use supported city names; round trips use a combined illustrative fare rather than separate live outbound/return inventory. Cab and rental fares are per vehicle, with rental prices scaled by days; tickets for other services are priced per traveller. Cancellation records a request, with no claim of automatic cancellation/refund. Policy PDFs are merchant-generated demo summaries, not insurer-signed documents.

Before production add actual transport inventory/seat locking, a certified payment gateway and signed settlement callbacks, external insurer documents, transactional outbox/reconciliation, migration tooling, robust schema validation, auth rate limits/session expiry/revocation, secure cookie sessions, data retention/deletion, monitoring and deployment security. Store secrets outside source, replace demo secrets and configure durable middleware idempotency. External API credentials, live availability, real payments and real insurance require your provider integrations.

Visual assets load from Unsplash and fonts from Google Fonts; network access is needed for those optional assets. Text and booking flows remain usable if they cannot load. Offers are clearly illustrative and do not change checkout totals.
