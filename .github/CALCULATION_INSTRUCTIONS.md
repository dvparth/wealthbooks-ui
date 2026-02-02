# WealthBooks Investment Calculation Instructions

## 📋 Document Overview

This document provides complete technical specifications for the **WealthBooks Investment Calculation Engine**, capturing every detail of interest calculation logic, cashflow generation, and tax treatment for various investment types.

**Scope**: Fixed Deposits (FDs), National Savings Certificates (NSCs), and other cumulative investments with per-FY interest accrual.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Interest Calculation Engines](#interest-calculation-engines)
3. [Investment Classification](#investment-classification)
4. [Cumulative Investment Logic](#cumulative-investment-logic)
5. [Non-Cumulative Investment Logic](#non-cumulative-investment-logic)
6. [Financial Year Accrual Model](#financial-year-accrual-model)
7. [TDS Calculation](#tds-calculation)
8. [Cashflow Generation](#cashflow-generation)
9. [Validation & Invariants](#validation--invariants)
10. [UI Presentation](#ui-presentation)

---

## Core Concepts

### 1.1 Investment Classification

Every investment falls into one of two categories:

#### **Cumulative Investments** (Interest paid at maturity)
- Interest accrues but is NOT paid until maturity
- Interest compounds over the investment period
- Taxable in the financial year it accrues (per Indian IT rules)
- Examples: Fixed Deposits (FDs), National Savings Certificates (NSCs)
- **Payout Frequency**: `maturity`
- **Compounding**: `yes` (unless explicitly marked simple interest)

#### **Non-Cumulative Investments** (Periodic interest payouts)
- Interest is paid at regular intervals (monthly, quarterly, annually)
- Interest does NOT compound (paid out immediately)
- Taxable in the FY when paid
- Examples: Senior Citizen Savings Scheme (periodic payouts)
- **Payout Frequency**: `monthly`, `quarterly`, `annually`
- **Compounding**: Usually `no`

### 1.2 Key Investment Properties

```javascript
{
  principal,                          // ₹ amount invested
  interestRate,                       // % p.a. (e.g., 6.8 for 6.8%)
  startDate,                          // YYYY-MM-DD (investment start)
  maturityDate,                       // YYYY-MM-DD (investment end)
  interestCalculationFrequency,       // quarterly | monthly | yearly
  interestPayoutFrequency,            // monthly | quarterly | yearly | maturity
  compounding,                        // 'yes' | 'no'
  calculationMode,                    // 'fractional' | 'bank' (for FDs)
  tdsApplicable,                      // boolean
  tdsRate,                            // % (typically 10% for bank FDs in India)
  actualMaturityAmount                // optional override from bank statement
}
```

### 1.3 Day-Count Convention

- **ACT/365**: Actual days elapsed ÷ 365
  - Most Indian banks use this convention
  - Examples: FDs, NSCs
  - **Duration Calculation**: `floor((endDate - startDate) / (24×60×60×1000))`
  - Does NOT include the end date (exclusive counting)

---

## Interest Calculation Engines

### 2.1 Fractional Compounding Engine (`calculateFdMaturity`)

**Use Case**: FDs, NSCs with quarterly/monthly/yearly compounding

**Algorithm**:

```
Period Rate = (Annual Rate %) ÷ 100 ÷ Compounding Frequency Per Year

Fractional Periods = (Duration Days ÷ 365) × Compounding Frequency Per Year

Growth Factor = (1 + Period Rate)^(Fractional Periods)
              = e^(ln(1 + Period Rate) × Fractional Periods)

Maturity Amount = Principal × Growth Factor

Interest Earned = Maturity Amount - Principal
```

**Example**:
```
Principal: ₹60,000
Annual Rate: 6.8%
Duration: 5 years (1,826 days)
Compounding: Yearly (frequency = 1)

Period Rate = 0.068 ÷ 1 = 0.068
Fractional Periods = (1,826 ÷ 365) × 1 = 5.00274
Growth Factor = (1.068)^5.00274 = 1.38975...
Maturity Amount = 60,000 × 1.38975 = ₹83,385.00
Interest Earned = ₹23,385.00
```

**Rounding**:
- Bank-style rounding: Round half away from zero to 2 decimals
- Only final monetary outputs are rounded; intermediate calculations use full precision

### 2.2 Bank-Style Compounding Engine (`calculateFdMaturityBankStyle`)

**Use Case**: FDs with quarterly compounding + remainder days (simulates actual bank process)

**Algorithm**:

1. **Split duration into full quarters + remainder days**:
   ```
   Full Quarters = floor(Duration Days ÷ 91.25)
   Remainder Days = Duration Days mod 91.25
   ```

2. **Compound through full quarters**:
   ```
   After Quarters = Principal × (1 + Quarterly Rate)^(Full Quarters)
   Quarterly Rate = Annual Rate ÷ 4 ÷ 100
   ```

3. **Apply simple interest for remainder days**:
   ```
   Final Amount = After Quarters × (1 + (Annual Rate ÷ 100) × (Remainder Days ÷ 365))
   ```

4. **Calculate interest**:
   ```
   Interest = Final Amount - Principal
   ```

**Rounding**: Per-quarter rounding + final rounding

**Example** (Reference case):
```
Principal: ₹457,779
Annual Rate: 7.75%
Duration: 444 days
Compounding Frequency: Quarterly

Full Quarters = floor(444 ÷ 91.25) = 4
Remainder Days = 444 - (4 × 91.25) = 39.75

Quarterly Rate = 7.75 ÷ 4 ÷ 100 = 0.019375
After Q4 = 457,779 × (1.019375)^4 = 495,949.58

Simple Interest (remainder) = 495,949.58 × 0.0775 × (39.75 ÷ 365) = 5,234.64

Final Amount = 495,949.58 + 5,234.64 = ₹502,592.73
Interest = ₹44,813.73
```

### 2.3 Simple Interest Engine

**Use Case**: Investments marked `compounding: 'no'`

**Algorithm**:
```
Duration Years = Duration Days ÷ 365.25

Interest = Principal × Annual Rate ÷ 100 × Duration Years

Maturity Amount = Principal + Interest
```

**Example**:
```
Principal: ₹1,00,000
Annual Rate: 5%
Duration: 365 days

Interest = 1,00,000 × 5 ÷ 100 × (365 ÷ 365.25) = ₹4,998.99
Maturity Amount = ₹1,04,998.99
```

---

## Investment Classification

### 3.1 Determination Logic

**Is Cumulative?**
```javascript
isCumulative = (interestPayoutFrequency === 'maturity')
             && (investmentType supports cumulative)
```

**Is Non-Cumulative?**
```javascript
isNonCumulative = (interestPayoutFrequency !== 'maturity')
                && (compounding === 'no' OR special handling exists)
```

**Is Mature?**
```javascript
isMatured = today >= maturityDate
```

---

## Cumulative Investment Logic

### 4.1 Overview

Cumulative investments (like FDs) accrue interest across the entire period but don't pay out until maturity. However, for **Indian tax compliance**, interest must be recognized and taxed in the financial year it accrues, not when it's actually paid.

### 4.2 Total Interest Calculation

1. **Determine compounding mode**:
   ```javascript
   if (compounding === 'no') {
     use Simple Interest Engine
   } else if (calculationMode === 'bank') {
     use Bank-Style Compounding Engine
   } else {
     use Fractional Compounding Engine (default)
   }
   ```

2. **Compute total interest** using selected engine
3. **Store result** for per-FY breakdown

### 4.3 Per-Financial Year Accrual Calculation

**Why per-FY?** Indian law requires interest accrual to be taxed in the FY it accrues, even if not received. This is called "Accrual Basis Taxation."

**Process**:

1. **Identify all Financial Years (FYs) crossed**:
   - FY runs from April 1 to March 31
   - Example: FY2023-24 = Apr 1, 2023 to Mar 31, 2024

2. **For each FY, calculate accumulated balance at FY-end**:
   ```javascript
   // Using the same compounding formula, but calculate balance at FY boundary
   
   daysFromStart = floor((FY End Date - Start Date) / MS_PER_DAY)
   yearsFromStart = daysFromStart / 365.25
   
   if (compounding === 'no') {
     AccumulatedAtFYEnd = Principal + (Principal × Rate ÷ 100 × yearsFromStart)
   } else {
     periodRate = (Rate ÷ 100) ÷ compoundingFrequencyPerYear
     periodsFromStart = yearsFromStart × compoundingFrequencyPerYear
     AccumulatedAtFYEnd = Principal × (1 + periodRate)^(periodsFromStart)
   }
   ```

3. **Calculate interest for that FY**:
   ```javascript
   InterestForFY = AccumulatedAtFYEnd - AccumulatedAtPreviousFYEnd
   
   // First FY special case:
   InterestForFirstFY = AccumulatedAtFirstFYEnd - Principal
   ```

4. **Generate interest_accrual cashflow**:
   ```javascript
   {
     id: `accrual-FY2023-24`,
     date: '2024-03-31',          // FY end date
     type: 'interest_accrual',
     amount: 4674.36,              // ₹ amount for that FY
     fy: 'FY2023-24',
     status: 'completed' | 'planned'
   }
   ```

### 4.4 Example: NSC ₹60,000 @ 6.8% for 5 years

**Investment Details**:
- Start: 2021-03-17
- Maturity: 2026-03-17
- Compounding: Yearly

**FY Breakdown**:

| FY | FY End | Days from Start | Accumulated (₹) | Interest This FY (₹) |
|----|--------|-----------------|-----------------|----------------------|
| 2020-21 | 2021-03-31 | 15 | 60,192.10 | 192.10 |
| 2021-22 | 2022-03-31 | 380 | 64,866.46 | 4,674.36 |
| 2022-23 | 2023-03-31 | 745 | 69,540.82 | 4,674.36 |
| 2023-24 | 2024-03-31 | 1,111 | 74,227.98 | 4,687.16 |
| 2024-25 | 2025-03-31 | 1,476 | 78,902.34 | 4,674.36 |
| 2025-26 | 2026-03-17 | 1,826 | 83,385.00 | 4,495.07 |
| **TOTAL** | | | | **₹23,397.41** |

**Note**: Each year's interest is calculated on the growing balance (compounding), not on the original principal.

---

## Non-Cumulative Investment Logic

### 5.1 Overview

Interest is paid out at regular intervals and does NOT compound. Each payment is independent.

### 5.2 Payout Schedule Generation

**For Monthly Payout**:
```javascript
payoutDates = []
for each month from start to maturity:
  payoutDates.push(monthEnd(month))
```

**For Quarterly Payout**:
```javascript
payoutDates = []
quarters = [Mar 31, Jun 30, Sep 30, Dec 31]
for each quarter in years between start and maturity:
  if quarterDate >= start && quarterDate <= maturity:
    payoutDates.push(quarterDate)
```

**For Annual Payout**:
```javascript
payoutDates = []
anniversaryDate = startDate.addYears(1)
while anniversaryDate <= maturityDate:
  payoutDates.push(anniversaryDate)
  anniversaryDate = anniversaryDate.addYears(1)
```

### 5.3 Interest Calculation per Period

```javascript
if (compounding === 'no') {
  // Simple interest per period
  periodicInterest = (Principal × Annual Rate ÷ 100) ÷ Payouts Per Year
} else {
  // Should rarely happen; if it does, use compound formula
  periodicInterest = Principal × ((1 + Annual Rate ÷ 100 ÷ Payouts Per Year)^(1) - 1)
}
```

### 5.4 Generate interest_payout Cashflows

```javascript
{
  id: `payout-YYYY-MM-DD`,
  date: 'YYYY-MM-DD',
  type: 'interest_payout',
  amount: periodicInterest,
  status: 'completed' | 'planned'
}
```

---

## Financial Year Accrual Model

### 6.1 Indian Financial Year

- **Starts**: April 1 (01-Apr)
- **Ends**: March 31 (31-Mar)
- **Notation**: FY2023-24 = Apr 1, 2023 to Mar 31, 2024

### 6.2 Why Per-FY Accrual?

Indian tax law (Income Tax Act, 1961) requires:
- Interest on cumulative investments is taxed in the FY it **accrues**, not when paid
- Even if the investment matures after 5 years and interest is received in Year 5, the accrued interest from Years 1-4 was already taxable in their respective FYs
- TDS (Tax Deducted at Source) is applied similarly on an accrual basis

### 6.3 Accrual vs Payout Timing

```
Timeline for ₹60,000 NSC @ 6.8% from Mar 17, 2021 to Mar 17, 2026:

Year 1 (Mar 17, 2021 - Mar 31, 2021):
  Accrued Interest: ₹192.10  ← Taxable in FY2020-21
  Paid: ₹0 (no payment until maturity)

Year 2 (Apr 1, 2021 - Mar 31, 2022):
  Accrued Interest: ₹4,674.36  ← Taxable in FY2021-22
  Paid: ₹0

[Similar for Years 3-5]

Maturity (Mar 17, 2026):
  Total Accrued Interest: ₹23,397.41  ← All already taxed in their respective FYs
  Paid at Maturity: ₹23,397.41 (plus principal ₹60,000)
```

### 6.4 Impact on Investor Taxation

- **Benefit**: For year-by-year tracking, TDS and tax can be computed annually
- **Challenge**: Interest recognized for tax even before cash is received (accrual accounting)
- **Compliance**: Ledger must show per-FY accruals, not just final payout

---

## TDS Calculation

### 7.1 Overview

TDS (Tax Deducted at Source) is a mandatory tax withholding:
- Applied to cumulative investment interest when it accrues (per Indian tax rules)
- Applied independently to each FY's accrued amount
- Deducted when interest is paid (but for cumulative FDs, usually TDS is computed on accrual and deducted at maturity)

### 7.2 TDS Eligibility

**TDS applies if**:
```javascript
tdsApplicable = true  // Determined at investment creation
                      // Typically true for cumulative FDs
                      // May be false for NSCs (if exempt or not applicable)
```

**TDS Rate** (India):
- Fixed Deposits: 10% (default for Indian residents on bank FDs)
- Can vary based on PAN status and exemption certificates
- User-configurable in application

### 7.3 TDS Calculation per FY

**For each FY's accrual**:
```javascript
tdsForFY = AccruedInterestForFY × (TDS Rate ÷ 100)

Example (FY2021-22 of NSC):
  Accrued Interest: ₹4,674.36
  TDS Rate: 10%
  TDS Amount: 4,674.36 × 0.10 = ₹467.44
```

**Special case: Zero accrual**:
```javascript
if (AccruedInterestForFY === 0) {
  // Still generate TDS entry with ₹0 for record-keeping
  // Maintains 1:1 correspondence between accruals and TDS
  tdsAmount = ₹0.00
}
```

### 7.4 TDS Cashflow Generation

```javascript
// For each interest_accrual entry, generate corresponding TDS entry

{
  id: `tds-accrual-FY2021-22`,
  date: '2022-03-31',           // Same as accrual date
  type: 'tds_deduction',
  amount: -467.44,              // Negative (deduction)
  fy: 'FY2021-22',
  status: 'completed' | 'planned'
}
```

### 7.5 1:1 Correspondence Invariant

**Rule**: Every interest_accrual must have exactly one corresponding tds_deduction entry.

```javascript
// Verification:
accrualCount = interest_accrual entries
tdsCount = tds_deduction entries

if (accrualCount !== tdsCount) {
  console.error('TDS correspondence broken!')
}
```

### 7.6 Example: Full Year TDS Breakdown

For NSC with TDS enabled:

| FY | Accrual (₹) | TDS @ 10% (₹) | Net Income (₹) |
|----|------------|----------------|-----------------|
| 2020-21 | 192.10 | 19.21 | 172.89 |
| 2021-22 | 4,674.36 | 467.44 | 4,206.92 |
| 2022-23 | 4,674.36 | 467.44 | 4,206.92 |
| 2023-24 | 4,687.16 | 468.72 | 4,218.44 |
| 2024-25 | 4,674.36 | 467.44 | 4,206.92 |
| 2025-26 | 4,495.07 | 449.51 | 4,045.56 |
| **TOTAL** | **₹23,397.41** | **₹2,339.76** | **₹21,057.65** |

---

## Cashflow Generation

### 8.1 Cashflow Types

| Type | Direction | Timing | Example |
|------|-----------|--------|---------|
| `interest_accrual` | +Positive | FY end (cumulative) | ₹4,674.36 on 31-Mar-2022 |
| `interest_payout` | +Positive | Payout date (non-cumulative) | ₹1,000 on 30-Jun-2023 |
| `tds_deduction` | -Negative | Accrual date (cumulative) or payout date | -₹467.44 on 31-Mar-2022 |
| `maturity_payout` | +Positive | Maturity date (if manual entry) | ₹60,000 on 17-Mar-2026 |

### 8.2 Cashflow Structure

```javascript
{
  id: string,                    // Unique identifier
  investmentId: string,          // Reference to Investment
  date: string,                  // YYYY-MM-DD format
  type: string,                  // interest_accrual | interest_payout | tds_deduction | maturity_payout
  amount: number,                // ₹ value (negative for deductions)
  fy: string,                    // FY2023-24 or similar
  status: string,                // 'completed' | 'planned'
  source: string,                // 'system' | 'user_entered'
  isPreview: boolean             // true for unsaved previews
}
```

### 8.3 Cumulative Investment Cashflow Example

**NSC ₹60,000 @ 6.8%, 5 years, TDS enabled**:

```
Date          Type                 Amount      FY           Status
─────────────────────────────────────────────────────────────────
2021-03-31    interest_accrual     192.10     FY2020-21    completed
2021-03-31    tds_deduction        -19.21     FY2020-21    completed
2022-03-31    interest_accrual     4,674.36   FY2021-22    completed
2022-03-31    tds_deduction        -467.44    FY2021-22    completed
2023-03-31    interest_accrual     4,674.36   FY2022-23    completed
2023-03-31    tds_deduction        -467.44    FY2022-23    completed
2024-03-31    interest_accrual     4,687.16   FY2023-24    completed
2024-03-31    tds_deduction        -468.72    FY2023-24    completed
2025-03-31    interest_accrual     4,674.36   FY2024-25    completed
2025-03-31    tds_deduction        -467.44    FY2024-25    completed
2026-03-17    interest_accrual     4,495.07   FY2025-26    planned
2026-03-17    tds_deduction        -449.51    FY2025-26    planned
```

**No `maturity_payout` entry**: Principal is not included in cashflow (investment container handles that separately)

### 8.4 Non-Cumulative Investment Cashflow Example

**Fixed Deposit ₹1,00,000 @ 8%, 1 year, Quarterly Payout, TDS enabled**:

```
Date          Type               Amount    Status
────────────────────────────────────────────────────
2024-06-30    interest_payout    2,000    completed
2024-09-30    interest_payout    2,000    completed
2024-12-31    interest_payout    2,000    completed
2025-03-31    interest_payout    2,000    completed
2025-06-30    maturity_payout    100,000  planned
```

(Note: TDS may apply differently for non-cumulative; this example simplified)

---

## Validation & Invariants

### 9.1 Accrual Invariant

**Rule**: Sum of all interest_accrual amounts must equal (calculated total interest ± 1% relative error)

```javascript
totalAccrual = sum(interest_accrual.amount)
expectedInterest = calculated total interest
relativeError = abs(totalAccrual - expectedInterest) / max(expectedInterest, 0.01)

assert(relativeError < 0.01, "Accrual mismatch >1%")
```

**Why 1%?** Rounding at multiple stages (per-FY, per-period) can accumulate errors up to ~1%.

### 9.2 TDS Correspondence Invariant

**Rule**: For cumulative investments with TDS enabled, every interest_accrual has exactly one tds_deduction with matching date and fy.

```javascript
for each accrual in interest_accruals:
  correspondingTds = tds_deductions.find(tds => tds.id === `tds-${accrual.id}`)
  assert(correspondingTds exists, `Missing TDS for accrual ${accrual.id}`)
  assert(correspondingTds.date === accrual.date, `Date mismatch`)
  assert(correspondingTds.fy === accrual.fy, `FY mismatch`)
```

### 9.3 No Negative Cashflows Invariant

**Rule**: All interest_accrual and interest_payout amounts ≥ 0. TDS amounts ≤ 0.

```javascript
for each cashflow:
  if (cf.type in ['interest_accrual', 'interest_payout']):
    assert(cf.amount >= 0)
  else if (cf.type === 'tds_deduction'):
    assert(cf.amount <= 0)
```

### 9.4 Compounding Consistency Check

**Rule**: For cumulative investments, each FY's interest must be ≥ previous FY (due to compounding).

```javascript
for i in 1 to n-1:
  assert(interest[i+1] >= interest[i], `Compounding broken in FY ${i+1}`)
```

### 9.5 Date Ordering Invariant

**Rule**: All cashflow dates must be within [startDate, maturityDate].

```javascript
for each cashflow:
  assert(startDate <= cashflow.date <= maturityDate)
```

---

## UI Presentation

### 10.1 Sections

The investment preview displays information across multiple sections:

#### **Section 1: User Inputs**
- Displays all investment parameters entered by the user
- Source, Investment Type, Owner, Bank, etc.
- Principal, Rate, Dates, Calculation Mode, etc.

#### **Section 2: Cashflow Timeline**
- Table showing all cashflows chronologically
- Columns: Date, FY, Amount, Type, Status
- Includes both interest_accrual and tds_deduction entries
- TDS rows highlighted in light red (#fef2f2)
- Sorted by date

#### **Section 3: Financial Year Summary**
- Card-based layout, one card per FY
- Shows Interest (Paid), Interest Accrued (Taxable), TDS, Net Income
- Color-coded for emphasis

#### **Section 4: Diagnostics**
- Derived Values: Calculated intermediate values
- Cashflows: Summary counts
- Per-Accrual TDS Entries: Detailed breakdown (only if TDS applicable)
- Validation: Checks for errors/warnings

#### **Section 5: Copy Button**
- Copies full diagnostic text to clipboard
- Includes all user inputs, derived values, and detailed cashflows
- Fallback: execCommand if navigator.clipboard unavailable

### 10.2 Styling

**Color Scheme**:
- Blue (#3b82f6): Action buttons
- Red (#b91c1c): TDS amounts (deductions)
- Green (#16a34a): Net income
- Gray (#6b7280): Secondary text/status

**Typography**:
- Monospace: Diagnostics, cashflow tables
- Sans-serif: Headers, labels

**Responsive**:
- Horizontal scroll for tables on mobile
- Single-column layout on small screens

### 10.3 Key Display Examples

**Interest_accrual Cashflow Row**:
```
Date: 2022-03-31
FY: FY2021-22
Amount: ₹4,674.36
Type: Interest Accrual (FY End)
Status: completed
```

**TDS Cashflow Row** (highlighted):
```
Date: 2022-03-31
FY: FY2021-22
Amount: -₹467.44
Type: TDS Deduction
Status: completed
```

**Per-Accrual TDS Entry** (in diagnostics):
```
FY2021-22 (2022-03-31)
  Interest Accrual: ₹4,674.36
  TDS Deduction: ₹467.44 [✓]
```

---

## Reference Cases

### Reference Case 1: FD with Bank-Style Compounding

| Parameter | Value |
|-----------|-------|
| Principal | ₹457,779 |
| Annual Rate | 7.75% |
| Start Date | 2024-09-19 |
| Maturity Date | 2025-12-07 |
| Duration | 444 days |
| Calculation Mode | Bank-Style (Quarterly + Remainder) |
| Expected Maturity | ₹502,593.00 |
| Expected Interest | ₹44,814.00 |

### Reference Case 2: NSC with Yearly Compounding

| Parameter | Value |
|-----------|-------|
| Principal | ₹60,000 |
| Annual Rate | 6.8% |
| Start Date | 2021-03-17 |
| Maturity Date | 2026-03-17 |
| Duration | 1,826 days (5 years) |
| Calculation Mode | Fractional (Yearly) |
| TDS Rate | 0% (NSCs exempt) |
| Expected Maturity | ₹83,385.00 |
| Expected Interest | ₹23,397.41 |

---

## Implementation Checklist

### For Developers

- [ ] Investment classified correctly (cumulative vs non-cumulative)
- [ ] Interest engine selected (simple, fractional, or bank-style)
- [ ] Total interest calculated and matches reference case
- [ ] FY boundaries identified correctly (Apr 1 - Mar 31)
- [ ] Per-FY accruals calculated using accumulated balance method
- [ ] Accrual amounts increase year-over-year (for compounding)
- [ ] TDS generated with 1:1 correspondence
- [ ] All invariants verified (accrual, TDS, no negatives, ordering)
- [ ] Cashflows sorted chronologically
- [ ] UI displays all cashflows (interest + TDS)
- [ ] Copy-to-clipboard functionality works
- [ ] Tests pass for all calculation modes
- [ ] Edge cases handled (zero duration, single day, year boundary, etc.)

---

## Glossary

| Term | Definition |
|------|-----------|
| **Accrual** | Interest recognized in a period, regardless of cash receipt |
| **Compounding** | Interest earned on previously earned interest |
| **FY** | Financial Year (April 1 - March 31 in India) |
| **TDS** | Tax Deducted at Source; mandatory withholding tax |
| **Cumulative** | Interest paid only at maturity (compounds) |
| **Non-Cumulative** | Interest paid periodically (no compounding) |
| **Bank-Style** | Quarterly compounding with remainder simple interest |
| **Fractional Compounding** | Continuous formula with fractional periods |
| **ACT/365** | Day-count: actual days ÷ 365 |

---

## Support & Questions

For clarifications or edge cases not covered:
1. Review the reference calculation engines in `/src/utils/`
2. Check existing tests in `/test/`
3. Consult Indian tax law (Income Tax Act, 1961) for compliance questions
4. Test with reference cases provided in this document

---

**Document Version**: 1.0  
**Last Updated**: February 3, 2026  
**Application**: WealthBooks Investment Tracker  
**Status**: Production Ready
