# Bunun admin

Admin panel for the Bunun store: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui. See `ROADMAP.md` in the project folder for the full plan.

Sibling repositories: `bunun_backend` (API) and `bunun_frontend` (storefront).

## Requirements

- Node.js 24+
- The backend running (see `bunun_backend`), with an admin account created by `npm run admin:create` there

## First run

```sh
cp .env.example .env.local    # API_URL, STOREFRONT_URL
npm install
npm run dev                   # http://localhost:3001
```

Sign in with the email and password from `admin:create`. The first sign-in shows a QR code for an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…); two-factor authentication is required for every account.

## How it talks to the API

The browser never calls the backend. The admin's **Next.js server** does it for the user:

- **Session cookie:** after sign-in, the session token sits in an httpOnly, `SameSite=Strict` cookie (`bunon_admin`) on the admin site.
- **Server-side requests:** Server Components and server actions read that cookie and call the API with `Authorization: Bearer <token>` (`lib/session.ts`, `lib/api/client.ts`). They also pass on the visitor's IP (the last `X-Forwarded-For` entry), so the API's rate limits and audit log see the real person.
- **Why this way:** the token is never readable by page JavaScript, the backend needs no cookies or CORS for the admin, and Next.js server actions check the request's origin.
- **Server placement:** run the admin server on the same machine as the API (or set the API's `TRUST_PROXY` to its address).

## Scripts

| Script                                        | What it does                                                     |
| --------------------------------------------- | ---------------------------------------------------------------- |
| `dev`                                         | Run on port 3001 with reload on change                           |
| `build` / `start`                             | Production build and serve on port 3001                          |
| `lint`, `format`, `format:check`, `typecheck` | Code checks (all run in CI)                                      |
| `gen:api`                                     | Regenerate `lib/api/schema.d.ts` from the backend's OpenAPI spec |

## API types

`lib/api/schema.d.ts` is generated and committed, so CI doesn't need the backend. After a backend API change:

```sh
cd ../backend && npm run openapi   # writes openapi.json
cd ../admin && npm run gen:api
```

## Structure

```
app/
  login/                     Sign-in: password, then authenticator code (with setup the first time)
  (dashboard)/layout.tsx     Requires a session; sidebar filtered by role; sign out
  (dashboard)/page.tsx       Dashboard: sales, orders waiting per step, 30-day revenue chart, top products, low stock
  (dashboard)/manual-orders/ Enter an order taken on Facebook, WhatsApp or by phone
  (dashboard)/customers/     List (search, blocked filter) and profile: orders, success rate, notes, block
  (dashboard)/settings/      Owner only: store details, fees, fraud limits, delivery zones and areas, block list
  (dashboard)/staff/         Owner only: invite (one-time password), role, disable, reset, sign out everywhere
  (dashboard)/account/       Change your own password (click your name in the header)
  (dashboard)/audit/         Audit log with person, action and date filters
  (dashboard)/orders/        List (status tabs, search, dates, CSV export), order detail, server actions
  (dashboard)/products/      List with filters, new product, editor (details, sizes and prices, photos, publish/archive/duplicate)
  (dashboard)/categories/    Rename, Bangla name, image, show/hide, reorder, add, delete empty
  (dashboard)/inventory/     Stock per variant, low-stock filter, adjust/stocktake dialog, stock history
  (dashboard)/[module]/      Placeholder for modules not built yet
  print/orders/[orderNo]/    Printable invoice and packing slip (use the browser's Print → Save as PDF)
components/orders/           Status actions, notes, edit dialog, table, status badge
components/catalogue/        Product editor parts, image manager, categories editor, stock dialog
components/settings/         Settings form, zones editor, block list
components/dashboard/        Revenue chart (with a table view) and top products
components/ui/               shadcn/ui components (Base UI)
lib/session.ts               Session cookie, authenticated API client, requireAdmin()
lib/modules.ts               Sidebar modules and the permission each needs
lib/images.ts                Picks the 400/800/1200 px size of an uploaded photo
```

## Roles

| Role           | Can                                                              |
| -------------- | ---------------------------------------------------------------- |
| Owner          | Everything                                                       |
| Manager        | Orders (incl. manual), customers, products, inventory, audit log |
| Order handler  | Orders (incl. manual), customers, products (read)                |
| Content editor | Products and content                                             |
