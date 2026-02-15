import React, { useEffect, useState } from 'react'
import { useCreateInvestmentWizard } from './contexts/CreateInvestmentContext.jsx'
import { CreateInvestmentProvider } from './contexts/CreateInvestmentContext.jsx'
import InvestmentsList from './screens/InvestmentsList'
import InvestmentDetail from './screens/InvestmentDetail'
import { mockInvestments } from './mocks/investments.js'
import CreateInvestment from './screens/CreateInvestment'
import CreateInvestmentStep2 from './screens/CreateInvestmentStep2'
import CreateInvestmentStep3 from './screens/CreateInvestmentStep3'
import BottomNav from './components/BottomNav'
import './App.css'

function AppContent() {
  const { currentStep, goToStep, resetWizard } = useCreateInvestmentWizard()

  // Local state for non-wizard screens
  const [currentScreen, setCurrentScreen] = useState('list') // 'list' | 'detail' | 'create' | 'create-step2'
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null)

  // Sync wizard step to URL
  useEffect(() => {
    if (currentScreen === 'create' || currentScreen.startsWith('create-step')) {
      const stepMap = { 1: 'create', 2: 'create-step2', 3: 'create-step3' }
      const expectedScreen = stepMap[currentStep] || 'create'
      if (currentScreen !== expectedScreen) {
        setCurrentScreen(expectedScreen)
        const paths = { 1: '/investments/new', 2: '/investments/new/step2', 3: '/investments/new/step3' }
        window.history.pushState({}, '', paths[currentStep] || '/investments/new')
      }
    }
  }, [currentStep, currentScreen])

  // Update currentScreen from URL path
  useEffect(() => {
    const updateFromPath = () => {
      const path = window.location.pathname
      console.debug('[App] updateFromPath ->', path)
      if (path === '/' || path === '') {
        setCurrentScreen('list')
        setSelectedInvestmentId(null)
      } else if (path === '/investments/new') {
        setCurrentScreen('create')
        goToStep(1)
      } else if (path === '/investments/new/step2') {
        setCurrentScreen('create-step2')
        goToStep(2)
      } else if (path === '/investments/new/step3') {
        setCurrentScreen('create-step3')
        goToStep(3)
      } else if (path.startsWith('/investments/')) {
        // Expecting path like /investments/:idOrExternalId
        const parts = path.split('/').filter(Boolean)
        const idOrExt = parts[1] || ''
        // Try to find by internal id first, then externalInvestmentId
        const found = mockInvestments.find(m => m.id === idOrExt) || mockInvestments.find(m => (m.externalInvestmentId || '').toLowerCase() === idOrExt.toLowerCase())
        if (found) {
          setSelectedInvestmentId(found.id)
        } else {
          // If not found, clear selection so InvestmentDetail shows not-found
          setSelectedInvestmentId(null)
        }
        setCurrentScreen('detail')
      }
    }
    updateFromPath()
    const popstateHandler = (e) => {
      console.debug('[App] popstate event triggered', {pathname: window.location.pathname, state: e.state})
      updateFromPath()
    }
    window.addEventListener('popstate', popstateHandler)
    return () => window.removeEventListener('popstate', popstateHandler)
  }, [goToStep])

  const handleSelectInvestment = (investmentId) => {
    setSelectedInvestmentId(investmentId)
    setCurrentScreen('detail')
    window.history.pushState({}, '', `/investments/${investmentId}`)
  }

  const handleBackToList = () => {
    setCurrentScreen('list')
    setSelectedInvestmentId(null)
    window.history.pushState({}, '', '/')
  }

  const handleStartCreate = () => {
    resetWizard() // Clear any previous wizard state
    setCurrentScreen('create')
    goToStep(1)
    window.history.pushState({}, '', '/investments/new')
  }

  const handleSaveInvestmentDone = (investmentId) => {
    console.debug('[App] Investment saved, navigating to detail:', investmentId)
    setSelectedInvestmentId(investmentId)
    setCurrentScreen('detail')
    resetWizard() // Clear wizard state after successful save
    window.history.pushState({}, '', `/investments/${investmentId}`)
  }

  const handleCancelWizard = () => {
    resetWizard()
    handleBackToList()
  }

  const creatInvestmentScreens = {
    'create': <CreateInvestment onCancel={handleCancelWizard} />,
    'create-step2': <CreateInvestmentStep2 />,
    'create-step3': <CreateInvestmentStep3 onDone={handleSaveInvestmentDone} />,
  }

  return (
    <div className="app">
      {currentScreen === 'list' && <InvestmentsList onSelectInvestment={handleSelectInvestment} onCreate={handleStartCreate} />}
      {currentScreen === 'detail' && (
        <InvestmentDetail investmentId={selectedInvestmentId} onBack={handleBackToList} />
      )}
      {Object.keys(creatInvestmentScreens).includes(currentScreen) && creatInvestmentScreens[currentScreen]}
      <BottomNav />
    </div>
  )
}

function App() {
  return (
    <CreateInvestmentProvider>
      <AppContent />
    </CreateInvestmentProvider>
  )
}

export default App
