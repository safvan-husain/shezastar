# Building Address Collection Before Payment — Requirements (User Perspective)

## Goal
Collect and confirm the user’s **building/billing address** before any checkout or payment redirect, both from:
- The Cart page checkout flow.
- The Buy‑Now flow initiated from a Product Details Page (PDP).

The address is required to proceed. If missing or incomplete, the user must create/complete it first.

---

## Terminology
- **Building Address**: The address the user provides for billing/identity/contact before payment. Uses this shape:
  ```ts
  export type BillingDetails = {
    email: string;
    firstName: string;
    lastName: string;
    country: string;
    streetAddress1: string;
    streetAddress2?: string;
    city: string;
    stateOrCounty?: string;
    phone: string;
    orderNotes?: string;
  };
  ```
- **Saved Address**: A building address previously stored for a logged‑in account, or a guest address saved to session/local storage for the current shopping session.
- **Create Address**: The form UX used to add a new building address.

---

## Cart Page Flow

### Cart Page Layout Requirements
1. **Saved Address Display (Top of Cart)**
   - If the user has a saved building address (guest session or account), show it at the top of the cart section.
   - Display in a compact summary card:
     - Full name
     - Email
     - Phone
     - Country, city, state/county (if provided)
     - Street address (line 1 + line 2 if present)
     - Order notes (if provided), shown as “Notes”
   - The card must include:
     - `Edit` action (opens create/edit form prefilled).
     - `Add another address` action (opens blank create form).

2. **No Saved Address State**
   - If no saved address exists:
     - Show an empty-state panel at the top of cart:
       - Brief text explaining address is required for checkout.
       - Primary CTA: `Create building address`.
     - Do not show checkout/payment CTA as enabled.

3. **Create/Edit Address Form**
   - The form can appear inline below the address panel or in an expandable area.
   - Required fields:
     - `email`, `firstName`, `lastName`, `country`, `streetAddress1`, `city`, `phone`.
   - Optional fields:
     - `streetAddress2`, `stateOrCounty`, `orderNotes`.
   - Validation:
     - Inline field errors on blur/submit.
     - Country‑specific formatting if available (but always allow manual entry).

### Checkout Gating Requirements
1. **Checkout Button Disabled Without Address**
   - If there is no valid saved address, the Checkout/Pay button is disabled.
   - Disabled state should include helper text: “Add building address to continue.”

2. **Attempting Checkout Without Address**
   - If the user triggers checkout via any alternative UI (e.g., sticky footer CTA, keyboard submit, deep link):
     - Prevent redirect.
     - Scroll/focus to the address area.
     - Show a toast error: “Please add your building address before checkout.”
     - If a form is open, highlight missing required fields.

3. **Address Snapshot**
   - On successful checkout initiation, use the currently selected address as the snapshot for the pending order/payment session.
   - If multiple saved addresses exist, the user must explicitly select one before proceeding.

### Guest vs Account Behavior
1. **Guest Users**
   - If the guest has already entered an address during this session:
     - Show it as “Saved for this session.”
   - If not entered:
     - Present the empty state + create CTA.

2. **Logged‑In Users**
   - Load their most recent/primary saved building address automatically and show it in the summary card.
   - Provide “Add another address” and “Edit” actions.

---

## Buy‑Now Flow (Product Details Page Overlay)

### Trigger
When the user presses `Buy Now` from PDP, open an overlay dialog (modal/drawer).

### Overlay States
1. **Saved Address Exists**
   - Show a preview card at top of overlay, same layout as Cart summary.
   - Ask for confirmation with copy like:
     - “Use this building address for checkout?”
   - Provide actions:
     - Primary: `Continue to checkout` (or `Continue to payment` if no intermediate review).
     - Secondary: `Create another address`.
     - Tertiary/inline: `Edit this address`.
   - If multiple addresses exist:
     - Let the user pick one from a list, then preview.

2. **No Saved Address**
   - Show the create form directly within the overlay.
   - Primary CTA at bottom: `Save & continue`.
   - The overlay cannot proceed until the form is valid.

### Gating / Redirect Rules
1. **No Address → No Redirect**
   - If the user tries to continue without a valid address:
     - Keep overlay open.
     - Show inline errors + toast.

2. **Valid Address → Proceed**
   - Once valid address is selected/created:
     - Persist it (session/local storage for guest; account store for user if applicable).
     - Create pending order/checkout session using address snapshot.
     - Redirect to checkout/payment.

---

## Error Handling & Feedback
1. **Never Swallow Errors**
   - Any failure to load/save addresses or create pending checkout must surface to the UI via toast with full status/body context.

2. **Toasts**
   - Errors:
     - “Couldn’t load your saved address. Please try again.”
     - “Couldn’t save your building address. Please retry.”
     - “Please add your building address before checkout.”
   - Success:
     - “Building address saved.”

---

## Edge Cases & UX Details
1. **Partial Address**
   - Treat missing required fields as invalid.
   - Prevent checkout until fixed.

2. **Country Change**
   - If changing country invalidates other fields (e.g., state), prompt to re‑enter those fields.

3. **Returning to Cart/PDP**
   - Previously entered address should remain visible and selected.
   - Guests keep it for session duration; logged‑in users see last used.

4. **Multiple Addresses**
   - Always show selected address clearly.
   - Selection change updates snapshot used for checkout.

---

## Non‑Goals (for clarity)
- Shipping address collection is not covered here unless it is the same as building address.
- Payment provider address collection should not be relied on for gating; address must be captured in app before redirect.

