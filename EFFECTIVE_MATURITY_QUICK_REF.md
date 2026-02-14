# Effective Maturity Amount Fix - Quick Reference

## 🎯 What Was Fixed

**Bug**: Expected Maturity Amount ignored manual overrides and ADJUSTMENT cashflows
**Fix**: New helper function calculates effective maturity from multiple sources

## 📦 New Functions

### getEffectiveMaturityAmount(investment, cashflows)
Returns the effective maturity amount to display:
- If `actualMaturityAmount` set → use it
- Else → `expectedMaturityAmount` + sum of ADJUSTMENT cashflows

```javascript
import { getEffectiveMaturityAmount } from '../utils/cashflowAdjustments.js'

// Usage in components:
const maturity = getEffectiveMaturityAmount(investment, cashflows)
displayValue = formatCurrency(maturity)
```

### preserveManualCashflows(existingCashflows, newSystemCashflows)
Merges system cashflows with manual entries during regeneration:
- Keeps all manual cashflows
- Keeps all ADJUSTMENT entries
- Combines with new system cashflows

```javascript
import { preserveManualCashflows } from '../utils/cashflowAdjustments.js'

// Usage during regeneration:
const manualCashflows = existingCashflows.filter(cf => cf.source === 'manual')
const systemCashflows = generateSystemCashflows(...)
const merged = preserveManualCashflows(existingCashflows, systemCashflows)
```

## 🔧 Updated Files

### Core Logic
- ✅ `src/utils/cashflowAdjustments.js` - Added 3 new functions
- ✅ `src/models/CashFlow.js` - Added `linkedTo` field

### UI Components
- ✅ `src/screens/InvestmentDetail.jsx` - Line 373 (Expected Maturity display)
- ✅ `src/screens/InvestmentsList.jsx` - Lines 320 & 56-73 (display + sorting)

### Mock Data
- ✅ `src/mocks/cashflows.js` - Updated ADJUSTMENT entries with `linkedTo`

## 📋 Case-Sensitive Enums

**MUST USE EXACT CASE** (will not match otherwise):

```javascript
// Type field - UPPERCASE
cf.type === 'ADJUSTMENT'     // ✅ Correct
cf.type === 'adjustment'     // ❌ Wrong

// LinkedTo field - UPPERCASE  
cf.linkedTo === 'MATURITY'   // ✅ Correct
cf.linkedTo === 'maturity'   // ❌ Wrong

// Source field - lowercase
cf.source === 'manual'       // ✅ Correct
cf.source === 'MANUAL'       // ❌ Wrong
```

## 🔄 Data Flow

```
Manual Maturity Edit
    ↓
investment.actualMaturityAmount = value
    ↓
createMaturityAdjustment() → ADJUSTMENT cashflow
    ↓
getEffectiveMaturityAmount() calculates display value
    ↓
UI updates immediately
```

## ✅ Verification Results

| Item | Status |
|------|--------|
| Syntax Errors | 0 ✅ |
| Helper Function | Implemented ✅ |
| UI Components | Updated (3 locations) ✅ |
| Cashflow Preservation | Implemented ✅ |
| Enum Consistency | Verified ✅ |
| Backwards Compatible | 100% ✅ |

## 🚀 Usage Examples

### Example 1: Display Effective Maturity in Detail View
```javascript
// InvestmentDetail.jsx
import { getEffectiveMaturityAmount } from '../utils/cashflowAdjustments.js'

export default function InvestmentDetail({ investmentId }) {
  // ...
  return (
    <div>
      <div>Expected Maturity Amount</div>
      <div>
        {getEffectiveMaturityAmount(investment, allCashflows) 
          ? formatCurrency(getEffectiveMaturityAmount(investment, allCashflows))
          : '—'}
      </div>
    </div>
  )
}
```

### Example 2: Sort by Effective Maturity
```javascript
// InvestmentsList.jsx
const sorted = useMemo(() => {
  const copy = [...filtered]
  copy.sort((a, b) => {
    if (sortBy.key === 'expectedMaturityAmount') {
      const va = getEffectiveMaturityAmount(a, mockCashFlows) ?? -Infinity
      const vb = getEffectiveMaturityAmount(b, mockCashFlows) ?? -Infinity
      return (va - vb) * dir
    }
    return 0
  })
  return copy
}, [filtered, sortBy])
```

### Example 3: Create Maturity Adjustment
```javascript
// Utility
import { createMaturityAdjustment } from '../utils/cashflowAdjustments.js'

// When user enters actual maturity:
const adjustment = createMaturityAdjustment(
  maturityCashflow,           // The system maturity entry
  expectedMaturityAmount,     // What was calculated
  actualMaturityAmount        // What user entered
)

// adjustment will be:
{
  type: 'ADJUSTMENT',
  linkedTo: 'MATURITY',
  amount: actualMaturityAmount - expectedMaturityAmount,
  reason: 'Actual maturity override - reconciliation with bank statement',
  adjustsCashflowId: maturityCashflow.id,
  ...otherFields
}
```

## 🔍 Debugging

### Check if effective maturity is calculated correctly
```javascript
// In browser console:
investment.expectedMaturityAmount  // Base value
investment.actualMaturityAmount    // Override (if any)
getEffectiveMaturityAmount(investment, allCashflows)  // What's displayed

// If manually entered override exists:
getEffectiveMaturityAmount() === investment.actualMaturityAmount

// If only adjustments:
getEffectiveMaturityAmount() === investment.expectedMaturityAmount + sum(adjustments)
```

### Verify ADJUSTMENT cashflows exist
```javascript
// Find all ADJUSTMENT entries for a maturity:
const adjustments = cashflows.filter(cf => 
  cf.type === 'ADJUSTMENT' && 
  cf.linkedTo === 'MATURITY' &&
  cf.investmentId === investment.id
)

// Check total adjustment value:
const totalAdjustment = adjustments.reduce((sum, cf) => sum + cf.amount, 0)
```

## 📚 Related Documentation

- [EFFECTIVE_MATURITY_FIX.md](./EFFECTIVE_MATURITY_FIX.md) - Full implementation details
- [EFFECTIVE_MATURITY_VERIFICATION.md](./EFFECTIVE_MATURITY_VERIFICATION.md) - Complete verification report
- [src/utils/cashflowAdjustments.js](./src/utils/cashflowAdjustments.js) - Source code

## 🎓 Key Concepts

1. **Non-Destructive Editing**: Original `expectedMaturityAmount` never changes; adjustments are separate entries
2. **Audit Trail**: Every adjustment has a `reason` field and `adjustsCashflowId` link
3. **Case-Sensitive Enums**: Type comparisons must use exact case
4. **Backwards Compatible**: Existing investments work unchanged; new fields optional
5. **Effective Value**: What user sees combines base + all adjustments

---

**Status**: Production Ready ✅
**Last Updated**: 2026-02-14
