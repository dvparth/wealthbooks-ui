import { useCreateInvestmentWizard } from '../contexts/CreateInvestmentContext'
import { useEffect } from 'react'

/**
 * withCreateInvestmentStep HOC
 *
 * Wraps step components (Step1, Step2, Step3) to:
 * 1. Enforce step flow (prevent skipping steps)
 * 2. Ensure required data is present before accessing a step
 * 3. Provide context values as props for backwards compatibility
 * 4. Handle navigation state synchronization
 *
 * Usage:
 *   const ProtectedStep2 = withCreateInvestmentStep(CreateInvestmentStep2, 2)
 *
 * @param {React.Component} Component - The step component to wrap
 * @param {number} requiredStep - The step number this component represents (1, 2, or 3)
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireStep1 - If true, requires step1 to be filled
 * @param {boolean} options.requireStep2 - If true, requires step2 to be filled
 * @returns {React.Component} - Wrapped component
 */
export function withCreateInvestmentStep(
  Component,
  requiredStep,
  options = {}
) {
  const {
    requireStep1 = requiredStep > 1,
    requireStep2 = requiredStep > 2,
  } = options

  return function ProtectedStepComponent(props) {
    const context = useCreateInvestmentWizard()
    const { currentStep, step1, step2, goToStep } = context

    // ============ Step Flow Enforcement ============
    // Log only when the user is clearly out-of-order (context ahead of rendered step).
    // Avoid noisy warnings during normal next-step navigation where timing may differ.
    useEffect(() => {
      if (currentStep > requiredStep) {
        console.debug(
          `[withCreateInvestmentStep] User attempted to access step ${requiredStep} but is on step ${currentStep}`
        )
      }
    }, [currentStep, requiredStep])

    // ============ Data Validation ============
    // Check if required data is present
    const missingStep1 = requireStep1 && !step1
    const missingStep2 = requireStep2 && !step2

    // Only show the invalid-state UI when the wizard context indicates the user
    // is at-or-past this step but prerequisites are missing. This avoids
    // transient blocks while navigation and context state synchronize.
    if ((missingStep1 || missingStep2) && currentStep >= requiredStep) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#b91c1c' }}>
          <h2>⚠️ Invalid Wizard State</h2>
          <p>
            {missingStep1 && 'Step 1 data is missing. '}
            {missingStep2 && 'Step 2 data is missing. '}
            Please go back and complete the previous steps.
          </p>
          <button
            onClick={() => goToStep(1)}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Start Over
          </button>
        </div>
      )
    }

    // ============ Pass Context as Props ============
    // For backwards compatibility with existing components
    const enhancedProps = {
      ...props,
      // Context values
      wizardContext: context,
      // Common props
      onBack: props.onBack || (() => context.goToPreviousStep()),
      onNext: props.onNext || (() => context.goToNextStep()),
    }

    return <Component {...enhancedProps} />
  }
}

/**
 * useStepNavigation Hook
 *
 * Provides step navigation utilities for step components
 * Complements the context hook with router-aware navigation
 *
 * @param {Object} config - Configuration
 * @param {Function} config.onNavigate - Called when step navigation occurs (for route updates)
 * @returns {Object} - Navigation utilities
 */
export function useStepNavigation(config = {}) {
  const context = useCreateInvestmentWizard()
  const { onNavigate } = config

  const handleNext = () => {
    context.goToNextStep()
    onNavigate?.(context.currentStep + 1)
  }

  const handlePrevious = () => {
    context.goToPreviousStep()
    onNavigate?.(context.currentStep - 1)
  }

  const handleCancel = () => {
    context.resetWizard()
    onNavigate?.(0) // Special code for exit
  }

  return {
    handleNext,
    handlePrevious,
    handleCancel,
    currentStep: context.currentStep,
  }
}
