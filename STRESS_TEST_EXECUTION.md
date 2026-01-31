# Stress Test Execution Plan

## Data Volume & Diversity

**Total Coverage**:
- 9 investments total (3 original + 6 new stress tests)
- 85+ cashflows total (45 original + 40+ new stress tests)
- Financial years: FY 2023-24 through FY 2025-26
- All key investment types represented

---

## What This Stress Test Will Reveal

### 1. Engine Robustness with Edge Cases

✅ **Scenario**: FD_ST001 (444-day FD)
- **Tests**: Non-standard tenure crossing FY boundaries
- **Will reveal**: 
  - Pro-rata calculation accuracy for odd-length periods
  - Proper grouping of partial quarters
  - Maturity preview suppression for past dates

✅ **Scenario**: FD_ST003 (Yearly payout)
- **Tests**: Annual interest structure without maturity accrual
- **Will reveal**:
  - Yearly payout logic correctness
  - Annual interest preview generation for future years
  - No false accrued rows in yearly payout type

✅ **Scenario**: NSC_ST004 (5-year NSC with multiple accruals)
- **Tests**: Very long investment span (5 FYs), maturity payout
- **Will reveal**:
  - Accrual boundary logic (FY end dates)
  - Independent per-FY accrual calculations
  - Future FY accrual suppression (should NOT generate for future)
  - Maturity interest generation only at maturity date

---

### 2. Tax & Deduction Logic

✅ **Scenario**: SCSS_ST002 (TDS applied)
- **Tests**: 20% tax deductions alongside interest
- **Will reveal**:
  - TDS entries don't interfere with interest preview
  - Multiple TDS entries in single FY
  - TDS not duplicated in preview
  - Proper interest+TDS grouping in timeline

---

### 3. Reinvestment & Adjustments

✅ **Scenario**: FD_ST006 (50% reinvestment + manual adjustment)
- **Tests**: Partial reinvestment of interest + correction entries
- **Will reveal**:
  - Reinvestment amounts ≠ interest amounts (no false equality)
  - Manual source entries properly recognized
  - Adjustment entries don't generate previews
  - Reinvestment links to target investment preserved

---

### 4. Duplicate Prevention Edge Cases

✅ **Scenario**: BOND_ST005 (Delayed + catch-up payments)
- **Tests**: Interest paid late, catch-up with manual source
- **Will reveal**:
  - hasConfirmedCashflow() catches both system and manual entries
  - Late/catch-up payments not duplicated as preview
  - Mixed source types (system vs manual) handled correctly

✅ **Scenario**: SCSS_ST002 (Missing payout, then quarterly resume)
- **Tests**: Gap in payment history, then resumption
- **Will reveal**:
  - Confirmed entries (even with gaps) prevent preview
  - Future quarters generate preview correctly
  - No false duplicates for partial periods

---

### 5. Date Boundary & Accrual Logic

✅ **Scenario**: FD_ST001 (Crosses FY boundary mid-tenure)
- **Tests**: Investment with confirmed interest in both FY 2024-25 and FY 2025-26
- **Will reveal**:
  - FY grouping correct across investment tenure
  - Accrued boundaries respect FY ends (Mar 31)
  - Cross-FY investments display cleanly

✅ **Scenario**: FD_ST003 (Starts mid-year)
- **Tests**: Investment starting 2023-01-07 (not on FY boundary)
- **Will reveal**:
  - First year accrual/payout calculations correct
  - Partial first FY handled properly
  - Annual payouts on non-FY boundaries work

---

### 6. Timeline Readability Under Load

✅ **Scenario**: NSC_ST004 (5-year investment = 5 FY sections)
- **Tests**: Many FY sections with collapsible headers
- **Will reveal**:
  - Current FY expands by default
  - Past FYs collapse for readability
  - Toggle buttons work correctly
  - No UI slowness with many sections

✅ **Scenario**: FD_ST006 (Quarterly payouts, many rows per FY)
- **Tests**: FY section with 5+ cashflows
- **Will reveal**:
  - Scrolling performance with many rows
  - Visual distinction maintained (preview weak, confirmed strong)
  - Colors and styling render correctly

---

## Key Metrics to Validate

### ✅ Correctness Checks

| Check | Expected | Test Investment |
|---|---|---|
| No duplicate interest | Preview suppressed for confirmed | All 6 tests |
| Accrued never future | No accrued for FY end > today | NSC_ST004, FD_ST001 |
| Pro-rata accuracy | Interest = principal × rate × days/365 | FD_ST001, FD_ST003 |
| TDS preserved | TDS not duplicated in preview | SCSS_ST002 |
| Reinvestment linked | Reinvestment points to target | FD_ST006 |
| Manual respected | Manual entries not previewed | BOND_ST005, FD_ST006 |
| FY grouping | Correct FY for all entries | All investments |
| Future-only preview | Preview only >= today | All investments |

### ✅ Performance Checks

| Metric | Expected | Test Investment |
|---|---|---|
| App load time | < 2 seconds | 9 investments, 85+ cashflows |
| Detail page load | < 500ms | Any stress investment |
| FY toggle | < 100ms | NSC_ST004 (5 sections) |
| No console errors | 0 errors | All rendering |

### ✅ Visual Checks

| Check | Expected | Test Investment |
|---|---|---|
| Preview rows weakened | Dashed border, italic, 0.65 opacity | All with future interest |
| Confirmed rows strong | Solid border, normal text, 1.0 opacity | All confirmed entries |
| Accrued muted | Gray border, muted appearance | NSC_ST004 |
| Type colors | Blue, Green, Red, Amber, Gray | All investments |
| FY headers clickable | Toggle shows ▶/▼ | NSC_ST004 |
| Readability | No text overlap, clean layout | FD_ST006 (many rows) |

---

## Stress Test Execution Steps

### Step 1: Load App
```
Navigate to http://localhost:5174
Verify: No console errors, page loads
```

### Step 2: Test Each Investment
**For FD_ST001 (444-day FD)**:
1. Click on FD_ST001 in list
2. Verify detail loads
3. Check FY sections: FY 2024-25 and FY 2025-26
4. Verify no preview interest rows (all confirmed)
5. Verify accrual logic (partial quarters)
6. Click back, return to list

**For SCSS_ST002 (SCSS with TDS)**:
1. Click on SCSS_ST002
2. Verify 4 confirmed interest + 3 TDS entries visible
3. Verify TDS entries don't have "Expected" label
4. Scroll to future sections, verify preview interest appears
5. Verify no preview TDS

**For FD_ST003 (Yearly payout)**:
1. Click on FD_ST003
2. Verify 3 FY sections (2023-24, 2024-25, 2025-26)
3. Verify each FY has exactly 1 interest entry
4. Verify no accrued rows (yearly payout, not maturity)

**For NSC_ST004 (5-year NSC)**:
1. Click on NSC_ST004
2. Verify 5 FY sections visible but most collapsed
3. Verify current FY (2025-26) expanded
4. Verify past FYs (2023-24, 2024-25) collapsed
5. Click past FY headers, verify expand/collapse works
6. Verify accrued rows only in past FYs
7. Verify maturity interest preview for future date

**For BOND_ST005 (Delayed interest)**:
1. Click on BOND_ST005
2. Verify 2024 has both on-time and catch-up interest
3. Verify both have correct amounts (₹11,600 each)
4. Verify source mixes (system vs manual)
5. Verify no duplicate previews

**For FD_ST006 (Partial reinvestment)**:
1. Click on FD_ST006
2. Verify quarterly interest + reinvestment pairs
3. Verify reinvestment amounts = ~50% of interest
4. Verify adjustment entry visible
5. Verify reinvestment links shown
6. Verify no preview rows (all confirmed through Feb 2025)

### Step 3: Validation
- ✅ No console errors
- ✅ All 9 investments listed
- ✅ All detail pages load
- ✅ No duplicate interest/preview conflicts
- ✅ Accrual logic correct
- ✅ Visual distinction clear

---

## Potential Issues to Watch For

### ❌ Could Break
1. **Duplicate interest**: If hasConfirmedCashflow() fails for 1+ entries
2. **False accrual**: If accrued generated for future FYs
3. **Date parsing**: If cashflow dates don't parse correctly
4. **Pro-rata math**: If days calculation incorrect for odd periods
5. **FY grouping**: If cross-FY investments fail to group correctly
6. **Tax logic**: If TDS deductions disappear or double
7. **Reinvestment**: If reinvestment links missing or broken
8. **Performance**: If app slows with 9 investments + 85 cashflows

### ✅ Should Not Break
- App startup (mock data, no backend)
- UI components (no changes)
- Styling (no changes)
- Navigation (no changes)
- InvestmentsList filtering (uses investment objects, not cashflows)

---

## Success Criteria

✅ **All 9 investments load** without errors
✅ **All 85+ cashflows display** correctly grouped by FY
✅ **Accrual logic** accurate (earned only, never future)
✅ **Duplicate prevention** works (confirmed entries not previewed)
✅ **Pro-rata calculations** match manual math
✅ **Collapsible FY sections** functional (current FY expanded)
✅ **Visual distinction** clear (preview weak, confirmed strong)
✅ **No console errors** or warnings
✅ **Performance** acceptable (< 500ms detail load)

---

## Expected Outcome

The stress-test data is designed to **thoroughly exercise** the interest engine under realistic, complex conditions. If the system handles all 6 stress-test investments correctly, it can be trusted with:
- Real-world messy data
- Tax scenarios
- Delayed payments
- Edge-case durations
- Multi-year investments
- Complex reinvestment structures

🚀 **Ready to stress-test!**
