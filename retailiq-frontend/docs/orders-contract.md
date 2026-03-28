# Orders Contract Reference

This file is the frontend-facing reference for the orders surface.

## Canonical routes

- `/orders/pos`
- `/orders/transactions`
- `/orders/transactions/:uuid`

Legacy redirects remain in place for:

- `/pos`
- `/transactions`
- `/transactions/:id`

## Backend transaction contract

- Create transaction: `POST /api/v1/transactions`
- Batch create: `POST /api/v1/transactions/batch`
- List transactions: `GET /api/v1/transactions`
- Detail: `GET /api/v1/transactions/:uuid`
- Return: `POST /api/v1/transactions/:uuid/return`
- Daily summary: `GET /api/v1/transactions/summary/daily`

## Field notes

- Create payload uses:
  - `transaction_id`
  - `timestamp`
  - `payment_mode` with uppercase enum values: `CASH`, `UPI`, `CARD`, `CREDIT`
  - `customer_id`
  - `notes`
  - `line_items[]` with `product_id`, `quantity`, `selling_price`, `discount_amount`
- Return payload uses:
  - `items[]` with `product_id`, `quantity_returned`, `reason`

## UI adapter rules

- The orders screens use `date_from` / `date_to` in the UI.
- The transaction adapter maps those values onto the backend list query shape.
- Missing date filters must not be sent.
- Transaction detail must be routed by UUID, not numeric ID.
