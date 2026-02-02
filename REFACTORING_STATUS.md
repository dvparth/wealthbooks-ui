# Create Investment Wizard - Refactoring Status

## ✅ Completed Implementation

### 1. Context Provider (`src/contexts/CreateInvestmentContext.jsx`)
**Status**: ✅ Complete

Manages all wizard state without sessionStorage:
- Step 1 & 2 data storage
- Navigation between steps (1-3)
- Submission state and error handling
- Reset/cleanup functionality

Key exports:
- `CreateInvestmentProvider` - Wrap your app with this
- `useCreateInvestmentWizard()` - Hook to use in components

### 2. HOC (`src/hoc/withCreateInvestmentStep.jsx`)
**Status**: ✅ Complete

Wraps step components to:
- Enforce step flow (can't skip steps)
- Validate required data before rendering
- Show friendly error screen if data missing
- Provide context functions as props

Usage pattern:
```jsx
export default withCreateInvestmentStep(MyStep, stepNumber, { requireStep1, requireStep2 })
```

### 3. Step 1 Refactoring (`src/screens/CreateInvestment.jsx`)
**Status**: ✅ Partially Complete

What's done:
- ✅ Removed sessionStorage.getItem/setItem calls
- ✅ Added useCreateInvestmentWizard() hook
- ✅ Local state synchronized with context
- ✅ Context updateStep1() called on Next
- ✅ HOC export applied
- ⏳ Still needs: onCancel → resetWizard integration, form styling polish

### 4. Documentation
**Status**: ✅ Complete

Created:
- `WIZARD_REFACTORING_GUIDE.md` - Complete architecture and migration guide
- State flow diagrams
- Debugging and testing checklists
- Benefits and backward compatibility notes

## 📋 Remaining Work

### Phase 1: Complete Step Components
**Estimate**: 1-2 hours

#### Step 2 Refactoring (`src/screens/CreateInvestmentStep2.jsx`)
```
TODO:
1. Remove all sessionStorage code (lines 29-35, 55-57, 65-82, 166)
2. Add: import { useCreateInvestmentWizard } from '../contexts/CreateInvestmentContext'
3. Add: const { step1, step2, updateStep2, goToNextStep, goToPreviousStep } = useCreateInvestmentWizard()
4. Initialize local state from step2 context instead of sessionStorage
5. Update handleNext() to call updateStep2() + goToNextStep()
6. Update handleBack() to call goToPreviousStep()
7. Add export: withCreateInvestmentStep(CreateInvestmentStep2, 2, { requireStep1: true })
```

#### Step 3 Refactoring (`src/screens/CreateInvestmentStep3.jsx`)
```
TODO:
1. Remove all sessionStorage code (lines 20-49, 939-940, 948-949)
2. Add: import { useCreateInvestmentWizard } from '../contexts/CreateInvestmentContext'
3. Add: const { step1, step2, startSubmitting, completeSubmission, setError, goToPreviousStep } = useCreateInvestmentWizard()
4. In handleConfirmAndSave():
   - Call startSubmitting() at start
   - Wrap API call in try/catch
   - Call completeSubmission() on success
   - Call setError() on failure
   - Remove sessionStorage.removeItem calls
5. Update handleBack() to call goToPreviousStep()
6. Add export: withCreateInvestmentStep(CreateInvestmentStep3, 3, { requireStep1: true, requireStep2: true })
```

### Phase 2: Update Routing (`src/App.jsx`)
**Estimate**: 1-2 hours

```
TODO:
1. Add: import { CreateInvestmentProvider } from './contexts/CreateInvestmentContext'
2. Add: import { useCreateInvestmentWizard } from './contexts/CreateInvestmentContext'
3. Wrap entire return JSX with <CreateInvestmentProvider>
4. Replace manual step tracking with context.currentStep
5. Sync URL with context state:
   - When currentStep changes, update window.history.pushState
   - When URL changes (popstate), call context.goToStep()
6. Remove: onCancel, onNext, onBack props passing (HOC handles these)
7. Keep only: onDone callback for final navigation
```

### Phase 3: Entry Point Update (`src/main.jsx`)
**Estimate**: 15 minutes

```
TODO:
1. Import: { CreateInvestmentProvider } from './contexts/CreateInvestmentContext'
2. Wrap: <CreateInvestmentProvider><App /></CreateInvestmentProvider>
```

## 🔄 Architecture Flow (After Refactoring)

```
main.jsx
  ↓
CreateInvestmentProvider wraps App
  ↓
App.jsx (useCreateInvestmentWizard hook)
  ↓
  ├─→ CreateInvestmentStep1 (HOC wrapped)
  ├─→ CreateInvestmentStep2 (HOC wrapped)
  └─→ CreateInvestmentStep3 (HOC wrapped)

Data Flow:
Step1 Component
  ↓ updateStep1()
Context.step1
  ↓ Context syncs URL
URL changes → /investments/new/step2
  ↓
App renders Step2
  ↓ updateStep2()
Context.step2
  ↓ Context syncs URL
URL changes → /investments/new/step3
  ↓
App renders Step3 (has access to step1 + step2 from context)
  ↓ startSubmitting(), API call, completeSubmission()
Context state cleared
  ↓
Navigate to investment detail view
```

## ⚙️ Key Implementation Details

### Context State Shape
```javascript
{
  // Data
  step1: {
    source, sourceInvestmentId, reinvestAmount,
    investmentTypeId, externalId, ownerId, bankId, branch,
    startDate, maturityDate
  },
  step2: {
    principal, rate, calcFreq, payoutFreq, compounding,
    calculationMode, tdsApplicable, tdsRate
  },
  
  // Navigation
  currentStep: 1-3,
  
  // Submission
  isSubmitting: boolean,
  submissionError: string | null,
  
  // Actions
  updateStep1, setStep1Data,
  updateStep2, setStep2Data,
  goToNextStep, goToPreviousStep, goToStep,
  startSubmitting, completeSubmission, setError,
  resetWizard
}
```

### HOC Validation Logic
```javascript
// Component rendered only if:
1. User is accessing correct step (currentStep === requiredStep)
2. Required previous steps are complete (step1 exists if requireStep1=true)
3. No data validation errors

// If validation fails:
→ Show error screen with "Start Over" button
→ Don't render the step component
```

### Route Synchronization
```javascript
// On Step Navigation
context.currentStep changes
  ↓
useEffect in App detects change
  ↓
window.history.pushState updates URL
  ↓
Browser URL bar shows new step

// On Browser Back
User clicks back button
  ↓
popstate event fires
  ↓
Parse new URL → extract step number
  ↓
Call context.goToStep(extractedStep)
  ↓
App re-renders with correct step component
```

## 🧪 Testing Checklist After Refactoring

```
Setup
  [ ] No sessionStorage entries created during wizard
  [ ] Context provider wraps app correctly
  [ ] No console errors or warnings

Navigation Flow
  [ ] Step 1 → Step 2 advances correctly
  [ ] Step 2 → Step 3 advances correctly
  [ ] Back button on Step 2 goes to Step 1
  [ ] Back button on Step 3 goes to Step 2
  [ ] Data retained when going back/forward

Data Integrity
  [ ] Step 1 data visible in Step 3 preview
  [ ] Step 2 data visible in Step 3 preview
  [ ] Form fields pre-populated when returning to a step
  [ ] No data loss on page refresh (should show error)

Edge Cases
  [ ] Direct URL access to /investments/new/step3 shows error
  [ ] Cancel button on any step clears wizard
  [ ] After save, context state is empty
  [ ] Browser back/forward works correctly
  [ ] Multiple wizard sessions don't interfere

Submission
  [ ] Form validation works
  [ ] Submission shows loading state
  [ ] API error shows error message
  [ ] Successful save navigates to detail view
  [ ] Can start new wizard after completion
```

## 🚀 Rollout Plan

### Day 1: Create Infrastructure
1. Create Context file
2. Create HOC file
3. Update Step 1
4. ✅ Done

### Day 2: Complete Steps
5. Update Step 2
6. Update Step 3
7. Test submission flow

### Day 3: Routing & Deployment
8. Update App.jsx
9. Update main.jsx
10. Full integration testing
11. Deploy

## 📝 Notes

- **Why Context instead of Redux?** Wizard state is temporary and simple. Context is sufficient and requires less boilerplate.
- **Why HOC instead of Render Props?** Cleaner component syntax. HOC composition pattern is easier to read.
- **Backward Compatibility**: Step components can still be tested with mock onNext/onBack props.
- **Performance**: Context only triggers re-renders for components using the hook. No excessive re-renders.
- **Debugging**: Console logs show all context actions for easy troubleshooting.

## 🔗 Related Files

- `CALCULATION_INSTRUCTIONS.md` - Investment calculation specs (independent)
- `README_CALCULATIONS.md` - Calculation quick reference (independent)
- `src/styles/CreateInvestment.css` - Styling (unchanged)
- `src/mocks/*` - Mock data (unchanged)

---

**Status**: Infrastructure complete. Ready for step refactoring.
**Next Action**: Refactor Step 2 and Step 3 components.
