import { createContext, useState, useCallback, useContext } from 'react'

/**
 * CreateInvestmentContext
 *
 * Manages the multi-step create investment wizard state.
 * Replaces sessionStorage with React Context for:
 * - Step 1: Personal details (source, investment type, owner, bank, dates)
 * - Step 2: Financial parameters (principal, rate, calculation rules, TDS)
 * - Step 3: Preview and final submission
 *
 * State is persisted in memory during the wizard flow and cleared on completion/cancel.
 */
const CreateInvestmentContext = createContext(null)

export function CreateInvestmentProvider({ children }) {
  // ============ Step 1 State ============
  const [step1, setStep1] = useState(null)

  // ============ Step 2 State ============
  const [step2, setStep2] = useState(null)

  // ============ Wizard Flow State ============
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState(null)

  // ============ Step 1 Actions ============
  /**
   * Update step1 data
   * Called when user modifies step1 form
   */
  const updateStep1 = useCallback((newStep1) => {
    setStep1((prev) => ({
      ...prev,
      ...newStep1,
    }))
    console.debug('[CreateInvestmentContext] Step 1 updated:', newStep1)
  }, [])

  /**
   * Set entire step1 data (replace)
   * Called on initial load or reset
   */
  const setStep1Data = useCallback((data) => {
    setStep1(data)
    console.debug('[CreateInvestmentContext] Step 1 data set:', data)
  }, [])

  // ============ Step 2 Actions ============
  /**
   * Update step2 data
   * Called when user modifies step2 form
   */
  const updateStep2 = useCallback((newStep2) => {
    setStep2((prev) => ({
      ...prev,
      ...newStep2,
    }))
    console.debug('[CreateInvestmentContext] Step 2 updated:', newStep2)
  }, [])

  /**
   * Set entire step2 data (replace)
   * Called on initial load or reset
   */
  const setStep2Data = useCallback((data) => {
    setStep2(data)
    console.debug('[CreateInvestmentContext] Step 2 data set:', data)
  }, [])

  // ============ Navigation Actions ============
  /**
   * Go to next step
   * Validation should happen in the step component before calling this
   */
  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < 3) {
        const next = prev + 1
        console.debug('[CreateInvestmentContext] Navigated to step:', next)
        return next
      }
      return prev
    })
  }, [])

  /**
   * Go to previous step
   */
  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev > 1) {
        const next = prev - 1
        console.debug('[CreateInvestmentContext] Navigated to step:', next)
        return next
      }
      return prev
    })
  }, [])

  /**
   * Go to specific step
   */
  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(() => {
        console.debug('[CreateInvestmentContext] Navigated to step:', step)
        return step
      })
    }
  }, [])

  // ============ Submission Actions ============
  /**
   * Mark submission as in progress
   */
  const startSubmitting = useCallback(() => {
    setIsSubmitting(true)
    setSubmissionError(null)
    console.debug('[CreateInvestmentContext] Submission started')
  }, [])

  /**
   * Mark submission as complete and clear all state
   */
  const completeSubmission = useCallback(() => {
    setIsSubmitting(false)
    setSubmissionError(null)
    setStep1(null)
    setStep2(null)
    setCurrentStep(1)
    console.debug('[CreateInvestmentContext] Submission completed, state cleared')
  }, [])

  /**
   * Handle submission error
   */
  const setError = useCallback((error) => {
    setIsSubmitting(false)
    setSubmissionError(error)
    console.error('[CreateInvestmentContext] Submission error:', error)
  }, [])

  // ============ Reset/Cancel Actions ============
  /**
   * Reset entire wizard state (called on cancel or after successful submission)
   */
  const resetWizard = useCallback(() => {
    setStep1(null)
    setStep2(null)
    setCurrentStep(1)
    setIsSubmitting(false)
    setSubmissionError(null)
    console.debug('[CreateInvestmentContext] Wizard reset')
  }, [])

  // ============ Context Value ============
  const value = {
    // State
    step1,
    step2,
    currentStep,
    isSubmitting,
    submissionError,

    // Step 1 Actions
    updateStep1,
    setStep1Data,

    // Step 2 Actions
    updateStep2,
    setStep2Data,

    // Navigation
    goToNextStep,
    goToPreviousStep,
    goToStep,

    // Submission
    startSubmitting,
    completeSubmission,
    setError,

    // Reset
    resetWizard,
  }

  return (
    <CreateInvestmentContext.Provider value={value}>
      {children}
    </CreateInvestmentContext.Provider>
  )
}

/**
 * Hook to use CreateInvestmentContext
 * Must be used within CreateInvestmentProvider
 */
export function useCreateInvestmentWizard() {
  const context = useContext(CreateInvestmentContext)
  if (!context) {
    throw new Error('useCreateInvestmentWizard must be used within CreateInvestmentProvider')
  }
  return context
}
