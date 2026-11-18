# How the dues site works

This is for presidents, secretaries, and other board members. It does not cover servers, databases, or passwords' technical storage.

## What homeowners do

Each house gets a letter with a private link and a QR code. Whoever has the letter can open it, see every unpaid year, and pay the full balance by card. They do not need an account. The address is short enough to type, in groups such as `k7mp-q2n8-xrw4`. Capital letters are fine, and a zero still works if someone types the letter O.

The letter is private. Anyone who has it can see that house's balance and pay it. Do not post the link, and do not leave a saved copy of the whole printout where other people can take it.

They can optionally create a login from that page so they can come back without the letter. Paying does not require the login. The site has no page where someone types an address to look up a neighbor.

After a card payment, they get a receipt page. The board also sees the payment on the house.

## Who can do what

Board members and the president can see every house, record checks, generate the year's dues, send email, print bills, archive a login, and restore an archived login. The president's login cannot be archived until the presidency is transferred.

Only the president can:

- promote a resident login to the board
- demote a board member back to a resident login
- transfer the presidency

Secretary, treasurer, and other titles are labels. They do not change what the account can do.

There is always one president. Transfer presidency moves that role to another person who already has a login. You become a normal board member. The new president can demote you if you are actually leaving the board. Type TRANSFER when the site asks, so it is hard to do by accident.

The new president creates their login from their own letter first. Then you transfer.

## Adding houses and old balances

Add a house with its street address, lot, occupant name, and billing email if you have one. On the house screen, add each past year that was billed and each payment you already received (check, cash, or other). Payments apply to the oldest unpaid year first.

These fields are a starting guess. If the association tracks something else, tell whoever maintains the site before a lot of paper has been typed in.

A house that already has a charge for a year cannot get a second annual charge for that same year.

## The annual mailing

Do these in order when dues go out. Annual dues is only for the current calendar year. Saving an amount does not lock it. Generating dues locks that saved amount, and it cannot be changed after that. Old balances are added on the house screen, not here.

1. Open Annual dues and save this year's amount.
2. Generate dues. You must type the year to confirm. This creates one charge for every active house that does not already have one, even houses with no email and no account. A voided charge does not count; generate opens it again at the saved amount. It cannot be run twice for the same year.
3. If email is set up, press Send annual email once. The button stays off after a successful send for that year. Houses without a billing email are skipped and still need a paper letter. You can resend one house from that house's page.
4. Open Print bills. Press Print once. That is a single printer job for every house, in address order. Each house starts on its own page. A house with many unpaid years uses extra pages, and the next house still starts on a fresh page. Take the stack, fold, and put them in envelopes.

Card payments stay off until the association's card processor is connected. Checks can be recorded either way.

## Checks

On the house screen, record the amount, check or cash, the check number, and the date. The amount cannot be more than what the house currently owes. It pays the oldest open year first.

## Who owes the most

The ledger lists houses with the largest balances first, with how many years are open and the oldest year. Download CSV for a spreadsheet. That file does not contain pay links.

## When a house sells

1. If that person is the president, transfer the presidency first. The site will not archive the president's login until you do.
2. Archive the old login. On Members, switch the accounts list to Archived. Unarchive puts that same email, password, and role back, unless that email or that house already has another active login.
3. Replace the pay link. The old letter stops working.
4. Update the occupant name and billing email.
5. Print a new letter for the new owner. Old payments stay on the house.

## What this site does not do yet

- It does not print sticky address labels. After the letters, labels are still a separate job.
- It does not email a password reset. Board members should keep their passwords written down somewhere safe outside the site. A lost president password has to be fixed by the person who maintains the software.
- It does not offer a payment plan. Ask the board if they want a way to let a house pay old dues a bit at a time at 0% interest, instead of going straight to small claims.
- It does not have a bulletin board. Ask the board if they want a simple one-way place for event announcements. It would not be a neighborhood social network.
- It does not import old spreadsheets. Those need their own tool after someone looks at how the old files are actually laid out.
