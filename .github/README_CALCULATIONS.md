# 📖 WealthBooks Documentation Guide

## Main Files

### 1. **CALCULATION_INSTRUCTIONS.md** ⭐ **START HERE**
The comprehensive technical manual for interest calculations and cashflow generation.

**Contents**:
- ✅ Interest calculation engines (Fractional, Bank-Style, Simple)
- ✅ Cumulative vs Non-Cumulative investment logic
- ✅ Per-FY accrual model with detailed examples
- ✅ TDS (Tax Deducted at Source) calculation
- ✅ Cashflow generation specifications
- ✅ Validation invariants & error checking
- ✅ UI presentation & styling
- ✅ Reference cases with step-by-step walkthroughs
- ✅ Implementation checklist for developers

**Quick Links** (use Ctrl+F in markdown):
- Interest Calculation Engines: See Section 2
- Per-FY Accrual: See Section 6
- TDS Logic: See Section 7
- Reference Cases: See end of document

---

## Key Concepts at a Glance

### Investment Types

| Type | Interest Timing | Compounding | Example |
|------|-----------------|-------------|---------|
| **Cumulative** | At maturity | Yes (typical) | Fixed Deposit (5-year) |
| **Non-Cumulative** | Periodic (monthly/quarterly) | No | Senior Citizen Scheme |

### Interest Calculation Models

1. **Fractional Compounding** (Default)
   - Formula: `Growth = (1 + Rate/100/Freq)^(Years×Freq)`
   - Use: Most FDs and NSCs
   - Example: ₹60,000 @ 6.8% for 5 years = ₹83,385

2. **Bank-Style** (Quarterly + Remainder)
   - Process: Compound through full quarters, then simple interest for remainder days
   - Use: When matching exact bank calculations
   - Example: ₹457,779 @ 7.75% for 444 days = ₹502,593

3. **Simple Interest**
   - Formula: `Interest = Principal × Rate × Years / 100`
   - Use: Savings accounts, some bonds
   - Example: ₹100,000 @ 5% for 1 year = ₹105,000

### Financial Year (FY) Concept

- **Duration**: April 1 - March 31 (India)
- **Why Matters**: Interest taxed in the FY it accrues, not when received
- **Example**: NSC started Mar 17, 2021 crosses 6 FYs; each FY's accrual is taxed separately

### Per-FY Accrual Example

```
NSC ₹60,000 @ 6.8% yearly compounding:

FY2020-21: Accrued ₹192.10   (Principal: ₹60,000)
FY2021-22: Accrued ₹4,674.36 (Growing to ₹64,866.46)
FY2022-23: Accrued ₹4,674.36 (Growing to ₹69,540.82)
FY2023-24: Accrued ₹4,687.16 (Growing to ₹74,227.98)
FY2024-25: Accrued ₹4,674.36 (Growing to ₹78,902.34)
FY2025-26: Accrued ₹4,495.07 (Final maturity ₹83,385.00)
─────────────────────────────────────────────────────
TOTAL:    ₹23,397.41 interest over 5 years
```

**Key Insight**: Each year's interest is calculated on the compounded balance, not original principal!

### TDS (Tax Deducted at Source)

- **When**: On accrual date (not payout date)
- **Rate**: Typically 10% for bank FDs
- **Formula**: `TDS = Accrued Interest × TDS Rate / 100`
- **Correspondence**: 1 accrual = 1 TDS entry (even if ₹0)

---

## Cashflow Timeline Explained

### What You See

```
Date        | Type                | Amount      | FY          | Status
────────────────────────────────────────────────────────────────────
2021-03-31  | Interest Accrual    | +₹192.10   | FY2020-21   | completed
2021-03-31  | TDS Deduction       | -₹19.21    | FY2020-21   | completed
2022-03-31  | Interest Accrual    | +₹4,674.36 | FY2021-22   | completed
2022-03-31  | TDS Deduction       | -₹467.44   | FY2021-22   | completed
[...]
```

### Why Both Interest & TDS?

For **Indian tax compliance**:
1. Interest accrues and becomes taxable in that FY (even if not received)
2. TDS is deducted from the accrued amount (withholding tax)
3. Both entries appear together on the accrual date

---

## Code Architecture

### Main Files

| File | Purpose |
|------|---------|
| `src/screens/CreateInvestmentStep3.jsx` | Investment preview & cashflow generation |
| `src/utils/calculateFdMaturity.js` | Fractional compounding engine |
| `src/utils/interestEngineV2.js` | Bank-style compounding engine |
| `src/models/Investment.js` | Investment data model |
| `src/models/CashFlow.js` | Cashflow data model |

### Calculation Flow

```
Investment Input
    ↓
[Is Cumulative?]
    ├─ YES → Calculate total interest (using appropriate engine)
    │          ↓
    │        For each FY:
    │          ├─ Calculate accumulated balance at FY end
    │          ├─ Accrual = Balance - Previous Balance
    │          ├─ Generate interest_accrual cashflow
    │          ├─ Calculate TDS on accrual
    │          ├─ Generate tds_deduction cashflow
    │
    └─ NO → For each payout date:
             ├─ Calculate periodic interest
             ├─ Generate interest_payout cashflow
             ├─ If TDS applicable: Generate tds_deduction

Validate All Cashflows
    ↓
Display in UI (Timeline, FY Summary, Diagnostics)
```

---

## Common Questions Answered

### Q: Why are my per-FY interests increasing if they should be equal?
**A**: With compounding, each year's interest is calculated on a larger balance. This is correct! Each FY's interest = (Balance at FY end) - (Balance at previous FY end).

### Q: Why does the cashflow show both Interest Accrual AND TDS Deduction on the same date?
**A**: For cumulative investments taxed on accrual basis, both occur simultaneously. Accrual is recognized (for taxation), and TDS is withheld.

### Q: What's the difference between "Fractional" and "Bank-Style" calculation?
**A**: 
- **Fractional**: Uses continuous compounding formula, cleaner math
- **Bank-Style**: Mimics real bank process (quarters + remainder), may differ by ₹1-2

Choose the mode that matches your actual bank's calculation.

### Q: Why do I see ₹0.00 TDS for some accruals?
**A**: When TDS is disabled (rate = 0%), all TDS entries show ₹0.00. This maintains 1:1 correspondence with accruals for audit purposes. If TDS is completely disabled, the "Per-Accrual TDS Entries" section hides entirely.

---

## Testing Reference Cases

To verify calculations:

### Test Case 1: FD Bank-Style
```
Principal: ₹457,779
Rate: 7.75%
Start: 2024-09-19
Maturity: 2025-12-07
Mode: Bank-Style
Expected Interest: ₹44,813.73
Expected Maturity: ₹502,592.73
```

### Test Case 2: NSC Fractional Yearly
```
Principal: ₹60,000
Rate: 6.8%
Start: 2021-03-17
Maturity: 2026-03-17
Mode: Fractional (Yearly)
TDS: 0% (exempt)
Expected Interest: ₹23,397.41
Expected Maturity: ₹83,385.00
```

---

## Validation Checklist

Before deploying:

- [ ] All cashflows have correct sign (positive for interest, negative for TDS)
- [ ] FY accruals total ≈ calculated interest (within 1% tolerance)
- [ ] TDS count = Accrual count (1:1 correspondence)
- [ ] All dates within investment period [start, maturity]
- [ ] Per-FY interests show compounding (increasing YoY)
- [ ] Copy-to-clipboard works
- [ ] Tests pass (27/27)
- [ ] Reference cases match expected values

---

## Support

**For detailed explanations**: See CALCULATION_INSTRUCTIONS.md  
**For formulas**: See "Interest Calculation Engines" section  
**For examples**: See "Reference Cases" section  
**For troubleshooting**: See "Common Questions" above  

---

**Quick Start**: Open CALCULATION_INSTRUCTIONS.md and search for your topic using Ctrl+F!
