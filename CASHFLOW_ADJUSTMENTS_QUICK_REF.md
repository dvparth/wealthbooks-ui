# Cashflow Adjustments: Quick Reference

## TL;DR
- 🎯 **Purpose**: Edit auto-generated cashflows safely via adjustment entries
- 🚫 **Rule**: Never modify system entries, always create linked adjustment entries
- ✅ **Method**: Click "Adjust" → enter amount + reason → adjustment entry created
- 📊 **Impact**: Net totals = base cashflows + adjustments

## For Product Managers

### User Story Implementation
**As a** WealthBooks user
**I want to** adjust interest/TDS/maturity when bank statement differs
**So that** my investment records reconcile with actual amounts

### Key Features Delivered
✅ Non-destructive adjustment entry system  
✅ Audit trail preservation (original + adjustment visible)  
✅ Maturity override with auto-delta calculation  
✅ FY summary reconciliation including adjustments  
✅ Visual distinction (orange highlight for adjustments)  

### Acceptance Criteria Met
- [x] User can adjust any system cashflow
- [x] Original entry remains untouched and visible
- [x] Adjustment entry appears immediately after
- [x] Totals reconcile correctly (base + adjustments)
- [x] Adjustment reason is mandatory
- [x] Diagnostics reflect all adjustments

## For Developers

### Quick Integration Points

#### 1. Adding Adjust Functionality to New Screens
```javascript
import CashflowAdjustmentModal from '../components/CashflowAdjustmentModal.jsx';

// State
const [adjustmentModal, setAdjustmentModal] = useState(null);
const [cashflows, setCashflows] = useState([]);

// Handlers
const handleAdjust = (cashflow) => setAdjustmentModal(cashflow);
const handleSubmit = (adjustment) => {
  setCashflows([...cashflows, adjustment]);
  setAdjustmentModal(null);
};

// JSX
{adjustmentModal && (
  <CashflowAdjustmentModal
    cashflow={adjustmentModal}
    onSubmit={handleSubmit}
    onCancel={() => setAdjustmentModal(null)}
  />
)}
```

#### 2. Maturity Override Handling
```javascript
import { processMaturityOverride } from '../utils/cashflowAdjustments.js';

// When investment.actualMaturityAmount changes:
const adjustment = processMaturityOverride(investment, cashflows);
if (adjustment) {
  setCashflows([...cashflows, adjustment]);
}
```

#### 3. Include Adjustments in Totals
```javascript
// OLD: Just base amounts
const total = cashflows
  .filter(cf => cf.type === 'interest_payout')
  .reduce((s, cf) => s + cf.amount, 0);

// NEW: Base + adjustments
const interestBase = cashflows
  .filter(cf => cf.type === 'interest_payout')
  .reduce((s, cf) => s + cf.amount, 0);

const adjustments = cashflows
  .filter(cf => cf.type === 'adjustment')
  .reduce((s, cf) => s + cf.amount, 0);

const netInterest = interestBase + adjustments;
```

### File Structure
```
src/
├── components/
│   └── CashflowAdjustmentModal.jsx       (Modal component)
├── models/
│   └── CashFlow.js                      (Updated with reason field)
├── screens/
│   └── InvestmentDetail.jsx             (Integrated with modal)
├── styles/
│   ├── CashflowAdjustmentModal.css       (Modal styling)
│   └── InvestmentDetail.css             (Updated with adjustment styles)
└── utils/
    └── cashflowAdjustments.js           (Utility functions)
```

### Key Constants
```javascript
// Adjustment entry type
type: 'adjustment'

// Source always manual for adjustments
source: 'manual'

// Status always confirmed
status: 'confirmed'

// Link to original via
adjustsCashflowId: originalCashflowId
```

### Styling Classes
```css
.cf-adjustment-entry           /* Yellow highlight for adjustment rows */
.btn-adjust-cashflow           /* Blue adjust button */
.cf-adjustment-reason          /* Styled reason text */
.cf-linked-info                /* Info about linked entry */
```

## Common Workflows

### Adding "Adjust" to a New Cashflow Type
1. No code changes needed - button appears on all system cashflows
2. Modal handles all types automatically
3. Adjustment entry structure is generic

### Displaying Net Amounts
```javascript
import { getNetCashflowAmount } from '../utils/cashflowAdjustments.js';

const netAmount = getNetCashflowAmount(cashflow, allCashflows);
// Returns: cashflow.amount + sum of linked adjustments
```

### Checking if Cashflow Was Adjusted
```javascript
import { getAdjustmentsForCashflow } from '../utils/cashflowAdjustments.js';

const adjustments = getAdjustmentsForCashflow(cashflows, cashflowId);
if (adjustments.length > 0) {
  console.log(`This entry has ${adjustments.length} adjustments`);
}
```

## Validation Rules

| Rule | Enforcement |
|------|-------------|
| Amount required | Modal field required |
| Amount numeric | Input type="number" |
| Reason required | Modal field required |
| Reason non-empty | Validation error |
| System cashflow only | Button only appears on `source='system'` |
| Can't adjust adjustments | Check `type !== 'adjustment'` |

## Guardrail Comments in Code

```javascript
// System cashflows are immutable. Corrections are modeled via adjustment entries.
```

This comment appears in:
- CashFlow.js (model definition)
- CashflowAdjustmentModal.jsx (modal info box)
- InvestmentDetail.jsx (adjustment handlers)

## Testing Quick Checklist

- [ ] Click "Adjust" on interest entry → modal opens
- [ ] Enter amount `-500` and reason "Bank paid less"
- [ ] Submit → adjustment appears in timeline
- [ ] Original entry still visible below
- [ ] FY summary shows: Interest base + adjustment in net income
- [ ] Copy diagnostics includes adjustment entry
- [ ] Try to adjust manual entry → button disabled
- [ ] Try submit without reason → validation error

## Debugging Tips

### Adjustment Not Appearing
```javascript
// Check 1: Is it in allCashflows state?
console.log('Cashflows:', allCashflows);

// Check 2: Is it being filtered out?
const adjustments = allCashflows.filter(cf => cf.type === 'adjustment');
console.log('Adjustments found:', adjustments);

// Check 3: Is the investmentId correct?
const targetInv = allCashflows.filter(cf => cf.investmentId === targetId);
console.log('Cashflows for investment:', targetInv);
```

### FY Summary Wrong
```javascript
// Check: Are adjustments included?
const summary = fySummaries['FY2024-25'];
console.log('Interest:', summary.interestEarned);
console.log('TDS:', summary.tdsDeducted);
console.log('Adjustments:', summary.adjustments);
console.log('Net:', summary.netIncome);
// Net should = Interest - TDS + Adjustments
```

### Modal Not Appearing
```javascript
// Check: Is adjustmentModal state set?
console.log('Modal state:', adjustmentModal);

// Check: Is component rendering?
{adjustmentModal && <CashflowAdjustmentModal ... />}
// Remove the && to debug render
```

## Performance Notes
- Adjustment entries are lightweight (just amount + reason)
- No recalculation of interest rates
- Filtering/finding adjustments is O(n) - acceptable for typical use
- FY summary calculation includes adjustment summation (minimal overhead)

## Security Considerations
- ✅ No sensitive data in reason field
- ✅ Reason is user-generated, display as-is (not templated)
- ✅ No backend calls in current implementation
- 🔒 When backend integration added: validate reason server-side

## Migration Notes

### From Previous System (if any)
- Previous adjustments stored differently? Map them using:
  ```javascript
  const migrated = oldAdjustment.map(adj => createCashFlow({
    type: 'adjustment',
    amount: adj.delta,
    date: adj.date,
    source: 'manual',
    reason: adj.note || 'Migrated adjustment',
    adjustsCashflowId: adj.linkedToId,
    ...
  }));
  ```

## FAQ

**Q: Can I adjust an adjustment?**  
A: No. Check `type !== 'adjustment'` before showing adjust button.

**Q: What if amount is 0?**  
A: Validation should catch empty field, but if needed, filter out zero adjustments in totals.

**Q: Can multiple users adjust same entry?**  
A: Currently yes. Multiple adjustments allowed (unusual but valid). Backend may want to add locking.

**Q: Does adjustment appear in PDF export?**  
A: Yes - if export logic uses same cashflow list, adjustments will be included.

**Q: How do I reverse an adjustment?**  
A: Create new adjustment with opposite amount. Both will be visible for transparency.

**Q: Does maturity override auto-trigger adjustment?**  
A: Yes, if implemented via `processMaturityOverride()`. Otherwise, it's manual.

## Related Documentation
- Full Implementation: [CASHFLOW_ADJUSTMENTS_IMPLEMENTATION.md](./CASHFLOW_ADJUSTMENTS_IMPLEMENTATION.md)
- CashFlow Model: See `src/models/CashFlow.js`
- Investment Model: See `src/models/Investment.js`
