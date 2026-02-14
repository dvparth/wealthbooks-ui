# Premature Closure Feature Implementation

## Overview

The Premature Closure feature allows users to close investments before their scheduled maturity date, with automatic interest recalculation and optional penalty handling.

## Feature Capabilities

### 1. Premature Closure Data Model

Investment object now includes:
```javascript
prematureClosure: {
  isClosed: boolean,
  closureDate: YYYY-MM-DD,
  penaltyRate?: number,          // % reduction in interest rate
  penaltyAmount?: number,         // Fixed deduction from payout
  recalculatedInterest?: number,  // Computed interest up to closureDate
  finalPayout?: number            // principal + interest - penalties
}
```

### 2. Interest Recalculation

Two calculation methods supported:

#### Simple Interest (compounding = 'no')
```
interest = principal × rate × (daysHeld / 365)
```

#### Compound Interest (compounding = 'yes')
- Uses fractional compounding up to closure date
- Supports quarterly, monthly, or yearly compounding frequency
- Same algorithm as FD maturity calculation

#### Penalty Application
```
effectiveRate = originalRate - penaltyRate (if penaltyRate provided)
finalPayout = principal + recalculatedInterest - penaltyAmount
```

### 3. Cashflow Management

When an investment is prematurely closed:

**Removed:**
- All future system-generated INTEREST, INTEREST_PAYOUT, ACCRUED_INTEREST cashflows after closure date
- Future MATURITY_PAYOUT cashflows

**Generated:**
- MATURITY_PAYOUT on closure date (with final payout amount)
- PENALTY cashflow (if penalty is applied)
- TDS_DEDUCTION (if applicable)
- PREMATURE_CLOSURE (audit trail entry, zero amount)

**Preserved:**
- All manual cashflows and adjustments

### 4. Validation Rules

- Closure date must be after start date
- Closure date must be before original maturity date
- Final payout cannot be negative
- Penalty rate/amount must be non-negative
- Closure date, penalty rate, and penalty amount all validated

## File Structure

### New Files

1. **src/utils/prematureClosureCalculator.js**
   - `calculatePrematureInterest()` - Compute interest up to closure date
   - `calculatePrematureClosurePayout()` - Calculate final payout with penalties
   - `validatePrematureClosure()` - Validate closure parameters
   - `getClosureDiagnostics()` - Get diagnostics for display

2. **src/components/PrematureClosureModal.jsx**
   - Modal UI for initiating closure
   - Closure date picker
   - Penalty option selection (none, rate, or amount)
   - Real-time payout preview
   - Form validation

3. **src/styles/PrematureClosureModal.css**
   - Modal styling
   - Form inputs and validation states
   - Info boxes and previews

### Modified Files

1. **src/models/Investment.js**
   - Added `prematureClosure` field to investment schema

2. **src/utils/cashflowAdjustments.js**
   - Updated `getEffectiveMaturityAmount()` to return closure payout if closed
   - Added `removeFutureCashflows()` - Filter out future cashflows after closure
   - Added `generatePrematureClosureCashflows()` - Generate closure cashflows

3. **src/screens/InvestmentDetail.jsx**
   - Added closure modal state
   - Added `handlePrematureClosureSubmit()` handler
   - Added Premature Closure button (visible only for active investments)
   - Added closure status indicator
   - Added closure date to investment details section
   - Added closure diagnostics display card

4. **src/styles/InvestmentDetail.css**
   - Added `.closure-diagnostics-card` styling
   - Added diagnostics display grid styling

## Usage Flow

### 1. User Initiates Closure
- Opens investment detail page
- Clicks "🔒 Premature Closure" button (only visible for active investments)
- PrematureClosureModal opens

### 2. User Fills in Closure Details
- Selects closure date (must be between start and maturity dates)
- Selects penalty option:
  - **No penalty**: Interest calculated on full rate
  - **Reduce interest rate by %**: Penalty rate applied as reduction
  - **Fixed penalty amount**: Amount deducted from payout
- Real-time preview shows:
  - Days held (% of original term)
  - Recalculated interest
  - Penalty impact
  - Final payout amount

### 3. System Processes Closure
- Investment marked as closed with `prematureClosure` data
- Future cashflows removed
- New cashflows generated for closure date
- Diagnostics display shows:
  - Original vs. closure date comparison
  - Days held calculation
  - Rate and penalty details
  - Final payout breakdown

### 4. Portfolio Updates
- Investment status changes to "closed"
- Expected Maturity Amount reflects final payout
- Cashflow timeline updated with new entries
- Financial year summaries include closure adjustments

## Calculation Examples

### Example 1: Simple Interest with No Penalty
```
Principal: ₹100,000
Rate: 7%
Original Term: 2024-09-19 to 2025-12-07 (444 days)
Closure Date: 2025-03-19 (182 days held)

Interest = 100,000 × 0.07 × (182 / 365)
         = ₹3,479.45

Final Payout = 100,000 + 3,479.45 = ₹103,479.45
```

### Example 2: Compound Interest with Rate Penalty
```
Principal: ₹100,000
Rate: 7%
Compounding: Quarterly
Closure Date: 2025-03-19 (6 months)
Penalty Rate: 1% (reduces rate to 6%)

Effective Interest = Computed with 6% rate for 6 months
                   ≈ ₹2,969.79

Final Payout = 100,000 + 2,969.79 = ₹102,969.79
```

### Example 3: Fixed Penalty Deduction
```
Principal: ₹100,000
Rate: 7%
Closure Date: 2025-03-19
Recalculated Interest: ₹3,479.45
Fixed Penalty: ₹500

Final Payout = 100,000 + 3,479.45 - 500
             = ₹102,979.45
```

## Integration Points

### 1. Portfolio Summary
- `getEffectiveMaturityAmount()` returns closure payout for closed investments
- Portfolio maturity display automatically reflects closure amounts

### 2. Financial Year Summaries
- Closure interest counted in FY where closure occurred
- Penalty shown as separate adjustment
- TDS recalculated based on new interest amount

### 3. Cashflow Timeline
- Closure cashflows appear with MATURITY_PAYOUT type
- PREMATURE_CLOSURE entry marks closure event
- PENALTY entry shows penalty amount (if applicable)

### 4. Audit Trail
- All closure operations recorded in cashflows
- Manual and system-generated entries clearly marked
- Closure reason stored in audit comments

## Validation & Error Handling

### Date Validation
```javascript
✓ closureDate > startDate
✓ closureDate < maturityDate
✗ Invalid dates trigger specific error messages
```

### Amount Validation
```javascript
✓ penaltyRate: 0 to 100%
✓ penaltyAmount: ≥ 0
✓ finalPayout: ≥ 0
✗ Negative payout prevented
```

### TDS Handling
- TDS recalculated on recalculated interest amount
- TDS only applies if investment had TDS originally
- TDS deduction generated on closure date

## Feature Flags & Guards

### Active Closure Button
- Only visible when `investment.status === 'active'`
- Hidden when `prematureClosure?.isClosed === true`

### Closure Status Display
- Closed investments show closure date indicator
- Visual distinction between active and closed investments

### Cashflow Filtering
- Manual cashflows always preserved
- System cashflows after closure date removed
- All closure cashflows generated on closure date

## Testing Checklist

✅ Closure date validation  
✅ Interest recalculation (simple and compound)  
✅ Penalty application (rate and amount)  
✅ Negative payout prevention  
✅ TDS recalculation  
✅ Cashflow filtering (future removal)  
✅ Manual cashflow preservation  
✅ Investment status updates  
✅ Portfolio summary updates  
✅ FY summary calculations  
✅ Diagnostics display  
✅ Modal form validation  
✅ Real-time preview updates  

## Performance Considerations

1. **Cashflow Filtering**: O(n) where n = total cashflows (acceptable)
2. **Interest Calculation**: Uses logarithmic formulas (O(1))
3. **Validation**: Early exit on invalid dates (O(1))
4. **State Updates**: Minimal re-renders via useMemo optimization

## Future Enhancements

1. Batch closure operations
2. Closure policy templates
3. Closure forecasting (what-if analysis)
4. Closure reversal (undo functionality)
5. Partial closure (withdraw partial amount)
6. Mobile-optimized closure modal
7. Closure history/audit report
8. Export closure summary

## Backward Compatibility

- `prematureClosure` field optional (null for non-closed investments)
- Existing investments unaffected
- `getEffectiveMaturityAmount()` falls back to standard calculation
- All new fields safely nullable
