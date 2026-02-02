# Create Investment Wizard Refactoring Guide

## Overview

This document describes the refactored Create Investment Wizard architecture that replaces sessionStorage with a robust, Context + HOC-based state management system.

## Architecture

### 1. Context-Based State Management

**File**: `src/contexts/CreateInvestmentContext.jsx`

Creates a React Context that manages all wizard state:

```
CreateInvestmentContext
├── State
│   ├── step1: { source, sourceInvestmentId, investmentTypeId, ownerId, bankId, branch, startDate, maturityDate, ... }
│   ├── step2: { principal, rate, calcFreq, payoutFreq, compounding, calculationMode, tdsApplicable, tdsRate, ... }
│   ├── currentStep: 1 | 2 | 3
│   ├── isSubmitting: boolean
│   └── submissionError: string | null
│
├── Actions - Step 1
│   ├── updateStep1(newStep1): Merge update with existing step1
│   └── setStep1Data(data): Replace entire step1
│
├── Actions - Step 2
│   ├── updateStep2(newStep2): Merge update with existing step2
│   └── setStep2Data(data): Replace entire step2
│
├── Actions - Navigation
│   ├── goToNextStep(): Move to currentStep + 1
│   ├── goToPreviousStep(): Move to currentStep - 1
│   └── goToStep(step): Jump to specific step (1-3)
│
├── Actions - Submission
│   ├── startSubmitting(): Mark submission in progress
│   ├── completeSubmission(): Clear state after successful submission
│   └── setError(error): Handle submission errors
│
└── Actions - Reset
    └── resetWizard(): Clear all state (on cancel)
```

**Usage**:
```jsx
import { CreateInvestmentProvider } from './contexts/CreateInvestmentContext'

<CreateInvestmentProvider>
  <App />
</CreateInvestmentProvider>
```

### 2. HOC (Higher Order Component)

**File**: `src/hoc/withCreateInvestmentStep.jsx`

Wraps step components to:
- Enforce step flow (prevent skipping)
- Validate required data before rendering
- Provide context as props for backwards compatibility
- Handle navigation

**Usage**:
```jsx
// In step component file
function CreateInvestmentStep2({ ... }) {
  // Component code
}

export default withCreateInvestmentStep(CreateInvestmentStep2, 2, {
  requireStep1: true,
  requireStep2: false
})
```

**What it does**:
1. Checks if user is on the correct step
2. Validates required data (step1, step2, etc.)
3. Shows error screen with "Start Over" if data missing
4. Passes context functions as props for navigation
5. Prevents access to steps without completing prerequisites

### 3. Route-Driven State Management

**File**: `src/App.jsx`

The App component now:
1. **Wraps steps with provider**:
   ```jsx
   <CreateInvestmentProvider>
     {/* Render step components based on currentScreen */}
   </CreateInvestmentProvider>
   ```

2. **Syncs routes with context**:
   ```jsx
   // When context says we're on step 2, route to /investments/new/step2
   if (context.currentStep === 2) {
     window.history.pushState({}, '', '/investments/new/step2')
   }
   ```

3. **Handles browser back button**:
   ```jsx
   window.addEventListener('popstate', (e) => {
     // Update context based on new URL
     if (newPath === '/investments/new') {
       context.goToStep(1)
     }
   })
   ```

## Migration Steps

### Step 1: Create Context Provider
```
✓ Created: src/contexts/CreateInvestmentContext.jsx
```

### Step 2: Create HOC
```
✓ Created: src/hoc/withCreateInvestmentStep.jsx
```

### Step 3: Refactor Step Components

**CreateInvestment.jsx (Step 1)**:
- Remove: All sessionStorage code
- Add: `useCreateInvestmentWizard()` hook
- Add: Local state synchronized with context
- Add: HOC export

**CreateInvestmentStep2.jsx (Step 2)**:
- Remove: All sessionStorage code
- Add: `useCreateInvestmentWizard()` hook
- Add: Local state synchronized with context
- Add: HOC export

**CreateInvestmentStep3.jsx (Step 3)**:
- Remove: All sessionStorage code
- Add: `useCreateInvestmentWizard()` hook
- Add: Local state synchronized with context
- Add: HOC export

### Step 4: Update App.jsx

Replace manual screen state with context-aware routing:
```jsx
// Before
const [currentScreen, setCurrentScreen] = useState('list')
const handleGotoStep2 = () => setCurrentScreen('create-step2')

// After
const context = useCreateInvestmentWizard()
const currentStep = context.currentStep
// Component renders based on currentStep automatically
```

### Step 5: Update Main Entry (main.jsx or index.jsx)

Wrap App with provider:
```jsx
import { CreateInvestmentProvider } from './contexts/CreateInvestmentContext'

ReactDOM.render(
  <CreateInvestmentProvider>
    <App />
  </CreateInvestmentProvider>,
  document.getElementById('root')
)
```

## State Flow Diagram

```
User navigates to /investments/new
          ↓
    CreateInvestment (Step 1) renders
          ↓
    User fills form + clicks "Next"
          ↓
    handleNext() → updateStep1() → goToNextStep()
          ↓
    currentStep changes from 1 → 2
          ↓
    App detects change → updates URL to /investments/new/step2
          ↓
    CreateInvestmentStep2 renders with step1 from context
          ↓
    User fills form + clicks "Next"
          ↓
    handleNext() → updateStep2() → goToNextStep()
          ↓
    currentStep changes from 2 → 3
          ↓
    App detects change → updates URL to /investments/new/step3
          ↓
    CreateInvestmentStep3 renders with step1 + step2 from context
          ↓
    User reviews + clicks "Save"
          ↓
    onDone() → completeSubmission() → resetWizard()
          ↓
    State cleared, navigate to investment detail
```

## Data Persistence

### In-Memory (During Wizard)
- Context state persists across route changes
- State only exists while user is in wizard flow
- No localStorage/sessionStorage needed

### After Submission
- Data is sent to database
- Context state is cleared
- User can start fresh wizard anytime

### On Cancel
- resetWizard() clears all state
- User returns to investments list

## Browser Back Button

```
Scenario: User on Step 2, clicks browser back button
          ↓
popstate event fires
          ↓
Parse URL → /investments/new (Step 1)
          ↓
Call context.goToStep(1)
          ↓
currentStep changes from 2 → 1
          ↓
App updates render
          ↓
Step 1 displays with previously entered data (from context)
```

## Error Handling

### Missing Required Data

If user tries to access Step 3 without completing Step 2:

```jsx
HOC checks: requireStep2 = true, but step2 = null
          ↓
HOC renders error screen
          ↓
Show: "Step 2 data is missing. Please go back and complete the previous steps."
          ↓
"Start Over" button → context.goToStep(1)
```

### Submission Errors

```jsx
try {
  startSubmitting()
  const result = await api.saveInvestment(step1, step2)
  completeSubmission()
} catch (error) {
  setError(error.message)
  // Error displayed in UI, form remains filled for retry
}
```

## API Integration Points

### In Step 3 (handleConfirmAndSave)

**Before**:
```jsx
// Read from sessionStorage
const step1 = JSON.parse(sessionStorage.getItem('wb:createInvestment:step1'))
const step2 = JSON.parse(sessionStorage.getItem('wb:createInvestment:step2'))

// Call API
await api.createInvestment(step1, step2)

// Clear sessionStorage
sessionStorage.removeItem('wb:createInvestment:step1')
sessionStorage.removeItem('wb:createInvestment:step2')
```

**After**:
```jsx
const { step1, step2, startSubmitting, completeSubmission, setError } = useCreateInvestmentWizard()

try {
  startSubmitting()
  const result = await api.createInvestment(step1, step2)
  completeSubmission()  // Clears context state
  navigate to investment detail
} catch (error) {
  setError(error.message)
}
```

## Benefits

1. **No sessionStorage**: State lives in memory (React Context)
2. **Type-Safe Routes**: Each URL maps to specific step with required data
3. **Browser Navigation**: Back/Forward buttons work correctly
4. **Data Validation**: HOC ensures prerequisites met
5. **Single Source of Truth**: Context is the only state manager
6. **Easy Testing**: No DOM/localStorage interactions needed
7. **Better DX**: Context hooks are cleaner than sessionStorage JSON parsing
8. **Scalability**: Easy to add new steps or validation rules

## Debugging

Enable debug logging:
```jsx
// All context actions log to console
[CreateInvestmentContext] Step 1 updated: { ... }
[CreateInvestmentContext] Navigated to step: 2
[withCreateInvestmentStep] User attempted to access step 2 but is on step 1
```

## Backward Compatibility

Step components still receive `onNext` and `onBack` as props for easy testing without context:

```jsx
// Old way (still works)
<CreateInvestmentStep2 onNext={handleNext} onBack={handleBack} />

// New way (with context)
<CreateInvestmentStep2 /> // Uses context automatically
```

## Files to Create/Modify

### Create
- [ ] `src/contexts/CreateInvestmentContext.jsx`
- [ ] `src/hoc/withCreateInvestmentStep.jsx`

### Modify
- [ ] `src/screens/CreateInvestment.jsx` (Step 1)
- [ ] `src/screens/CreateInvestmentStep2.jsx` (Step 2)
- [ ] `src/screens/CreateInvestmentStep3.jsx` (Step 3)
- [ ] `src/App.jsx`
- [ ] `src/main.jsx` or entry point

### Delete (no longer needed)
- N/A (No files deleted, just code removed)

## Testing Checklist

- [ ] Navigate forward through steps (Step 1 → 2 → 3 → Save)
- [ ] Click Back button on each step (should retain data)
- [ ] Use browser back/forward buttons (should work correctly)
- [ ] Cancel on any step (should clear all state)
- [ ] Refresh page on Step 2 (context lost, should show data-missing error)
- [ ] Try to access Step 3 URL directly without completing Step 2
- [ ] Submit investment and verify database save
- [ ] Test form validation error messages
- [ ] Test submission error handling
- [ ] Verify console logs show context actions

## Next Steps

1. Create context file
2. Create HOC file
3. Refactor Step 1, 2, 3 components
4. Update App.jsx routing
5. Update main.jsx to wrap with provider
6. Run tests to verify
7. Manual testing of wizard flow
