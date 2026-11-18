# Redfield Estates dues

Neighborhood dues for about 100 houses. A mailed link is enough to see the balance and pay. Board members keep the ledger. One president controls who is on the board.

This file is for the person maintaining the software. Presidents and secretaries should read [docs/site-guide.md](docs/site-guide.md) instead.

## Setup

Node 20.9 or newer.

```bash
npm install
copy .env.example .env.local
```

Fill in `.env.local`:

| Variable                             | Purpose                                                                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                        | MongoDB connection string. Transfers, annual generation, and card payments use a transaction when the server is a replica set, which Atlas is. A standalone local `mongod` runs those same writes in order instead. |
| `SESSION_SECRET`                     | Random string, at least 32 characters. Signs login cookies and pay-link cookies.                                                                                                                                    |
| `NEXT_PUBLIC_APP_URL`                | Public site origin, no trailing path. Used in letters, QR codes, and Stripe return URLs.                                                                                                                            |
| `STRIPE_SECRET_KEY`                  | Stripe secret key. Leave empty until card payments should turn on.                                                                                                                                                  |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key. The statement page uses it to mount the card form.                                                                                                                                          |
| `STRIPE_WEBHOOK_SECRET`              | Signing secret for `POST /api/stripe/webhook`. A card payment is recorded only after this webhook verifies.                                                                                                         |
| `SMTP_URL`                           | SMTP connection URL for nodemailer. Leave empty to keep email off.                                                                                                                                                  |
| `MAIL_FROM`                          | From address. Required together with `SMTP_URL`.                                                                                                                                                                    |
| `BOOTSTRAP_PRESIDENT_EMAIL`          | First president. Used once.                                                                                                                                                                                         |
| `BOOTSTRAP_PRESIDENT_PASSWORD`       | At least 10 characters. Remove it after the script succeeds.                                                                                                                                                        |

```bash
npm run dev
npm run bootstrap:president
```

The bootstrap script refuses to run when an active president already exists. After that, remove `BOOTSTRAP_PRESIDENT_PASSWORD` from the environment. There is no master account in the database beyond whoever currently holds the president role, and they can hand it off in the app.

```bash
npm test
npm run lint
npm run build
npm start
```

## Deploy

The app runs on the Node.js runtime, which is the Next.js default for these routes. Mongoose and Stripe stay off the Edge runtime. The app does not call Vercel-only APIs.

On Vercel, set the environment variables above and point Stripe's webhook at `https://<your-domain>/api/stripe/webhook` for `checkout.session.completed`.

Anywhere else:

```bash
npm run build
npm start
```

Put a reverse proxy in front if you need TLS. `NEXT_PUBLIC_APP_URL` must be the URL homeowners and Stripe will actually use.

## How requests are shaped

Pages under `src/app` only render a component. The component calls a hook in `src/client/state`, the hook calls `src/client/services`, and that service calls a route in `src/app/api`. The route calls `src/server/lib`. Stripe and SMTP are only touched from `src/server/services`.

Do not query Mongo from a component, and do not put payment-provider code in the ledger. A second card processor means a new adapter with the same methods the checkout library already calls.

## Money

All amounts are integer cents. Parsing, formatting, addition, and oldest-first allocation live in [src/shared/money.js](src/shared/money.js). Dollar input is split on the decimal point. Do not multiply a JavaScript float by 100. The client displays cents from the server. Checkout amounts are computed on the server from open dues.

Balances are not a stored field. Amount owed is open assessment cents minus succeeded payment allocations.

## Access

Roles are `resident`, `board`, and `president`.

- The pay link is a private code on the house. New links are 12 characters from an alphabet that leaves out easily confused letters, shown as `k7mp-q2n8-xrw4`. Lookup ignores case, spaces, and hyphens, and reads `o`/`i`/`l`/`u` as `0`/`1`/`1`/`v`. Links created earlier stay valid until someone replaces that house's link. `POST /api/statements/session` checks the code and sets a separate httpOnly cookie. The page then drops the token from the address bar. A bad token is a generic 404.
- That cookie can read and pay only that house. It is not a user session. Rotating the link bumps `payTokenVersion` and kills old cookies and old letters.
- Login cookies and statement cookies use different JWT audiences so one cannot be replayed as the other.
- Board and president can use the ledger, checks, email, and printing.
- Board members and the president can archive a login and restore an archived one. The president's login cannot be archived until the presidency is transferred. Restoring a login sets `status` back to `active` and keeps the email, password hash, and role. It is refused when that email or that house already has an active login.
- Only the president can promote, demote, or transfer the presidency. Transfer is a transaction: the current president becomes `board`, then the chosen active account becomes `president`. A partial unique index keeps a single active president.
- A resident session can see only their own house.
- There is no public search by address, name, or invoice number.
- Pay tokens are not in the delinquency CSV and not in list APIs. The house screen and the print stack are the places a board member can see them. A saved PDF of the stack is as sensitive as a stack of checks. Server access logs may still contain `/pay/<token>` from the first request. Restrict who can read those logs.
- Login failures are counted in Mongo: 5 misses locks that email for 15 minutes. The error for a wrong password does not say whether the email exists.
- Passwords are hashed with bcrypt, cost 10.

Selling a house: archive that login, replace the pay link, leave the payment history on the house, and print a new letter. If that person is the president, transfer the presidency first. The archive action refuses until that is done.

## Annual run

The annual dues screen is the current calendar year only. The fee schedule is the price for that year. It can be changed until dues are generated. Generating sets `lockedAt` on that schedule, and the amount stays frozen after that. Per-house charges do not set or lock the price on this screen. Older balances are entered on the house screen.

1. Set this year's amount.
2. Generate one `annual` assessment per active house that does not already have an open or paid charge. A voided charge for that year is opened again at the saved amount. Type the year to confirm. A unique index on house + year + kind rejects a second charge for the same house. Houses without an email or an account are included. If every active house already has an open or paid charge, nothing is generated and the schedule stays unlocked.
3. Optionally send one email per house that has a billing email. The button stays off until the fee schedule is locked and SMTP is set, and a unique campaign row keeps the year from being mass-mailed twice. If every send fails, the campaign row is removed so it can be tried again. Individual resend stays available.
4. Print the bill stack. One browser print dialog. Each house starts on a new page (`break-before: page`). A long bill may use extra pages. The next house still starts on a fresh page.

## Payments

Manual check, cash, and other payments are applied oldest-year first, in the same allocator card payments use.

The statement page embeds a Stripe Checkout form for the full open balance. Opening that form does not write a payment. A payment row is created when Stripe reports that the form was submitted. If the charge is still processing, the row stays pending. When the charge is paid, the webhook checks the signature, the amount, and that those dues are still open, then marks the payment succeeded. Stripe returns the payer to the receipt page, which uses a one-time secret, not the house pay token.

## Dependencies

Pinned by the lockfile: Next.js 16, React 19, Mongoose 9, MUI 9, Stripe, bcryptjs, jose, qrcode, nodemailer. Cache Components came with the Next 16 app scaffold. Authenticated routes call `connection()` before Mongo so they stay request-time.

`npm update` within these majors is the expected path. Read the changelog before jumping a major. Do not add a state library, an auth framework, or a second validation library unless there is a real need. MobX is intentionally not here.

Cache Components and Partial Prefetching are turned off in `next.config.mjs`. Next 16 turns them on in a new app, and they try to prerender GET routes at build time. Every API route here depends on a request (a cookie, a pay token, or a webhook), so they stay ordinary Node route handlers.

## Password reset is not built

There is no self-serve reset yet. The president needs to keep that password somewhere safe. A lost president password, until reset exists, is a manual database recovery by whoever maintains the app. When it is built: any registered account submits an email, and a single-use link is sent only if that email is an active account. The response must not reveal whether the email exists.

## Ask the board

- 0% interest financing, so a house can start paying down old dues instead of going straight to small claims.
- A one-way bulletin board for announcements and events, not a neighborhood social feed.
- How much of the existing history is paper versus mismatched spreadsheets. Import tools come after that answer. The add-house screen is only a placeholder for typing paper records. Spreadsheet import is out of scope.
- Which offices besides president exist, and whether any of them need permissions of their own. Secretary and treasurer are labels.
- Confirm the address fields (street and lot) and the current dues amount. Those fields are a guess.
- Default legal jargon on the bills.

## Todo

- There's a small logical error/coupling between the annual dues screen and the household screen. As it stands right now, the household screen can set dues for the current year, which don't get affected by the annual dues screen. The save-banner shows this correctly, but we probably want to overwrite from the annual dues screen. Furthermore, it is likely that the 'Dues' section on the household screen should be able to add dues specifically for the current year. Functionally, this is perfectly fine, but it's going to be potentially confusing for board members. This favors a bit more control rather than simplicity at the moment, but we should probably find a way to make it more seamless if we want to have it both ways.
- Mongo backups
- Address labels for a sheet the secretary buys, such as Avery 8161. The template has to be configurable.
- Password reset, described above.
- Autopay enrollment.
- Financing plans, a bulletin board, generated small-claims packets, and fee kinds other than `annual`. The delinquency list and CSV are the court-prep surface for now.
- Do something with the index pages for both normal users and board members. If it stays unused we can remove it and render the ledger page as the index page for board members. A normal user's index page could show their 'my dues' page. It's a photo of Benjamin Adams Pond for now.
- Emails, password resets, etc for normal and unarchived users.
