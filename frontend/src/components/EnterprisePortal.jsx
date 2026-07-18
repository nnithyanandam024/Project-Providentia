import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Sliders,
  Plus,
  RefreshCw,
  Mic,
  DollarSign,
  HelpCircle,
  Building2,
  ChevronRight,
  Info
} from 'lucide-react';

export default function EnterprisePortal({
  enterpriseData,
  selectedEnterpriseId,
  onSelectEnterprise,
  enterprisesList,
  onAddTransaction,
  onRunSimulation
}) {
  const [activeTab, setActiveTab] = useState('forecast'); // forecast, logger, simulation, voice
  const [showLogModal, setShowLogModal] = useState(false);

  // Form state for new transaction
  const [newTrans, setNewTrans] = useState({
    year_month: '2026-08',
    income: '',
    expense: '',
    savings_added: '',
    loan_repayment: ''
  });

  // Simulation parameters state
  const [simParams, setSimParams] = useState({
    monsoon_impact_pct: 0,
    market_price_pct: 0,
    additional_monthly_expense: 0
  });

  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Voice assistant state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResponse, setVoiceResponse] = useState('');

  if (!enterpriseData) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading enterprise data...
      </div>
    );
  }

  const { enterprise, historical_logs, forecasts, risk_assessment, recommendations } = enterpriseData;

  // Prepare chart dataset combining historical + forecasts
  const chartData = [
    ...historical_logs.map(log => ({
      period: log.year_month,
      Income: log.income,
      Expense: log.expense,
      NetCashFlow: roundVal(log.income - log.expense),
      type: 'Historical'
    })),
    ...(simResult ? simResult.simulated_forecasts : forecasts).map(f => ({
      period: `${f.year_month} (Est)`,
      Income: f.projected_income,
      Expense: f.projected_expense,
      NetCashFlow: f.projected_net_cash_flow,
      PessimisticNet: f.pessimistic_net_cash_flow,
      OptimisticNet: f.optimistic_net_cash_flow,
      type: 'Forecast'
    }))
  ];

  function roundVal(v) {
    return Math.round(v * 100) / 100;
  }

  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    setIsSimulating(true);
    const res = await onRunSimulation(enterprise.id, simParams);
    setSimResult(res);
    setIsSimulating(false);
  };

  const handleResetSimulation = () => {
    setSimParams({ monsoon_impact_pct: 0, market_price_pct: 0, additional_monthly_expense: 0 });
    setSimResult(null);
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    await onAddTransaction(enterprise.id, {
      year_month: newTrans.year_month,
      income: parseFloat(newTrans.income) || 0,
      expense: parseFloat(newTrans.expense) || 0,
      savings_added: parseFloat(newTrans.savings_added) || 0,
      loan_repayment: parseFloat(newTrans.loan_repayment) || 0
    });
    setShowLogModal(false);
    setNewTrans({ year_month: '2026-08', income: '', expense: '', savings_added: '', loan_repayment: '' });
  };

  const handleVoiceSimulate = (promptText) => {
    setIsListening(true);
    setVoiceTranscript(promptText);
    setTimeout(() => {
      setIsListening(false);
      if (promptText.includes('income') || promptText.includes('sales')) {
        setVoiceResponse('Recognized: Income record query. Your average projected monthly revenue is ₹' + Math.round(enterprise.monthly_loan_emi * 3.5).toLocaleString('en-IN') + '. Cash flow status is stable.');
      } else if (promptText.includes('monsoon') || promptText.includes('rain')) {
        setVoiceResponse('Recognized: Climate scenario simulation. If rainfall drops by 20%, projected cash flow margin decreases by 14%. Your liquidity buffer covers 38 days.');
      } else {
        setVoiceResponse('Recognized voice query: Cash Flow Health Status. Risk Score is ' + currentRisk.score + '/100 (' + currentRisk.level + ').');
      }
    }, 1200);
  };

  const currentRisk = simResult ? simResult.simulated_risk_assessment : risk_assessment;
  const activeRecs = simResult ? simResult.simulated_recommendations : recommendations;

  return (
    <div className="space-y-6">
      {/* Enterprise Header Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#005A36]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-slate-900">{enterprise.name}</h1>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                {enterprise.type} &bull; {enterprise.sector}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Location: {enterprise.location}, {enterprise.district}, {enterprise.state} &bull; Members: {enterprise.members_count} &bull; Contact: {enterprise.contact_person}
            </p>
          </div>
        </div>

        {/* Enterprise Dropdown Selector */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-slate-600">Switch Enterprise:</label>
          <select
            value={selectedEnterpriseId}
            onChange={(e) => onSelectEnterprise(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-[#005A36] focus:border-[#005A36]"
          >
            {enterprisesList.map(ent => (
              <option key={ent.id} value={ent.id}>
                {ent.name} ({ent.district})
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center space-x-2 bg-[#005A36] hover:bg-[#004529] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log Record</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Risk Score Card */}
        <div className={`p-5 rounded-xl border ${
          currentRisk.category === 'High'
            ? 'badge-risk-high'
            : currentRisk.category === 'Medium'
            ? 'badge-risk-medium'
            : 'badge-risk-low'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">Risk Level Indicator</span>
            {currentRisk.category === 'High' ? (
              <ShieldAlert className="w-5 h-5 text-red-600" />
            ) : currentRisk.category === 'Medium' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold">{currentRisk.score} / 100</div>
            <div className="text-sm font-semibold mt-1">{currentRisk.level}</div>
          </div>
          <p className="text-xs mt-2 opacity-80">
            Based on DSCR, liquidity reserves, and 6-month forecast projections.
          </p>
        </div>

        {/* DSCR Ratio */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">DSCR Ratio</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{currentRisk.metrics.dscr}x</div>
            <p className="text-xs text-slate-500 mt-1">
              Debt Service Coverage (Benchmark &gt; 1.25x)
            </p>
          </div>
        </div>

        {/* Liquidity Buffer */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Liquidity Buffer</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{currentRisk.metrics.liquidity_days} Days</div>
            <p className="text-xs text-slate-500 mt-1">
              Operating expense coverage in savings reserve
            </p>
          </div>
        </div>

        {/* Current Loan Outstanding */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Loan Outstanding</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              ₹{enterprise.current_loan_outstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Monthly EMI: ₹{enterprise.monthly_loan_emi.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Bar */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'forecast'
                  ? 'bg-white text-[#005A36] shadow-sm border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cash Flow Forecast (3-6 Months)
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'simulation'
                  ? 'bg-white text-[#005A36] shadow-sm border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>What-If Scenario Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'voice'
                  ? 'bg-white text-[#005A36] shadow-sm border border-slate-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Voice Prompt Assistant</span>
            </button>
          </div>

          {simResult && (
            <div className="flex items-center space-x-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg">
              <Info className="w-3.5 h-3.5" />
              <span>Viewing Simulated Climate/Market Scenario</span>
              <button
                onClick={handleResetSimulation}
                className="ml-2 font-semibold underline text-amber-900 hover:text-slate-900"
              >
                Reset to Real Data
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Forecast & Chart View */}
        {activeTab === 'forecast' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Historical vs Projected Cash Flow Trajectory
                </h3>
                <p className="text-xs text-slate-500">
                  Includes past 12 months actuals + 6 months machine learning forecast with seasonal and market weights.
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-medium">
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                  <span className="text-slate-700">Income</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span className="text-slate-700">Expense</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-600 inline-block"></span>
                  <span className="text-slate-700">Net Cash Flow</span>
                </span>
              </div>
            </div>

            {/* Recharts Composed Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="Income" fill="#059669" radius={[4, 4, 0, 0]} opacity={0.85} />
                  <Bar dataKey="Expense" fill="#e11d48" radius={[4, 4, 0, 0]} opacity={0.75} />
                  <Line type="monotone" dataKey="NetCashFlow" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Drivers Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Explainable Risk Drivers & Financial Metrics
                </h4>
                <div className="space-y-3">
                  {currentRisk.drivers.map((driver, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{driver.name}</div>
                        <div className="text-slate-500 mt-0.5">Benchmark: {driver.benchmark}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{driver.value}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          driver.impact === 'High' ? 'bg-red-100 text-red-800' : driver.impact === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {driver.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  AI Early Warning Recommendations
                </h4>
                <div className="space-y-3">
                  {activeRecs.length > 0 ? (
                    activeRecs.map((rec, idx) => (
                      <div key={idx} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#005A36] uppercase tracking-wider">{rec.type}</span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-900">{rec.title}</h5>
                        <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200 text-xs">
                      No critical warnings. Enterprise maintains healthy working capital reserves.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: What-If Scenario Simulator */}
        {activeTab === 'simulation' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Stress Testing & What-If Financial Simulation
              </h3>
              <p className="text-xs text-slate-500">
                Adjust climate, market crop prices, or operational expenses to test enterprise resilience before financial stress occurs.
              </p>
            </div>

            <form onSubmit={handleSimulateSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
              {/* Slider 1: Monsoon Impact */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Monsoon Rainfall Deficit / Excess (%)
                </label>
                <input
                  type="range"
                  min="-40"
                  max="30"
                  value={simParams.monsoon_impact_pct}
                  onChange={(e) => setSimParams({ ...simParams, monsoon_impact_pct: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#005A36]"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1 font-medium">
                  <span>Drought (-40%)</span>
                  <span className="text-slate-900 font-bold">{simParams.monsoon_impact_pct}%</span>
                  <span>Excess (+30%)</span>
                </div>
              </div>

              {/* Slider 2: Market Crop Price Change */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Market Crop / Product Price Fluctuations (%)
                </label>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={simParams.market_price_pct}
                  onChange={(e) => setSimParams({ ...simParams, market_price_pct: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#005A36]"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1 font-medium">
                  <span>Price Crash (-30%)</span>
                  <span className="text-slate-900 font-bold">{simParams.market_price_pct}%</span>
                  <span>Price Spike (+30%)</span>
                </div>
              </div>

              {/* Input 3: Additional Monthly Expenses */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Additional Monthly Expense Shock (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={simParams.additional_monthly_expense || ''}
                  onChange={(e) => setSimParams({ ...simParams, additional_monthly_expense: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-[#005A36]"
                />
                <p className="text-[11px] text-slate-500 mt-1">e.g., Equipment repair or raw material cost spike</p>
              </div>

              <div className="md:col-span-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleResetSimulation}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Reset Parameters
                </button>
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="px-5 py-2 bg-[#005A36] hover:bg-[#004529] text-white rounded-lg text-xs font-medium transition shadow-sm flex items-center space-x-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'Calculating...' : 'Recalculate AI Risk Model'}</span>
                </button>
              </div>
            </form>

            {/* Simulation Results Display */}
            {simResult && (
              <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h4 className="text-sm font-bold text-slate-900">Simulation Recalibration Results</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    simResult.simulated_risk_assessment.category === 'High' ? 'badge-risk-high' : simResult.simulated_risk_assessment.category === 'Medium' ? 'badge-risk-medium' : 'badge-risk-low'
                  }`}>
                    New Risk Score: {simResult.simulated_risk_assessment.score}/100 ({simResult.simulated_risk_assessment.level})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Recalculated DSCR</span>
                    <span className="text-base font-bold text-slate-900">{simResult.simulated_risk_assessment.metrics.dscr}x</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Recalculated Liquidity Buffer</span>
                    <span className="text-base font-bold text-slate-900">{simResult.simulated_risk_assessment.metrics.liquidity_days} Days</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Projected Cash Deficit Months</span>
                    <span className="text-base font-bold text-slate-900">{simResult.simulated_risk_assessment.metrics.negative_months} months</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Voice Prompt Assistant Simulator */}
        {activeTab === 'voice' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Low-Literacy & Regional Language Voice Assistant
              </h3>
              <p className="text-xs text-slate-500">
                Enables rural micro entrepreneurs to record income, expenses, and check cash flow predictions via voice input in regional languages.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
              <button
                onClick={() => handleVoiceSimulate('Check cash flow health and monsoon impact')}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition shadow-md ${
                  isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#005A36] text-white hover:bg-[#004529]'
                }`}
              >
                <Mic className="w-8 h-8" />
              </button>

              <span className="text-xs font-semibold text-slate-700">
                {isListening ? 'Listening to voice query...' : 'Click microphone icon to test simulated voice query'}
              </span>

              {/* Sample Quick Voice Prompts */}
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <button
                  onClick={() => handleVoiceSimulate('Log income of Rs 25000 from paddy harvest')}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-full text-xs text-slate-700 hover:bg-slate-100"
                >
                  "Log income of Rs 25,000"
                </button>
                <button
                  onClick={() => handleVoiceSimulate('What if monsoon rainfall drops by 20%?')}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-full text-xs text-slate-700 hover:bg-slate-100"
                >
                  "What if monsoon drops by 20%?"
                </button>
                <button
                  onClick={() => handleVoiceSimulate('What is my credit risk level for next month?')}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-full text-xs text-slate-700 hover:bg-slate-100"
                >
                  "What is my risk level?"
                </button>
              </div>

              {voiceTranscript && (
                <div className="w-full max-w-lg mt-4 p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
                  <div className="text-slate-500 font-semibold">Voice Transcript: "{voiceTranscript}"</div>
                  <div className="text-slate-900 font-medium bg-emerald-50 border border-emerald-200 p-3 rounded text-emerald-900">
                    {voiceResponse || 'Processing speech-to-text NLP engine...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Log Transaction Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Log Financial Record</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Period (YYYY-MM)</label>
                <input
                  type="text"
                  required
                  value={newTrans.year_month}
                  onChange={(e) => setNewTrans({ ...newTrans, year_month: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Monthly Income / Revenue (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 45000"
                  value={newTrans.income}
                  onChange={(e) => setNewTrans({ ...newTrans, income: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Monthly Operational Expense (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 32000"
                  value={newTrans.expense}
                  onChange={(e) => setNewTrans({ ...newTrans, expense: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Savings Added (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 3000"
                    value={newTrans.savings_added}
                    onChange={(e) => setNewTrans({ ...newTrans, savings_added: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Loan EMI Paid (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 11500"
                    value={newTrans.loan_repayment}
                    onChange={(e) => setNewTrans({ ...newTrans, loan_repayment: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005A36] text-white rounded-lg font-medium hover:bg-[#004529]"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
