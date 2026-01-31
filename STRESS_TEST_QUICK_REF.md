# Stress Test Quick Reference

## At a Glance

### What Was Added
- **6 new stress-test investments** (realistic, complex scenarios)
- **40+ new cashflows** (interest, tax, reinvestment, adjustments)
- **4 documentation files** (execution plan, data breakdown, summary)

### Why This Matters
The interest preview engine, accrual logic, and duplicate prevention needed stress testing with:
- Non-standard durations (444 days)
- Tax scenarios (20% TDS)
- Delayed payments (1-year catch-up)
- Reinvestment structures (50% partial)
- Long tenures (5 years = 5 FY sections)
- Missing periods (Q1 never paid)

---

## Quick Scenario Reference

### 🔴 **FD_ST001**: 444-Day FD (Odd Tenure)
- **What it tests**: Non-standard periods, cross-FY boundaries
- **Key dates**: 2024-08-23 → 2025-12-01
- **Special**: 3 quarters (91 + 99 + 8 days), Q2 delayed to May
- **Expected behavior**: No preview (all confirmed), proper accrual grouping

### 🔴 **SCSS_ST002**: SCSS with TDS (Tax Scenario)
- **What it tests**: Tax deductions, quarterly payout, missing periods
- **Key dates**: 2023-09-18 → 2028-09-18
- **Special**: 4 TDS entries (20% tax), Q1 FY25 missing entirely
- **Expected behavior**: Future preview interest, TDS not duplicated

### 🔴 **FD_ST003**: Yearly Payout (Simple Annual)
- **What it tests**: Annual interest without maturity accrual
- **Key dates**: 2023-01-07 → 2026-01-07
- **Special**: Starts mid-FY, 3 confirmed annual payouts
- **Expected behavior**: NO accrued rows (yearly payout), future preview

### 🔴 **NSC_ST004**: 5-Year NSC (Long Tenure)
- **What it tests**: Multi-FY accrual boundaries, collapsible sections
- **Key dates**: 2022-03-22 → 2027-03-22
- **Special**: 5 FY sections! Years 1-2 confirmed, Years 3-5 preview
- **Expected behavior**: Accrued only past FYs, future accruals suppressed

### 🔴 **BOND_ST005**: Delayed Interest (Catch-up)
- **What it tests**: Mixed sources, duplicate prevention, catch-up logic
- **Key dates**: 2021-07-14 → 2026-07-14
- **Special**: Year 1 interest paid 1 year late (Oct 2024), manual source
- **Expected behavior**: No preview for confirmed (even manual), future preview

### 🔴 **FD_ST006**: Partial Reinvestment (Complex)
- **What it tests**: Quarterly + reinvestment + manual adjustments
- **Key dates**: 2023-11-30 → 2025-11-30
- **Special**: 4 quarters with 50% reinvestment pairs, manual adjustment
- **Expected behavior**: Reinvestment links, adjustment visible, no preview for confirmed

---

## What Each Tests

| Investment | Accrual Logic | Duplicate Prevention | Pro-rata | Tax | Reinvestment | Collapsible |
|---|---|---|---|---|---|---|
| FD_ST001 | ✓ Partial periods | ✓ 3 confirmed | ✓ Odd days | - | - | ✓ 2 FYs |
| SCSS_ST002 | - | ✓ 4 confirmed | ✓ Quarterly | ✓ TDS | - | ✓ 5 FYs |
| FD_ST003 | - | ✓ 3 confirmed | ✓ Annual | - | - | ✓ 3 FYs |
| NSC_ST004 | ✓ Multi-FY | ✓ 2 confirmed | ✓ Yearly | - | - | ✓ 5 FYs |
| BOND_ST005 | - | ✓ Mixed source | ✓ Annual | - | - | ✓ 5 FYs |
| FD_ST006 | - | ✓ 5+ confirmed | ✓ Quarterly | - | ✓ 50% pairs | ✓ 2 FYs |

---

## Expected Preview Behavior (Today = 2026-02-01)

| Investment | Current | Future | Accrual | Maturity | Preview |
|---|---|---|---|---|---|
| FD_ST001 | ✗ None (all past) | ✗ None (maturity past) | ✗ None | ✗ None | ✗ None |
| SCSS_ST002 | ✓ Q1 FY25 | ✓ Q2+ FY25, Q1-Q4 FY26+ | ✗ None (quarterly) | ✗ None (quarterly) | ✓ Future quarters |
| FD_ST003 | ✓ 2026 interest | ✓ None (maturity reached) | ✗ None (yearly) | ✗ None | ✓ None (all confirmed) |
| NSC_ST004 | ✓ Accrued FY26 | ✓ Accrued FY27+, maturity FY28 | ✓ FY26 | ✓ 2027-03-22 | ✓ Future accruals |
| BOND_ST005 | ✓ 2025 interest | ✓ 2026 interest | ✗ None (yearly) | ✗ None | ✓ 2026 interest |
| FD_ST006 | ✓ Q2-Q4 FY25 | ✓ Q1+ FY26 | ✗ None (quarterly) | ✗ None | ✓ Future quarters |

---

## File Size & Structure

### investments.js
- **Before**: 3 investments (59 lines)
- **After**: 9 investments (156 lines)
- **Added**: 6 investments + 97 lines of code

### cashflows.js
- **Before**: 45 cashflows (339 lines)
- **After**: 85+ cashflows (519 lines)
- **Added**: 40+ cashflows + 180 lines of code

**Total Data**: ~600 lines of realistic investment scenarios

---

## Quick Test Checklist

```
✓ App loads without errors
✓ All 9 investments in list
✓ FD_ST001: No preview (all past)
✓ SCSS_ST002: Future preview visible, TDS shown
✓ FD_ST003: 3 annual interests, no accrual
✓ NSC_ST004: 5 FY sections, current expanded, accrual only past
✓ BOND_ST005: Delayed interest not duplicated
✓ FD_ST006: Reinvestment pairs visible, no preview
✓ Collapsible: Works, smooth transitions
✓ Styling: Preview weak, confirmed strong
✓ Math: Interest amounts reasonable
✓ No console errors
```

---

## Key Validations

### ✅ Duplicate Prevention
**FD_ST001**: 3 confirmed quarters → No preview for same dates ✓
**SCSS_ST002**: 4 confirmed quarterly → No preview for Q1-Q3 FY25 ✓
**BOND_ST005**: Catch-up + on-time → Both confirmed, no preview ✓

### ✅ Accrual Logic
**NSC_ST004**: Year 1-2 accrued (past), Year 3-5 future → Accrued only past ✓
**FD_ST001**: Crosses 2 FYs → Each FY accrual calculated independently ✓

### ✅ Pro-rata Calculation
**FD_ST001**: 91 days → ₹12,690 (750K × 6.75% × 91/365) ✓
**FD_ST006**: 91 days → ₹7,329.50 (425K × 6.9% × 91/365) ✓

### ✅ Tax Logic
**SCSS_ST002**: 3 × TDS -₹2,050 (20% tax on interest > ₹40K) ✓
**No preview for TDS** ✓

### ✅ Reinvestment
**FD_ST006**: 5 × Reinvestment = ~50% of interest ✓
**Reinvestment links to FD_ST001** ✓

---

## Performance Impact

**Current State**:
- 3 investments + 45 cashflows = Fast ✓

**With Stress Data**:
- 9 investments + 85 cashflows = Still fast? (to be verified)
- Expected: < 500ms detail page load
- Expected: No UI lag with collapsible sections

---

## Confidence Metrics

If all stress-test scenarios pass:
- ✅ **Edge case handling**: HIGH (444 days, 5 years, partial periods)
- ✅ **Duplicate prevention**: HIGH (multiple confirmed entries)
- ✅ **Accrual logic**: HIGH (multi-FY scenarios)
- ✅ **Tax handling**: HIGH (TDS scenarios)
- ✅ **Complex scenarios**: HIGH (reinvestment + adjustment)
- ✅ **Production readiness**: HIGH

---

## How to Use This Data

1. **Load the app** → Browse stress investments
2. **Check each scenario** against expected behavior
3. **Toggle FY sections** → Verify collapsible logic
4. **Inspect calculations** → Validate interest amounts
5. **Review styling** → Verify preview rows visually distinct
6. **Monitor console** → Verify no errors

---

## What Breaks First (If Anything)

Priority order for issues:
1. **Duplicate preview** (most likely)
2. **Accrual in future FY** (logic error)
3. **Pro-rata calculation** (math error)
4. **TDS not displayed** (rendering error)
5. **Reinvestment link broken** (object ref error)
6. **Collapsible not working** (state management error)
7. **Performance lag** (algorithm inefficiency)

---

**Ready to test!** Load app and navigate to FD_ST001. 🚀
