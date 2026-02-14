# Premature Closure - Maturity Override Feature

## Feature Enhancement

Added capability to let users specify a custom/actual premature maturity amount instead of using calculated values.

## What Changed

### 1. PrematureClosureModal.jsx

**New State**:
- `maturityOverride` - Stores user-specified payout amount

**New UI Elements**:
- Payout Calculation Method radio group:
  - "Calculate based on interest & penalties" (default)
  - "Specify exact payout amount"
- Maturity Override input field (shown when override mode selected)

**Logic Updates**:
- When `maturityOverride` is set, payout preview bypasses penalty calculations
- Preview shows: `finalPayout = maturityOverride`
- Penalty inputs hidden when override mode is active
- Validation ensures override amount ≥ principal

**Conditional Rendering**:
```jsx
// Show override input only when selected
{maturityOverride !== '' && (
  <div className="form-group">
    <label htmlFor="maturityOverride">
      Payout Amount (₹) <span className="required-indicator">*</span>
    </label>
    <input type="number" ... />
  </div>
)}

// Hide penalty selection when override active
{maturityOverride === '' && (
  <div className="form-group">
    {/* Penalty options */}
  </div>
)}
```

### 2. Investment Model

**Updated prematureClosure schema**:
```javascript
prematureClosure: {
  isClosed: boolean,
  closureDate: YYYY-MM-DD,
  penaltyRate?: number,
  penaltyAmount?: number,
  recalculatedInterest?: number,
  finalPayout?: number,
  maturityOverride?: number  // NEW: User-specified payout amount
}
```

## Usage Flow

### Scenario 1: User chooses to calculate
1. Opens Premature Closure modal
2. Selects closure date
3. Selects "Calculate based on interest & penalties"
4. Chooses penalty option (rate/amount/none)
5. Sees preview with calculated payout
6. Confirms

### Scenario 2: User specifies exact amount
1. Opens Premature Closure modal
2. Selects closure date
3. Selects "Specify exact payout amount"
4. Penalty inputs hidden
5. Enters desired payout amount
6. Sees preview with exact amount
7. Confirms

## Validation Rules

### When using Override Amount
- Must be ≥ principal (e.g., ₹100,000 minimum for ₹100,000 investment)
- Must be a valid positive number
- Cannot be negative or zero

### When using Calculation
- Penalty rate: 0-100%
- Penalty amount: ≥ 0
- Final payout must be > 0

## Example Cases

### Case 1: Bank provides settlement amount
```
Investment: ₹1,00,000
Closure Date: 2025-03-19 (180 days)
Bank provides settlement: ₹1,03,500

User selects: "Specify exact payout amount"
Input: 103500
Result: finalPayout = 103500
```

### Case 2: Calculate with rate penalty
```
Investment: ₹1,00,000
Rate: 7%
Closure: 180 days
Penalty: Reduce rate by 1%

User selects: "Calculate based on interest & penalties"
Penalty option: "Reduce interest rate by %"
Penalty rate: 1
Result: finalPayout = calculated with 6% rate
```

### Case 3: Calculate with fixed penalty
```
Investment: ₹1,00,000
Rate: 7%
Closure: 180 days
Penalty: ₹500 deduction

User selects: "Calculate based on interest & penalties"
Penalty option: "Fixed penalty amount"
Penalty amount: 500
Result: finalPayout = principal + interest - 500
```

## Data Saved

When user confirms, `prematureClosure` object includes:
```javascript
{
  isClosed: true,
  closureDate: "2025-03-19",
  penaltyRate: undefined,        // Only if calculated method
  penaltyAmount: undefined,       // Only if calculated method
  recalculatedInterest: 3500,     // Interest calculated to closure date
  finalPayout: 103500,            // The payout amount (override or calculated)
  maturityOverride: 103500        // Set if user chose override method
}
```

## Display in Detail Screen

When investment is closed with override:
```
Diagnostics shows:
- Original maturity vs. closure date
- Days held
- Original rate
- Final payout (marked as "User-specified" if override was used)
```

## Benefits

1. **Flexibility**: Accommodates bank's actual settlement amounts
2. **Accuracy**: Matches real-world transactions
3. **Choice**: Users can calculate or specify as needed
4. **Validation**: Ensures reasonable values
5. **Clarity**: Clear distinction between calculated vs. specified

## Testing Scenarios

✅ Select "Calculate based on interest" → Show penalty options
✅ Select "Specify exact payout" → Hide penalty options  
✅ Switch between modes → Inputs update correctly
✅ Enter override < principal → Show error
✅ Enter valid override → Show preview with exact amount
✅ Submit with override → Save with maturityOverride field
✅ Submit with calculation → Save without maturityOverride field
✅ View closed investment → Display override indicator if used
