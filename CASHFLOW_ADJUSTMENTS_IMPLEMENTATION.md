# Cashflow Adjustment Feature Implementation

## Overview

This feature enables safe, audit-trail-preserving editing of auto-generated cashflows in WealthBooks. Instead of directly modifying system-generated entries, adjustments are implemented via **linked manual adjustment entries** that preserve ledger integrity and maintain full auditability.

## Core Principles

### 1. System Cashflows Are Immutable
- System-generated cashflows (interest, TDS, maturity, etc.) can **never be directly modified**
- They represent the **source of truth** for what was originally calculated
- Original entries remain visible in the timeline for audit purposes

### 2. Adjustments via Linked Entries
- When a user needs to correct a cashflow, a **new manual adjustment entry** is created
- Adjustment entry explicitly links to the original via `adjustsCashflowId`
- Both entries are visible in the timeline in chronological order
- Example:
  ```
  INTEREST_PAYOUT     +₹30,750   (system)
  ADJUSTMENT           -₹500     (manual) → links to interest entry
  ```

### 3. Ledger Integrity
- Net totals always = system cashflows + manual adjustments
- Never delete system entries
- Never hide adjustment effects
- All calculations include adjustments for final accuracy

## Data Model

### CashFlow Fields
```javascript
{
  id: string,                      // Unique cashflow ID
  investmentId: string,            // Reference to investment
  date: string (YYYY-MM-DD),       // Transaction date
  type: string,                    // Type: interest, adjustment, etc.
  amount: number,                  // Amount (positive/negative)
  financialYear: string,           // FY context
  source: 'system' | 'manual',     // Origin
  status: 'planned' | 'confirmed' | 'adjusted',
  adjustsCashflowId: string,       // Links to adjusted entry (for adjustments)
  reason: string,                  // Explanation (mandatory for adjustments)
  sourceInvestmentId: string,      // For transfers/reinvestments
  targetInvestmentId: string,      // For transfers/reinvestments
}
```

### Adjustment Entry Structure
When user clicks "Adjust" on a system cashflow:
```javascript
{
  type: 'adjustment',
  amount: number,                  // +/- correction amount
  date: same as edited cashflow,   // Default: preserve original date
  source: 'manual',
  reason: string,                  // MANDATORY - "Bank credited lower interest"
  adjustsCashflowId: originalId,   // Link to original entry
  linkedTo: originalId,            // Same as adjustsCashflowId (for clarity)
}
```

## UI Components

### 1. CashflowAdjustmentModal (`src/components/CashflowAdjustmentModal.jsx`)
**Purpose**: Controlled modal for entering adjustment data

**Props**:
- `cashflow`: The system cashflow being adjusted
- `onSubmit`: Handler receiving adjustment entry object
- `onCancel`: Close modal

**Features**:
- Shows original entry details (type, date, amount)
- Input fields:
  - **Adjustment Amount**: +/- correction value
  - **Reason**: Mandatory explanation text
- Validates that both fields are populated
- Displays guardrail message about preserving original

### 2. InvestmentDetail Integration
**Updates**:
- State: `adjustmentModal` (tracks open cashflow)
- State: `allCashflows` (accumulated cashflows with adjustments)
- Handler: `handleAdjustCashflow()` - opens modal
- Handler: `handleAdjustmentSubmit()` - creates and appends adjustment entry
- Render: Adjustment button on system cashflows only

**UI Changes**:
- "Adjust" button appears only on system entries
- Disabled for manual entries
- Click opens modal
- After submission, new adjustment entry appears immediately below original

### 3. Visual Distinction
**CSS Classes**:
- `.cf-adjustment-entry`: Yellow-tinted entry with orange left border
- `.btn-adjust-cashflow`: Blue adjust button
- `.cf-adjustment-reason`: Styled reason text
- `.cf-linked-info`: Information block showing linked entry

**Color Scheme**:
| Element | Color | Hex |
|---------|-------|-----|
| Adjustment Entry BG | Light Yellow | #fef3c7 |
| Adjustment Border | Orange | #d97706 |
| Adjust Button | Blue | #3b82f6 |
| Positive Adjustment | Green | #16a34a |
| Negative Adjustment | Red | #b91c1c |

## Financial Calculations

### FY Summaries Include Adjustments
The `fySummaries` calculation now includes:
```javascript
{
  interestEarned: number,          // Base interest only
  tdsDeducted: number,             // Base TDS only
  adjustments: number,             // Sum of all manual adjustments
  netIncome: interestEarned - tdsDeducted + adjustments,
}
```

**Important**: Adjustments are **ADDED** to net income, not subtracted from interest
- This prevents "recalculating" interest
- Adjustments appear as separate line items in FY summaries

### No Recalculation of Base Interest
- ✅ Adjustments modify displayed totals
- ✅ Adjustments appear in diagnostics
- ❌ Original interest calculation is never modified
- ❌ Interest rates are never recomputed

## Maturity Override Handling

### Automatic Adjustment Creation
When user updates Investment.actualMaturityAmount:

1. **Calculate Delta**:
   ```javascript
   delta = actualMaturityAmount - expectedMaturityAmount
   ```

2. **Auto-Generate Adjustment**:
   ```javascript
   {
     type: 'adjustment',
     subtype: 'maturity_correction',
     amount: delta,
     source: 'manual',
     reason: 'Actual maturity override',
     adjustsCashflowId: maturityCashflowId,
   }
   ```

3. **Update Investment**:
   - Store both calculated and actual amounts
   - Use actual for downstream calculations
   - Preserve calculated for audit trail

### Utility: `processMaturityOverride()`
```javascript
import { processMaturityOverride } from '../utils/cashflowAdjustments.js';

const adjustment = processMaturityOverride(investment, cashflows);
if (adjustment) {
  setAllCashflows([...allCashflows, adjustment]);
}
```

## Workflow Examples

### Example 1: Interest Correction
**Scenario**: Bank statement shows ₹500 less interest than calculated

1. User clicks "Adjust" on interest payout entry
2. Modal opens showing: "Interest Payout - ₹30,750"
3. User enters:
   - Amount: `-500`
   - Reason: "Bank paid ₹500 less due to partial period"
4. Adjustment entry created:
   ```
   INTEREST_PAYOUT    +₹30,750 (system)
   ADJUSTMENT          -₹500   (manual) → "Bank paid ₹500 less..."
   ```
5. FY Summary updates:
   - Interest: ₹30,750 (unchanged)
   - Adjustments: -₹500
   - Net: ₹30,250

### Example 2: TDS Reconciliation
**Scenario**: Actual TDS deduction differs from calculated

1. Click "Adjust" on TDS entry
2. Enter: `+₹100` (overcredited by bank)
3. Reason: "Bank reversed excess TDS"
4. Result:
   - TDS base: -₹2,500 (unchanged)
   - Adjustment: +₹100
   - Net TDS: -₹2,400

### Example 3: Maturity Override
**Scenario**: Bank statement shows different maturity amount

1. Investment maturity date reached
2. User updates `investment.actualMaturityAmount`
3. System automatically creates adjustment:
   - If actual > calculated: positive delta
   - If actual < calculated: negative delta
4. Adjustment linked to maturity entry
5. Total interest reflects the delta

## Diagnostic & Audit Trail

### What Gets Logged
Each adjustment entry includes:
- **Original system entry reference** (`adjustsCashflowId`)
- **Reason for adjustment** (`reason` field)
- **Amount of correction** (`amount`)
- **Date created** (derived from entry date)
- **Source** (always "manual" for adjustments)

### Diagnostics Output
The "Copy diagnostics" feature includes:
- All system cashflows (unchanged)
- All adjustment entries with reasons
- Adjusted status flag on modified entries
- Recalculated net totals

### Example Diagnostics Format
```
=== INVESTMENT DIAGNOSTICS ===
Investment: My FD Account
Principal: ₹100,000
Rate: 6.5%

FY 2024-25 - 3 cashflows
  2024-09-30 | interest | 2000 | confirmed | system
  2024-09-30 | adjustment | -100 | confirmed | manual
  2024-12-31 | interest | 2050 | confirmed | system

Total Interest (FY summaries): 4050
Total Adjustments: -100
Total TDS: -500
Net Income: 3550
```

## API/Utility Functions

### `cashflowAdjustments.js`

```javascript
// Create adjustment entry for maturity override
createMaturityAdjustment(
  maturityCashflow,     // System maturity entry
  calculatedAmount,     // Expected maturity
  actualAmount          // User-entered maturity
) → adjustment object or null

// Find maturity cashflow for an investment
findMaturityCashflow(cashflows, investmentId) → cashflow or null

// Process maturity override
processMaturityOverride(investment, cashflows) → adjustment or null

// Get all adjustments for a cashflow
getAdjustmentsForCashflow(cashflows, cashflowId) → [adjustments]

// Calculate net effect including adjustments
getNetCashflowAmount(cashflow, cashflows) → number
```

## State Management

### InvestmentDetail Component State
```javascript
const [adjustmentModal, setAdjustmentModal] = useState(null);
const [allCashflows, setAllCashflows] = useState(mockCashFlows);
```

### Handlers
```javascript
// Open modal for a system cashflow
handleAdjustCashflow(cashflow)

// Submit adjustment and add to list
handleAdjustmentSubmit(adjustment)

// Close modal without saving
handleAdjustmentCancel()
```

## Guardrails & Constraints

### ✅ Allowed
- Adjust any system cashflow
- Create multiple adjustments for same entry
- Include detailed reason text (max 500 chars recommended)
- View all adjustments in timeline
- Export diagnostics with adjustments

### ❌ Forbidden
- ❌ Directly edit system cashflow amount
- ❌ Delete auto-generated entries
- ❌ Hide adjustment from timeline
- ❌ Create adjustment without reason
- ❌ Adjust adjustment entries
- ❌ Recalculate interest because of adjustments

### Validation Rules
1. Adjustment amount: Required, numeric, can be +/-
2. Reason: Required, non-empty, min 5 characters
3. System cashflow only: Can't adjust manual entries
4. Duplicate check: Warn if multiple adjustments for same cashflow (allowed but unusual)

## Implementation Checklist

- [x] CashFlow model includes `reason` field
- [x] CashflowAdjustmentModal component created
- [x] Modal styling (CashflowAdjustmentModal.css)
- [x] InvestmentDetail integrated with modal
- [x] "Adjust" button on system cashflows
- [x] FY summaries include adjustments
- [x] Visual distinction for adjustment entries
- [x] Maturity override utility functions
- [x] Guardrail comments in code
- [x] Adjustment entries display linked info

## Testing Scenarios

### Manual Testing
1. **Create Adjustment**: Click adjust on interest → submit → verify entry appears
2. **Multiple Adjustments**: Create 2 adjustments for same entry → verify both display
3. **FY Totals**: Verify net income includes adjustment amount
4. **Manual Entry Check**: Try to adjust manual entry → verify disabled/error
5. **Reason Validation**: Try submit without reason → verify error
6. **Diagnostics**: Copy diagnostics → verify adjustments included

### Expected Behavior
- Adjustment appears immediately after submission
- Original entry unchanged and visible
- FY summary totals reconcile: base + adjustments
- Adjustment reason visible in tooltip/detail
- Button disabled for manual entries

## Future Enhancements

### Phase 2 Considerations
- Bulk adjustment operations
- Adjustment templates (common reasons)
- Reversal of adjustments
- Adjustment history/changelog per cashflow
- Batch override for all maturity amounts in FY
- Adjustment approval workflow
- Integration with backend sync

## References

- CashFlow Model: `src/models/CashFlow.js`
- Investment Model: `src/models/Investment.js`
- Modal Component: `src/components/CashflowAdjustmentModal.jsx`
- InvestmentDetail Screen: `src/screens/InvestmentDetail.jsx`
- Utilities: `src/utils/cashflowAdjustments.js`
- Styles: `src/styles/CashflowAdjustmentModal.css`, `src/styles/InvestmentDetail.css`
