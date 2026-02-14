# Cashflow Adjustments: Integration Examples

This document provides practical code examples for integrating the cashflow adjustment feature into different parts of the application.

## Example 1: Basic Adjustment in Modal

### Scenario
User clicks "Adjust" on an interest payout, enters adjustment amount and reason.

### Code Flow
```javascript
// InvestmentDetail.jsx - User interaction
const handleAdjustCashflow = (cashflow) => {
  // Verify it's a system cashflow (already checked in button render)
  if (cashflow.source !== 'system') {
    alert('Cannot adjust manual entries');
    return;
  }
  setAdjustmentModal(cashflow);
};

// User fills in modal and clicks "Create Adjustment"
const handleAdjustmentSubmit = (adjustment) => {
  // adjustment object received from modal:
  // {
  //   type: 'adjustment',
  //   amount: -500,
  //   date: '2024-09-30',
  //   source: 'manual',
  //   reason: 'Bank credited lower interest',
  //   adjustsCashflowId: 'cf-fd-001',
  //   investmentId: 'inv-123',
  //   financialYear: '2024-25',
  //   status: 'confirmed'
  // }
  
  // 1. Create the cashflow object via factory
  const newAdjustment = createCashFlow(adjustment);
  
  // 2. Add to state
  setAllCashflows([...allCashflows, newAdjustment]);
  
  // 3. Close modal
  setAdjustmentModal(null);
  
  // Optional: Show confirmation
  console.log('Adjustment created:', newAdjustment.id);
};
```

### Visual Result
```
Timeline Before:
  2024-09-30 | Interest Payout | ₹30,750 | system | confirmed | [Adjust]

Timeline After:
  2024-09-30 | Interest Payout | ₹30,750 | system | confirmed | 
  2024-09-30 | Adjustment      | -₹500   | manual | confirmed | 
                                 ↑ Yellow highlight ↑
```

## Example 2: Maturity Override Auto-Adjustment

### Scenario
Investment matures. User enters actualMaturityAmount = ₹520,000, but calculated was ₹525,000.

### Code Flow
```javascript
import { processMaturityOverride } from '../utils/cashflowAdjustments.js';

// When investment.actualMaturityAmount is updated
const updateMaturityAmount = (investmentId, actualAmount) => {
  const investment = mockInvestments.find(i => i.id === investmentId);
  
  // Update investment
  investment.actualMaturityAmount = actualAmount;
  
  // Get all cashflows for this investment
  const investmentCashflows = allCashflows
    .filter(cf => cf.investmentId === investmentId);
  
  // Auto-generate adjustment if needed
  const adjustment = processMaturityOverride(investment, investmentCashflows);
  
  if (adjustment) {
    console.log('Auto-generated adjustment:', {
      delta: adjustment.amount,
      reason: adjustment.reason,
      linkedTo: adjustment.adjustsCashflowId
    });
    
    // Add to cashflows
    setAllCashflows([...allCashflows, adjustment]);
  } else {
    console.log('Amounts match, no adjustment needed');
  }
};

// Example call:
// updateMaturityAmount('inv-fd-001', 520000);
// Result: adjustment for -5000 created and linked to maturity entry
```

### Calculation Details
```javascript
// In processMaturityOverride():
const delta = actualMaturityAmount - expectedMaturityAmount;
//           = 520,000 - 525,000
//           = -5,000

// Adjustment created:
{
  type: 'adjustment',
  amount: -5000,                    // Negative because actual < expected
  date: '2025-11-20',              // Same as maturity date
  source: 'manual',
  reason: 'Actual maturity override - reconciliation with bank statement',
  adjustsCashflowId: 'cf-fd-001-mat',
  investmentId: 'inv-fd-001',
  financialYear: '2025-26',
  status: 'confirmed',
}
```

## Example 3: FY Summary with Adjustments

### Scenario
Calculate Financial Year summary including adjustment entries.

### Code
```javascript
// In InvestmentDetail.jsx
const fySummaries = useMemo(() => {
  const summaries = {};
  
  Object.entries(groupedByFY).forEach(([fy, cashflows]) => {
    let interestEarned = 0;
    let tdsDeducted = 0;
    let adjustments = 0;
    
    // Group 1: Sum interest entries
    cashflows.forEach((cf) => {
      if (['interest_payout', 'accrued_interest', 'interest', 'interest_accrual']
          .includes(cf.type)) {
        interestEarned += cf.amount;
      }
    });
    
    // Group 2: Sum TDS entries
    cashflows.forEach((cf) => {
      if (['tds_deduction', 'tds'].includes(cf.type)) {
        tdsDeducted += Math.abs(cf.amount);
      }
    });
    
    // Group 3: Sum adjustment entries (KEY NEW LOGIC)
    cashflows.forEach((cf) => {
      if (cf.type === 'adjustment') {
        adjustments += cf.amount;  // Include sign (+ or -)
      }
    });
    
    // Calculate net with adjustments
    summaries[fy] = {
      interestEarned: Math.round(interestEarned),
      tdsDeducted: Math.round(tdsDeducted),
      adjustments: Math.round(adjustments),
      netIncome: Math.round(interestEarned - tdsDeducted + adjustments),
      //                                                    ↑ adjustments added
    };
  });
  
  return summaries;
}, [groupedByFY]);
```

### Rendering FY Summary
```javascript
// Display summary with adjustment line
{summary.adjustments !== 0 && (
  <div>
    <span style={{ color: '#6b7280' }}>Adjustments:</span>
    <span style={{ 
      float: 'right', 
      color: summary.adjustments > 0 ? '#16a34a' : '#b91c1c',
      fontWeight: '500' 
    }}>
      {summary.adjustments > 0 ? '+' : ''}₹{summary.adjustments.toLocaleString('en-IN')}
    </span>
  </div>
)}
```

### Example Output
```
FY 2024-25 Summary

Interest Earned:    ₹30,750
TDS Deducted:       -₹3,075
Adjustments:        -₹500      ← New line
─────────────────────────────
Net Income:         ₹27,175    ← Updated calculation
```

## Example 4: Rendering Adjustment Entry in Timeline

### Scenario
Display adjustment entry in cashflow timeline with linked info.

### Code
```javascript
// Timeline rendering (InvestmentDetail.jsx)
{groupedByFY[fy].map((cf) => {
  const isSystemCashflow = cf.source === 'system';
  const isAdjustment = cf.type === 'adjustment';
  
  // Find the linked original entry
  const linkedCashflow = isAdjustment 
    ? persistedCashflows.find(c => c.id === cf.adjustsCashflowId)
    : null;
  
  return (
    <div
      key={cf.id}
      className={`cashflow-row 
        cf-type-${cf.type} 
        cf-source-${cf.source} 
        cf-status-${cf.status} 
        ${isAdjustment ? 'cf-adjustment-entry' : ''}`}
    >
      {/* Date column */}
      <div className="cf-date">
        {formatDate(cf.date)}
      </div>
      
      {/* Type column */}
      <div className="cf-type">
        {getCashflowTypeLabel(cf.type)}
        {isAdjustment && cf.reason && (
          <div className="cf-adjustment-reason">
            {cf.reason}
          </div>
        )}
      </div>
      
      {/* Amount column */}
      <div className={`cf-amount cf-type-${cf.type} 
        ${cf.amount < 0 ? 'cf-amount-negative' : 'cf-amount-positive'}`}>
        {cf.amount < 0 ? '−' : ''}{formatCurrency(Math.abs(cf.amount))}
      </div>
      
      {/* Source column */}
      <div className="cf-source">
        {cf.source}
      </div>
      
      {/* Status column */}
      <div className="cf-status">
        <span className={`status-pill cf-status-${cf.status}`}>
          {cf.status}
        </span>
      </div>
      
      {/* Actions column */}
      <div className="cf-actions">
        {isSystemCashflow && !cf.isPreview && (
          <button
            className="btn-adjust-cashflow"
            onClick={() => handleAdjustCashflow(cf)}
          >
            Adjust
          </button>
        )}
      </div>
      
      {/* Linked info for adjustment entries */}
      {isAdjustment && linkedCashflow && (
        <div className="cf-linked-info">
          Adjusts: {getCashflowTypeLabel(linkedCashflow.type)} 
          (₹{Math.abs(linkedCashflow.amount).toLocaleString('en-IN')})
        </div>
      )}
    </div>
  );
})}
```

## Example 5: Diagnostics with Adjustments

### Scenario
User exports diagnostics, which should include all adjustments.

### Code
```javascript
const handleCopyDiagnostics = async () => {
  // Build diagnostics text
  let detailed = '';
  
  Object.entries(groupedByFY).forEach(([fy, cashflows]) => {
    detailed += `\n${fy} - ${cashflows.length} cashflows\n`;
    
    cashflows.forEach((cf) => {
      let line = `  ${cf.date} | ${cf.type} | ${cf.amount} | ${cf.status} | ${cf.source}`;
      
      // Add adjustment reason to diagnostics
      if (cf.type === 'adjustment' && cf.reason) {
        line += ` | reason: "${cf.reason}"`;
      }
      
      detailed += line + '\n';
    });
  });
  
  const diagnostics = `
=== INVESTMENT DIAGNOSTICS ===

Investment: ${investment.name}
Principal: ${investment.principal}
Rate: ${investment.interestRate}%

${detailed}

=== SUMMARY ===
Total Cashflows: ${sortedCashflows.length}
Total Interest: ${Object.values(fySummaries).reduce((s, f) => s + (f.interestEarned || 0), 0)}
Total TDS: ${Object.values(fySummaries).reduce((s, f) => s + (f.tdsDeducted || 0), 0)}
Total Adjustments: ${Object.values(fySummaries).reduce((s, f) => s + (f.adjustments || 0), 0)}
`;
  
  // Copy to clipboard
  await navigator.clipboard.writeText(diagnostics);
};
```

### Example Output
```
=== INVESTMENT DIAGNOSTICS ===

Investment: My SIP FD Account
Principal: 100000
Rate: 6.5%

FY 2024-25 - 5 cashflows
  2024-09-30 | interest_payout | 2000 | confirmed | system
  2024-09-30 | adjustment | -100 | confirmed | manual | reason: "Bank paid lower due to penalty"
  2024-12-31 | interest_payout | 2050 | confirmed | system
  2024-12-31 | adjustment | 50 | confirmed | manual | reason: "Reversal of penalty"
  2024-12-31 | tds_deduction | -250 | confirmed | system

=== SUMMARY ===
Total Cashflows: 5
Total Interest: 4050
Total TDS: 250
Total Adjustments: -50
```

## Example 6: Using Utility Functions

### Scenario
Perform various operations with adjustment entries using utility functions.

### Code
```javascript
import { 
  getAdjustmentsForCashflow, 
  getNetCashflowAmount,
  findMaturityCashflow,
  processMaturityOverride 
} from '../utils/cashflowAdjustments.js';

// 1. Get all adjustments for a specific cashflow
const interestCashflow = allCashflows.find(cf => cf.type === 'interest_payout');
const adjustments = getAdjustmentsForCashflow(allCashflows, interestCashflow.id);

console.log(`Interest entry has ${adjustments.length} adjustments:`);
adjustments.forEach(adj => {
  console.log(`  ${adj.amount > 0 ? '+' : ''}${adj.amount}: ${adj.reason}`);
});

// 2. Calculate net effect including adjustments
const netInterest = getNetCashflowAmount(interestCashflow, allCashflows);
console.log(`Gross interest: ${interestCashflow.amount}`);
console.log(`After adjustments: ${netInterest}`);

// 3. Find maturity cashflow for an investment
const maturityCf = findMaturityCashflow(allCashflows, 'inv-fd-001');
if (maturityCf) {
  console.log(`Maturity amount: ${maturityCf.amount}`);
  console.log(`Date: ${maturityCf.date}`);
}

// 4. Auto-create adjustment for maturity override
const investment = mockInvestments.find(i => i.id === 'inv-fd-001');
const autoAdjustment = processMaturityOverride(investment, allCashflows);

if (autoAdjustment) {
  console.log('Auto-adjustment created:');
  console.log(`  Delta: ${autoAdjustment.amount}`);
  console.log(`  Reason: ${autoAdjustment.reason}`);
  
  // Add it
  setAllCashflows([...allCashflows, autoAdjustment]);
}
```

## Example 7: Form Validation in Modal

### Scenario
Modal validates that user enters required fields before submission.

### Code
```javascript
// CashflowAdjustmentModal.jsx
const validateForm = () => {
  const newErrors = {};
  
  // Validation 1: Amount required and numeric
  if (!adjustmentAmount || adjustmentAmount === '') {
    newErrors.adjustmentAmount = 'Adjustment amount is required';
  } else if (isNaN(adjustmentAmount)) {
    newErrors.adjustmentAmount = 'Must be a valid number';
  }
  
  // Validation 2: Reason required and non-empty
  if (!reason || reason.trim() === '') {
    newErrors.reason = 'Reason is mandatory';
  }
  
  // Additional: Could add min length, max length, etc.
  if (reason && reason.trim().length < 5) {
    newErrors.reason = 'Please provide at least 5 characters';
  }
  
  if (reason && reason.trim().length > 500) {
    newErrors.reason = 'Reason cannot exceed 500 characters';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;  // Don't submit if validation fails
  }
  
  // Proceed with submission
  const adjustment = {
    type: 'adjustment',
    amount: parseFloat(adjustmentAmount),
    date: cashflow.date,
    source: 'manual',
    reason: reason.trim(),
    adjustsCashflowId: cashflow.id,
    // ...
  };
  
  onSubmit(adjustment);
};
```

## Example 8: Preventing Adjustment of Adjustments

### Scenario
User can't click "Adjust" on an adjustment entry (only on system entries).

### Code
```javascript
// In cashflow row render
const isSystemCashflow = cf.source === 'system';

// Only show adjust button for system cashflows
{isSystemCashflow && !cf.isPreview && (
  <button
    className="btn-adjust-cashflow"
    onClick={() => handleAdjustCashflow(cf)}
  >
    Adjust
  </button>
)}

// Safeguard in handler
const handleAdjustCashflow = (cashflow) => {
  // Double-check: can't adjust manual entries
  if (cashflow.source !== 'system') {
    alert('Cannot adjust manual entries. Only system cashflows can be adjusted.');
    return;
  }
  
  // Also prevent adjusting adjustment entries
  if (cashflow.type === 'adjustment') {
    alert('Cannot adjust adjustment entries. Create a new adjustment instead.');
    return;
  }
  
  setAdjustmentModal(cashflow);
};
```

## Example 9: Multi-Adjustment Scenario

### Scenario
Multiple corrections made to same entry (e.g., initial correction, then reversal, then final correction).

### Timeline Result
```
System Entry:   INTEREST_PAYOUT      +₹30,750  (system)
Adjustment 1:   ADJUSTMENT            -₹500   (manual) - "Initial correction"
Adjustment 2:   ADJUSTMENT            +₹400   (manual) - "Partial reversal"
Adjustment 3:   ADJUSTMENT            -₹100   (manual) - "Final correction"

Net Effect: 30750 - 500 + 400 - 100 = 30550
```

### Code
```javascript
// Get all adjustments for the entry
const allAdjustments = getAdjustmentsForCashflow(
  allCashflows, 
  'cf-fd-001'
);

// Calculate net
const netAmount = interestCashflow.amount + 
  allAdjustments.reduce((sum, adj) => sum + adj.amount, 0);

console.log(`Interest: ${interestCashflow.amount}`);
console.log(`Adjustments applied: ${allAdjustments.length}`);
allAdjustments.forEach((adj, i) => {
  console.log(`  ${i + 1}. ${adj.amount > 0 ? '+' : ''}${adj.amount}: ${adj.reason}`);
});
console.log(`Net: ${netAmount}`);

// Output:
// Interest: 30750
// Adjustments applied: 3
//   1. -500: Initial correction
//   2. +400: Partial reversal
//   3. -100: Final correction
// Net: 30550
```

## Example 10: Backend Sync Preparation

### Scenario
When ready to integrate with backend, prepare payload for API.

### Code
```javascript
// Prepare cashflows for backend sync
const prepareForBackendSync = (cashflows, investmentId) => {
  const investmentCashflows = cashflows.filter(
    cf => cf.investmentId === investmentId
  );
  
  const payload = {
    investmentId,
    cashflows: investmentCashflows.map(cf => ({
      id: cf.id,
      type: cf.type,
      amount: cf.amount,
      date: cf.date,
      source: cf.source,
      status: cf.status,
      
      // Include adjustment-specific fields
      ...(cf.type === 'adjustment' && {
        adjustsCashflowId: cf.adjustsCashflowId,
        reason: cf.reason,
      }),
      
      // Other fields as needed
      investmentId: cf.investmentId,
      financialYear: cf.financialYear,
    })),
    
    // Summary for verification
    summary: {
      totalSystem: investmentCashflows
        .filter(cf => cf.source === 'system').length,
      totalAdjustments: investmentCashflows
        .filter(cf => cf.type === 'adjustment').length,
      totalAmount: investmentCashflows
        .reduce((sum, cf) => sum + cf.amount, 0),
    },
  };
  
  return payload;
};

// Usage:
const payload = prepareForBackendSync(allCashflows, 'inv-fd-001');
await fetch('/api/investments/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

---

These examples demonstrate the complete lifecycle of cashflow adjustments from user interaction through data persistence, calculation, and diagnostic reporting.
