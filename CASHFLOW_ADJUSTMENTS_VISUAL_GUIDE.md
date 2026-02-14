# Cashflow Adjustments: Visual Reference Guide

## 🎨 UI Components Overview

### 1. Investment Detail Screen - Enhanced Timeline

```
═══════════════════════════════════════════════════════════════════
                    INVESTMENT DETAIL SCREEN
═══════════════════════════════════════════════════════════════════

📊 FY 2024-25 Cashflows
────────────────────────────────────────────────────────────────

Date       | Type              | Amount    | Source | Status    | Actions
─────────────────────────────────────────────────────────────────────────
2024-09-30 | Interest Payout   | ₹30,750  | system | confirmed | [Adjust]
           ↓ Yellow highlight (adjustment entry below)
2024-09-30 | Adjustment        | -₹500    | manual | confirmed | 
           └─ "Bank paid lower interest due to rate change"
           └─ Adjusts: Interest Payout (₹30,750)
─────────────────────────────────────────────────────────────────────────
2024-12-31 | TDS Deduction     | -₹3,075  | system | confirmed | [Adjust]

2025-03-31 | Maturity Payout   | ₹816,663 | system | confirmed | [Adjust]
```

### 2. Adjustment Modal Dialog

```
╔═══════════════════════════════════════════════════════════════╗
║  Adjust Cashflow                                        [✕]  ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Original Entry:  Interest Payout - ₹30,750                 ║
║  Date:            30 Sep 2024                                ║
║                                                               ║
║  ─────────────────────────────────────────────────────────  ║
║                                                               ║
║  Adjustment Amount (₹) *                                     ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ -500                                                │    ║
║  └─────────────────────────────────────────────────────┘    ║
║  ℹ Positive = credit, Negative = debit                      ║
║                                                               ║
║  Reason for Adjustment *                                     ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ Bank credited lower interest due to rate change     │    ║
║  │ on May 15                                           │    ║
║  └─────────────────────────────────────────────────────┘    ║
║  ℹ Mandatory field for audit trail                          ║
║                                                               ║
║  ℹ️  Note: The original system entry will remain unchanged.  ║
║      This creates a linked manual adjustment entry for       ║
║      reconciliation.                                         ║
║                                                               ║
║  ─────────────────────────────────────────────────────────  ║
║                                     [Cancel]  [Create Adj.]  ║
╚═══════════════════════════════════════════════════════════════╝
```

### 3. FY Summary Display

```
╔═════════════════════════════════════════════════════════════╗
║  Financial Year Summary                                     ║
╠═════════════════════════════════════════════════════════════╣
║                                                             ║
║  ┌────────────────────────────────────────────────────┐   ║
║  │ FY 2024-25                                         │   ║
║  │                                                    │   ║
║  │ Interest Earned:    ₹30,750                        │   ║
║  │ TDS Deducted:       ₹3,075                         │   ║
║  │ Adjustments:        -₹500     ← NEW LINE         │   ║
║  │ ════════════════════════════════                  │   ║
║  │ Net Income:         ₹27,175   ← UPDATED          │   ║
║  │                                                    │   ║
║  └────────────────────────────────────────────────────┘   ║
║                                                             ║
└─────────────────────────────────────────────────────────────┘
```

## 🎯 User Workflows

### Workflow 1: Quick Interest Correction

```
User sees interest entry
         ↓
Clicks [Adjust] button
         ↓
Modal opens with original entry info
         ↓
User enters:
  Amount: -500
  Reason: "Bank overcharged fee"
         ↓
Clicks [Create Adjustment]
         ↓
Modal closes
         ↓
New adjustment entry appears in timeline (yellow highlight)
         ↓
FY summary recalculates automatically
         ↓
User sees Net Income updated
```

### Workflow 2: Maturity Override

```
Investment matures
         ↓
Bank statement shows ₹520,000
But system calculated ₹525,000
         ↓
User updates: Investment.actualMaturityAmount = 520000
         ↓
System calls: processMaturityOverride()
         ↓
Delta = 520000 - 525000 = -5000
         ↓
Adjustment entry auto-created with -5000
         ↓
Adjustment linked to maturity cashflow
         ↓
FY summary includes -5000 delta
         ↓
Total interest reflects actual from bank
```

### Workflow 3: Viewing and Auditing

```
User wants to see all corrections
         ↓
Looks at timeline
         ↓
Spots yellow-highlighted adjustment entries
         ↓
Reads adjustment reason on hover
         ↓
Sees linked info: "Adjusts: Interest Payout (₹30,750)"
         ↓
Clicks [Copy diagnostics]
         ↓
Gets detailed report including:
  - All system entries
  - All adjustments with reasons
  - Recalculated totals
         ↓
Shares with accountant for verification
```

## 🎨 Visual Design System

### Color Palette

```
Component          | Color   | Hex     | Usage
───────────────────┼─────────┼─────────┼────────────────────
System Entry BG    | Gray    | #f9fafb | Neutral background
Adjustment Entry   | Yellow  | #fef3c7 | Highlight edits
Adjustment Border  | Orange  | #d97706 | Visual distinction
Adjust Button      | Blue    | #3b82f6 | Call-to-action
Hover State        | Blue    | #2563eb | Interaction feedback
Positive Amount    | Green   | #16a34a | Credit/gain
Negative Amount    | Red     | #b91c1c | Debit/loss
Text - Secondary   | Gray    | #6b7280 | Helper text
Input Focus        | Blue    | #3b82f6 | Focus indicator
Input Error        | Red     | #dc2626 | Validation error
Info Box BG        | Blue    | #dbeafe | Information
Info Box Border    | Blue    | #3b82f6 | Information accent
```

### Typography

```
Element              | Style
────────────────────┼──────────────────────────
Modal Title         | 1.125rem, 600 weight, dark
Form Label          | 0.9rem, 500 weight, dark
Input Field         | 0.9rem, regular, monospace (amount)
Error Message       | 0.8rem, 500 weight, red
Help Text           | 0.8rem, italic, gray
Adjustment Reason   | 0.85rem, italic, orange
Button Text         | 0.9rem, 600 weight, white/dark
```

### Spacing

```
Property           | Value
───────────────────┼──────
Modal Width        | max 500px
Modal Padding      | 20px
Form Gap           | 16px
Form Field Gap     | 6px
Button Padding     | 10px 16px
Timeline Entry     | 1rem padding
Adjustment Indent  | 1.5rem left margin
```

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                 Investment Detail Screen                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ├─→ State: allCashflows [...]
                       │
                       ├─→ Render Cashflow Timeline
                       │   ├─ System entries (neutral)
                       │   └─ Adjustment entries (yellow)
                       │
                       └─→ Calculate FY Summary
                           ├─ interestEarned
                           ├─ tdsDeducted
                           ├─ adjustments ← NEW
                           └─ netIncome = base + adjustments
```

### State Tree

```
InvestmentDetail
├── investment
│   ├── id
│   ├── name
│   ├── principal
│   ├── interestRate
│   ├── actualMaturityAmount (optional)
│   └── expectedMaturityAmount
│
├── allCashflows [ ← Master state for adjustments
│   ├── { id, type, amount, source: 'system', ... }
│   ├── { id, type: 'adjustment', amount, adjustsCashflowId, reason, source: 'manual', ... }
│   └── { ... more cashflows ... }
│
├── adjustmentModal (null or cashflow)
│   └── When set, modal renders with this cashflow
│
└── expandedFYs (Set)
    └── Tracks which FY sections are expanded
```

## 🔄 Component Interaction

```
User Interaction                     Component                    State Change
────────────────────────────────────────────────────────────────────────────
Click [Adjust]                   → InvestmentDetail         setAdjustmentModal(cf)
                                                            ↓
                                                    Modal renders
                                                            ↓
Enter amount & reason            → CashflowAdjustmentModal
                                                            ↓
Click [Create Adjustment]        → Modal.onSubmit()        createCashFlow()
                                                            ↓
                                  ← InvestmentDetail         setAllCashflows([...])
                                                            ↓
                                                    setAdjustmentModal(null)
                                                            ↓
Timeline re-renders              → New entry appears
FY Summary recalculates          → Totals update
```

## 📋 Form Validation States

```
State          | Button State | Error Display | Allow Submit
───────────────┼──────────────┼───────────────┼──────────────
Empty Form     | Disabled     | None          | ✗ No
Amount Only    | Disabled     | None          | ✗ No
Reason Only    | Disabled     | None          | ✗ No
Invalid Amount | Disabled     | Show error    | ✗ No
Valid Form     | Enabled      | None          | ✓ Yes
Form Complete  | Enabled      | (cleared)     | ✓ Yes
After Submit   | Disabled     | None          | (modal closes)
```

## 🎯 Button States

```
State       | Background | Text Color | Cursor | Hover
────────────┼────────────┼────────────┼────────┼──────────────
Default     | #3b82f6    | white      | pointer| #2563eb
Hover       | #2563eb    | white      | pointer| (darker)
Active      | #1d4ed8    | white      | pointer| (filled)
Disabled    | #9ca3af    | white      | not    | (no change)
Focus       | #3b82f6    | white      | pointer| +outline

Modal Buttons:
Primary [Create Adjustment]:
  Default: Blue (#3b82f6)
  Hover: Darker Blue (#2563eb)
  
Secondary [Cancel]:
  Default: Gray (#e5e7eb)
  Hover: Darker Gray (#d1d5db)
```

## 📱 Responsive Design

```
Desktop (> 640px)
├─ Modal: 500px wide
├─ Form: 2-column when space allows
├─ Timeline: Full grid layout
└─ Buttons: Side-by-side

Mobile (< 640px)
├─ Modal: 100% width (96% with padding)
├─ Form: Stack vertically
├─ Timeline: Simplified layout
└─ Buttons: Full width, stacked vertically
    [Cancel  ]
    [Create  ]
```

## 🔍 Diagnostic Output Example

```
=== INVESTMENT DIAGNOSTICS ===

Investment: MyFD Account
ID: inv-fd-001
Owner: John Doe
Bank: ICICI Bank
Principal: ₹100,000
Rate: 6.5%
Start: 01 Nov 2023
Maturity: 31 Oct 2025

FY 2024-25 - 5 cashflows
  2024-09-30 | interest_payout | 2000 | confirmed | system
  2024-09-30 | adjustment | -100 | confirmed | manual | 
              reason: "Bank charged early closure fee"
  2024-12-31 | interest_payout | 2050 | confirmed | system
  2024-12-31 | tds_deduction | -250 | confirmed | system
  2025-02-15 | adjustment | 50 | confirmed | manual | 
              reason: "TDS reversal"

=== SUMMARY ===
Total Cashflows: 5
Total Interest (FY): 4050
Total TDS (FY): 250
Total Adjustments (FY): -50
Net Income (FY): 3750
```

## 🎓 Keyboard Navigation

```
Modal Interaction via Keyboard
─────────────────────────────────

Tab         → Next field
Shift+Tab   → Previous field
Escape      → Close modal (cancel)
Enter       → Submit form (if focused on submit button)

Form Fields:
Amount Input    → Type number (allows +/-)
Reason Text     → Type multi-line text
```

## ♿ Accessibility Features

```
ARIA Attributes:
├─ Modal: role="dialog", aria-modal="true"
├─ Labels: <label htmlFor="fieldId">
├─ Buttons: aria-label="Adjust Interest Payout"
├─ Errors: aria-live="polite", aria-invalid="true"
└─ Close: aria-label="Close modal"

Focus Management:
├─ Modal opens → Focus on first form field
├─ Submit → Focus moves to success indicator (if any)
└─ Close → Focus returns to [Adjust] button

Color Independence:
├─ Not sole differentiator
├─ Icons/text support colors
└─ Error indicators use text + symbols
```

---

This visual guide helps developers and designers understand the UI/UX implementation of the cashflow adjustment feature at a glance.
