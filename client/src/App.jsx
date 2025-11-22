import { useState, useEffect } from 'react'
import { getInvoices, scanInvoices, getBankTransactions, scanBankTransactions } from './api'
import InvoiceTable from './components/InvoiceTable'
import BankTable from './components/BankTable'
import { RefreshCw, FileText, CreditCard } from 'lucide-react'
import './App.css'
import './modal_styles.css'

function App() {
  const [view, setView] = useState('invoices') // 'invoices' | 'bank'
  const [invoices, setInvoices] = useState([])
  const [bankData, setBankData] = useState([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [agentFilter, setAgentFilter] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [view])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (view === 'invoices') {
        const data = await getInvoices()
        setInvoices(data)
      } else {
        const data = await getBankTransactions()
        setBankData(data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Error al cargar datos. Asegúrate de que el servidor (ventana negra) esté corriendo.')
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async () => {
    setScanning(true)
    try {
      if (view === 'invoices') {
        await scanInvoices()
      } else {
        await scanBankTransactions()
      }
      await loadData()
    } catch (error) {
      console.error('Error scanning:', error)
    } finally {
      setScanning(false)
    }
  }

  // Calculate stats
  const currentData = (view === 'invoices' ? invoices : bankData) || []

  const totalAmount = view === 'invoices'
    ? (Array.isArray(invoices) ? invoices.reduce((acc, curr) => acc + (curr.total || 0), 0) : 0)
    : (Array.isArray(bankData) ? bankData.reduce((acc, curr) => acc + (curr.amount || 0), 0) : 0)

  const agentStats = agentFilter ? currentData.filter(i => i.agent === agentFilter).reduce((acc, curr) => ({
    total: acc.total + (view === 'invoices' ? (curr.total || 0) : (curr.amount || 0)),
    count: acc.count + 1
  }), { total: 0, count: 0 }) : null

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <FileText size={32} />
          <div>
            <h1>Lector de Facturas</h1>
            <span className="version-badge">v1.1.0</span>
          </div>
        </div>

        <div className="view-switcher">
          <button
            className={`view-btn ${view === 'invoices' ? 'active' : ''}`}
            onClick={() => { setView('invoices'); setAgentFilter(''); }}
          >
            <FileText size={18} /> Facturas
          </button>
          <button
            className={`view-btn ${view === 'bank' ? 'active' : ''}`}
            onClick={() => { setView('bank'); setAgentFilter(''); }}
          >
            <CreditCard size={18} /> Depósitos
          </button>
        </div>

        <button
          className={`scan-button ${scanning ? 'scanning' : ''}`}
          onClick={handleScan}
          disabled={scanning}
        >
          <RefreshCw size={20} className={scanning ? 'spin' : ''} />
          {scanning ? 'Escanear...' : (view === 'invoices' ? 'Escanear Facturas' : 'Escanear Banco')}
        </button>
      </header>

      <main className="app-main">
        <div className="stats-card">
          <div className="stat">
            <span className="stat-label">Total Registros</span>
            <span className="stat-value">{currentData.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">{view === 'invoices' ? 'Monto Total' : 'Flujo Total'}</span>
            <span className="stat-value">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {agentFilter && (
            <div className="stat agent-stat">
              <span className="stat-label">{view === 'invoices' ? 'Ventas' : 'Movimientos'} {agentFilter}</span>
              <span className={`stat-value ${agentStats.total < 0 ? 'text-red-400' : 'text-success'}`}>
                ${agentStats.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="stat-sublabel">{agentStats.count} registros</span>
            </div>
          )}
        </div>

        <div className="content-card">
          {error && (
            <div className="error-message" style={{ padding: '1rem', color: '#f87171', textAlign: 'center' }}>
              {error}
            </div>
          )}
          {loading ? (
            <div className="loading">Cargando datos...</div>
          ) : (
            view === 'invoices' ? (
              <InvoiceTable
                data={invoices}
                agentFilter={agentFilter}
                setAgentFilter={setAgentFilter}
                onDataUpdate={loadData}
              />
            ) : (
              <BankTable
                data={bankData}
                agentFilter={agentFilter}
                setAgentFilter={setAgentFilter}
                onDataUpdate={loadData}
              />
            )
          )}
        </div>
      </main>
    </div>
  )
}

export default App
