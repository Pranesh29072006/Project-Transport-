# Verification — 15 October 2026

## Build

`npm install` completed successfully with the dependencies in the root package manifest. The project deliberately avoids npm workspace symlinks to support restricted Windows environments.

`npm run build` passed with Vite 6.4.4. React Router emits informational warnings about ignored `use client` directives; the build succeeds. The compiled application is in `frontend/dist`.

## Automated integration checks

`npm test`: **17 passed, 0 failed** after the final backend service refactor.

1. Bus without insurance: server-verified payment and no policy.
2. Bus with insurance: ₹1,200 fare + ₹49 premium + ₹20 fee = ₹1,269 combined payment.
3. Train with optional protection.
4. Flight with baggage protection.
5. Cab with ride protection.
6. Rental duration with damage protection.
7. Insurance timeout preserves the paid transport ticket and pending insurance state.
8. Explicit pending and failed responses remain non-active after retries.
9. Concurrent payments and policy retries preserve a single payment and policy identity.
10. Signed duplicate webhook events are deduplicated; forged signatures are rejected.
11. My Bookings retains policy details; ticket, receipt and issued policy endpoints produce PDF files.
12. Explicit consent is required and browser-supplied premiums/totals are ignored.
13. Declined demo payment remains a draft and can be retried.
14. Authentication and ownership prevent another user reading a booking.
15. Cancellation records a request without claiming to process a refund.
16. Invalid routes, past dates, passenger counts and unavailable seats are rejected.
17. External adapter with `MOCK_INSURANCE=false` completes eligibility, quotes, consent, payment and policy issuance against the independent HTTP mock middleware; missing API keys are rejected.

## Browser checks

Verified in the Codex in-app browser:

- Homepage imagery and search form render.
- Fictional account registration completes.
- Bus search → interactive seat selection → passenger form → checkout.
- Insurance is initially unselected. Selecting ₹49 delay protection updates the combined amount to ₹1,269; cover details and explicit consent are displayed.
- The simulated combined payment reaches ticket confirmation and a confirmed demo policy.
- My Bookings displays the paid amount, insurance premium, issued policy number and download actions.
- Mobile confirmation and homepage checked at a 390 × 844 viewport; no horizontal overflow reported by the homepage DOM measurement, and all page images loaded.

## Limits

The automated tests use isolated in-memory databases; browser testing used a fictional local demo account. PDF checks validate generation and the PDF header, not visual page layout. No real transport supplier, payment gateway or insurer was contacted. The external adapter was tested against the provided standalone mock HTTP service; integration with your actual middleware still requires its credentials and a matching API contract.

This is a local Express + SQLite application. It has not been deployed to public hosting. Read `README.md` for startup, integration and prototype boundaries.
