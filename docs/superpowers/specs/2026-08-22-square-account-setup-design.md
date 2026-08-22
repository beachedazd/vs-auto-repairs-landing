# Square Account Setup — VS Auto Repairs

Date: 2026-08-22
Status: Approved

## Context

Square merchant account already exists and is connected via MCP:
merchant `ML7CPREF1MDPY`, location `L1RBX9TNTA3EA` (AU/AUD, ACTIVE, created 2026-08-20).
Payment channels: **in-person (reader/POS)** and **invoices**. No online checkout for now.

## 1. Location profile (via API)

- Address: 2/114 Colemans Rd, Carrum Downs VIC 3201, AU
- Phone: +61 3 9706 6007
- Business hours: Mon–Fri 08:30–17:00, Sat 08:30–12:00
- Description: mechanic & roadworthy tester, est. 2008

## 2. GST (via API)

Catalog tax **GST 10%, INCLUSIVE**, applied to all items (AU prices are GST-inclusive).

## 3. Catalog (via API)

Fixed-price items (recommended Melbourne pricing, adjustable in Dashboard):

| Item | Price inc GST |
|---|---|
| Roadworthy Certificate (RWC) | $240 |
| RWC Re-inspection | $80 |
| Pre-purchase Inspection | $250 |
| Minor Service | $249 |
| Air-Con Regas | $180 |
| Labour (per hour) | $140 |

Variable-price items (amount entered at sale): Logbook Service, Major Service,
Brake Repairs, Transmission Service/Repair, Engine Repair, Clutch Replacement,
Suspension/Steering, Cooling System, Battery Supply & Fit, Parts, Sundries/Consumables.

## 4. Owner checklist (Dashboard/app — not possible via API)

- [ ] Enter ABN 35 160 506 650: Account & Settings → Business information
- [ ] Complete identity/bank verification (card-processing capability not yet showing on account)
- [ ] Ask Square support to change MCC 7542 (car wash) → 7538 (auto repair)
- [ ] Order/pair Square Reader or Terminal; sign into Square POS app at the shop
- [ ] Review/adjust recommended prices once confirmed with the shop

## Out of scope

- Online payments / checkout links on the Netlify landing page
- Adding Saturday hours to the landing page schema (flagged separately)

## Execution record (2026-08-22)

All API-side items executed against merchant ML7CPREF1MDPY / location L1RBX9TNTA3EA:

- Location updated: address, phone, description, hours Mon–Fri 08:30–17:00 + **Sat 08:30–12:00**
- GST: Square's built-in AU GST (10%, inclusive, `AUSSALESTAXML7CPREF1MDPY`) already auto-applies
  to all items — a custom duplicate was created then deleted; items verified to carry only the built-in tax
- 17 catalog items created per the tables above (6 fixed-price, 11 variable)

## Addendum: mobile + rego driven workflow (approved same day)

Customer records are keyed by mobile number (native Square search / SMS invoicing).
Four customer custom attributes created:

| Field | Key | Type |
|---|---|---|
| Vehicle rego | `vehicle-rego` | Text (comma-separate multiple) |
| Vehicle | `vehicle` | Text (year make model) |
| Next service due | `next-service-due` | Date — filter customers for service reminders |
| Odometer at last service | `odometer-last-service` | Number (km) |

Staff habit: put the rego in invoice titles (e.g. "RWC — ABC123") so it appears on tax invoices.
VicRoads rego→make/model lookup is manual (free VicRoads registration check page); no Square
integration exists. Paid NEVDIS APIs (Blue Flag, MotorWeb, AutoGrab) noted as a future option.

## Landing page follow-up (separate task)

Site says "Open weekdays" only — add Saturday 8:30–12 to visible text and schema markup.
