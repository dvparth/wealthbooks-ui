import { useState } from 'react'
import InvestmentsList from './screens/InvestmentsList'
import InvestmentDetail from './screens/InvestmentDetail'
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('list') // 'list' or 'detail'
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null)

  const handleSelectInvestment = (investmentId) => {
    setSelectedInvestmentId(investmentId)
    setCurrentScreen('detail')
  }

  const handleBackToList = () => {
    setCurrentScreen('list')
    setSelectedInvestmentId(null)
  }

  return (
    <div className="app">
      {currentScreen === 'list' ? (
        <InvestmentsList onSelectInvestment={handleSelectInvestment} />
      ) : (
        <InvestmentDetail investmentId={selectedInvestmentId} onBack={handleBackToList} />
      )}
    </div>
  )
}

export default App
