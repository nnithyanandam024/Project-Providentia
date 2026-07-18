import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Users,
  Search,
  Filter,
  FileText,
  ChevronRight,
  TrendingDown,
  Printer,
  ClipboardList,
  Activity
} from 'lucide-react';

export default function OfficerDashboard({
  portfolioData,
  onSelectEnterprise,
  onLogOfficerAction
}) {
  const [riskFilter, setRiskFilter] = useState('ALL'); // ALL, High, Medium, Low
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuditEnt, setSelectedAuditEnt] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Officer action form
  const [actionForm, setActionForm] = useState({
    action_type: 'Dispatch Field Visit',
    notes: ''
  });
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  if (!portfolioData) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading NABARD Officer Portfolio...
      </div>
    );
  }

  const { portfolio_summary, enterprises } = portfolioData;

  const filteredEnterprises = enterprises.filter((ent) => {
    const matchesRisk = riskFilter === 'ALL' || ent.risk_category === riskFilter;
    const matchesSearch =
      ent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.sector.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAuditEnt) return;
    setIsSubmittingAction(true);
    await onLogOfficerAction({
      enterprise_id: selectedAuditEnt.id,
      action_type: actionForm.action_type,
      notes: actionForm.notes
    });
    setIsSubmittingAction(false);
    setActionForm({ action_type: 'Dispatch Field Visit', notes: '' });
    alert('Officer action logged successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Officer Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Portfolio Monitored */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Monitored Enterprises</span>
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">
              {portfolio_summary.total_enterprises}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active SHGs & FPOs under supervision
            </p>
          </div>
        </div>

        {/* Total Loan Outstanding */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Portfolio Outstanding</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              ₹{portfolio_summary.total_loan_outstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              NABARD / Bank credit exposure
            </p>
          </div>
        </div>

        {/* High Risk Credit at Risk */}
        <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm bg-red-50/30">
          <div className="flex items-center justify-between text-red-700">
            <span className="text-xs font-semibold uppercase tracking-wider">Credit at High Risk</span>
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-red-700">
              ₹{portfolio_summary.total_credit_at_risk.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {portfolio_summary.high_risk_count} High Risk enterprise(s) flagged
            </p>
          </div>
        </div>

        {/* Overall Portfolio Health Index */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Portfolio Health Index</span>
            <Activity className="w-5 h-5 text-[#005A36]" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-[#005A36]">
              {portfolio_summary.overall_portfolio_health_score} / 100
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Weighted risk score across monitored units
            </p>
          </div>
        </div>
      </div>

      {/* Main Portfolio Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filters & Search Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter Risk Status:</span>
            <div className="flex space-x-1">
              {['ALL', 'High', 'Medium', 'Low'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setRiskFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    riskFilter === cat
                      ? 'bg-[#005A36] text-white font-semibold'
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'ALL' ? 'All Units' : `${cat} Risk`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search enterprise or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs w-64 focus:ring-2 focus:ring-[#005A36]"
              />
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Portfolio Credit Report</span>
            </button>
          </div>
        </div>

        {/* Enterprise Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-600 tracking-wider">
                <th className="py-3.5 px-4">Enterprise Name</th>
                <th className="py-3.5 px-4">Type & Sector</th>
                <th className="py-3.5 px-4">District</th>
                <th className="py-3.5 px-4">Loan Outstanding</th>
                <th className="py-3.5 px-4">Monthly EMI</th>
                <th className="py-3.5 px-4">DSCR</th>
                <th className="py-3.5 px-4">Liquidity Buffer</th>
                <th className="py-3.5 px-4">Risk Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredEnterprises.map((ent) => (
                <tr key={ent.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{ent.name}</div>
                    <div className="text-[10px] font-normal text-slate-500">ID: {ent.id}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <span className="font-semibold">{ent.type}</span> &bull; {ent.sector}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{ent.district}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    ₹{ent.loan_outstanding.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    ₹{ent.monthly_emi.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-medium">
                    <span className={ent.dscr < 1.0 ? 'text-red-700 font-bold' : 'text-slate-800'}>
                      {ent.dscr}x
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {ent.liquidity_days} Days
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center space-x-1 ${
                      ent.risk_category === 'High'
                        ? 'badge-risk-high'
                        : ent.risk_category === 'Medium'
                        ? 'badge-risk-medium'
                        : 'badge-risk-low'
                    }`}>
                      <span>{ent.risk_score} / 100</span>
                      <span>({ent.risk_level})</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        onSelectEnterprise(ent.id);
                      }}
                      className="px-2.5 py-1 bg-[#005A36] text-white rounded text-[11px] font-medium hover:bg-[#004529]"
                    >
                      View App
                    </button>
                    <button
                      onClick={() => setSelectedAuditEnt(ent)}
                      className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded text-[11px] font-medium hover:bg-slate-200"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise Audit Side Modal */}
      {selectedAuditEnt && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedAuditEnt.name}</h3>
                  <p className="text-xs text-slate-500">
                    NABARD Supervisory Audit Panel &bull; ID: {selectedAuditEnt.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAuditEnt(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Audit Status Overview */}
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                selectedAuditEnt.risk_category === 'High' ? 'badge-risk-high' : selectedAuditEnt.risk_category === 'Medium' ? 'badge-risk-medium' : 'badge-risk-low'
              }`}>
                <div className="flex justify-between items-center font-bold">
                  <span>Risk Category: {selectedAuditEnt.risk_level}</span>
                  <span>Score: {selectedAuditEnt.risk_score} / 100</span>
                </div>
                <p className="opacity-90">
                  Contact Person: {selectedAuditEnt.contact_person} &bull; District: {selectedAuditEnt.district}
                </p>
              </div>

              {/* Key Audit Indicators */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">DSCR Coverage</span>
                  <span className="text-sm font-bold text-slate-900">{selectedAuditEnt.dscr}x</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Liquidity Coverage</span>
                  <span className="text-sm font-bold text-slate-900">{selectedAuditEnt.liquidity_days} Days</span>
                </div>
              </div>

              {/* Form to Log Action */}
              <form onSubmit={handleActionSubmit} className="space-y-4 text-xs pt-3 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm">Initiate Officer Action</h4>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Select Action Type</label>
                  <select
                    value={actionForm.action_type}
                    onChange={(e) => setActionForm({ ...actionForm, action_type: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-sm"
                  >
                    <option value="Dispatch Field Visit">Dispatch Field Officer Inspection</option>
                    <option value="Issue 3-Month Moratorium">Issue 3-Month EMI Relief / Restructuring</option>
                    <option value="Grant Emergency Liquidity Line">Grant NABARD Liquidity Buffer Support</option>
                    <option value="Financial Literacy Counseling">Schedule Financial Counseling Session</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Field Assessment Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter observations, climate impact, or loan restructuring rationale..."
                    value={actionForm.notes}
                    onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="w-full py-2.5 bg-[#005A36] text-white font-medium rounded-lg hover:bg-[#004529] transition shadow-sm"
                >
                  {isSubmittingAction ? 'Submitting...' : 'Record Supervisory Action'}
                </button>
              </form>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedAuditEnt(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Close Audit Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Report Modal / Print View */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-[#005A36] text-white flex items-center justify-center font-bold text-xs">
                  NABARD
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    NABARD Micro-Enterprise Portfolio Credit Assessment Report
                  </h3>
                  <p className="text-xs text-slate-500">Generated on: 2026-07-18</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div id="printable-credit-report" className="space-y-4 text-xs text-slate-800">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block">Total Monitored Units:</span>
                  <span className="font-bold text-slate-900">{portfolio_summary.total_enterprises} SHGs / FPOs</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Credit Exposure:</span>
                  <span className="font-bold text-slate-900">₹{portfolio_summary.total_loan_outstanding.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">High Risk Units Count:</span>
                  <span className="font-bold text-red-700">{portfolio_summary.high_risk_count}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Portfolio Health Score:</span>
                  <span className="font-bold text-[#005A36]">{portfolio_summary.overall_portfolio_health_score} / 100</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">High & Medium Risk Supervised Units</h4>
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-700">
                      <th className="p-2 border border-slate-200">Enterprise</th>
                      <th className="p-2 border border-slate-200">District</th>
                      <th className="p-2 border border-slate-200">Loan Outstanding</th>
                      <th className="p-2 border border-slate-200">DSCR</th>
                      <th className="p-2 border border-slate-200">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enterprises.map((e) => (
                      <tr key={e.id} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-200 font-medium">{e.name}</td>
                        <td className="p-2 border border-slate-200">{e.district}</td>
                        <td className="p-2 border border-slate-200">₹{e.loan_outstanding.toLocaleString('en-IN')}</td>
                        <td className="p-2 border border-slate-200">{e.dscr}x</td>
                        <td className="p-2 border border-slate-200 font-bold">{e.risk_score} / 100 ({e.risk_level})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 leading-relaxed">
                Notice: This report is generated by Project Providentia AI Cash Flow Forecasting Engine based on 12-month historical cash logs, seasonal monsoon patterns, and market price multipliers.
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Credit Report</span>
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Close Report Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
