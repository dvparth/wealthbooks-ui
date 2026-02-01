import { useEffect, useState } from 'react'
import InvestmentsList from './screens/InvestmentsList'
import InvestmentDetail from './screens/InvestmentDetail'
import CreateInvestment from './screens/CreateInvestment'
import CreateInvestmentStep2 from './screens/CreateInvestmentStep2'
import CreateInvestmentStep3 from './screens/CreateInvestmentStep3'
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('list') // 'list' | 'detail' | 'create' | 'create-step2'
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null)

  // Log screen changes for debugging
  useEffect(() => {
    console.debug('[App] currentScreen changed to:', currentScreen)
  }, [currentScreen])

  useEffect(() => {
    const updateFromPath = () => {
      const path = window.location.pathname
      console.debug('[App] updateFromPath ->', path)
      if (path === '/' || path === '') {
        setCurrentScreen('list')
      } else if (path === '/investments/new') {
        setCurrentScreen('create')
      } else if (path === '/investments/new/step2') {
        setCurrentScreen('create-step2')
      } else if (path === '/investments/new/step3') {
        setCurrentScreen('create-step3')
      } else if (path.startsWith('/investments/')) {
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
  }, [])

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
    setCurrentScreen('create')
    window.history.pushState({}, '', '/investments/new')
  }

  const handleGotoStep2 = () => {
    console.debug('[App] handleGotoStep2 called (from onNext)')
    setCurrentScreen('create-step2')
    window.history.pushState({}, '', '/investments/new/step2')
  }

  const handleGotoStep3 = () => {
    console.debug('[App] handleGotoStep3 called')
    setCurrentScreen('create-step3')
    window.history.pushState({}, '', '/investments/new/step3')
  }

  const handleSaveInvestmentDone = (investmentId) => {
    console.debug('[App] Investment saved, navigating to detail:', investmentId)
    setSelectedInvestmentId(investmentId)
    setCurrentScreen('detail')
    window.history.pushState({}, '', `/investments/${investmentId}`)
  }

  return (
    <div className="app">
      {currentScreen === 'list' && <InvestmentsList onSelectInvestment={handleSelectInvestment} onCreate={handleStartCreate} />}
      {currentScreen === 'detail' && (
        <InvestmentDetail investmentId={selectedInvestmentId} onBack={handleBackToList} />
      )}
      {currentScreen === 'create' && <CreateInvestment onCancel={handleBackToList} onNext={handleGotoStep2} />}
      {currentScreen === 'create-step2' && (
        <>
          {console.debug('[App] Rendering CreateInvestmentStep2')}
          <CreateInvestmentStep2 
            onBack={() => { 
              console.debug('[App] Step2 onBack called')
              setCurrentScreen('create')
              window.history.pushState({}, '', '/investments/new')
            }} 
            onNext={handleGotoStep3} 
          />
        </>
      )}
      {currentScreen === 'create-step3' && (
        <CreateInvestmentStep3 
          onBack={() => { 
            console.debug('[App] Step3 onBack called')
            setCurrentScreen('create-step2')
            window.history.pushState({}, '', '/investments/new/step2')
          }} 
          onDone={handleSaveInvestmentDone}
        />
      )}
    </div>
  )
}

export default App
