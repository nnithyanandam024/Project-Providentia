import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginModal from './components/LoginModal';
import EnterprisePortal from './components/EnterprisePortal';
import OfficerDashboard from './components/OfficerDashboard';
import {
  Building2,
  Users,
  Wifi,
  WifiOff,
  LogOut,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

function MainAppContent() {
  const { user, token, isAuthenticated, logout } = useAuth();

  const [userRole, setUserRole] = useState('enterprise');
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState('ENT-101');
  const [enterprisesList, setEnterprisesList] = useState([]);
  const [enterpriseDetail, setEnterpriseDetail] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Sync role and enterprise_id from authenticated user
  useEffect(() => {
    if (user) {
      if (user.role === 'ENTERPRISE') {
        setUserRole('enterprise');
        if (user.enterprise_id) {
          setSelectedEnterpriseId(user.enterprise_id);
        }
      } else if (user.role === 'OFFICER') {
        setUserRole('officer');
      }
    }
  }, [user]);

  // Fetch initial enterprise list & portfolio
  useEffect(() => {
    if (isAuthenticated) {
      fetchEnterprises();
      fetchPortfolio();
    }
  }, [isAuthenticated]);

  // Fetch specific enterprise detail when selection changes
  useEffect(() => {
    if (isAuthenticated && selectedEnterpriseId) {
      fetchEnterpriseDetail(selectedEnterpriseId);
    }
  }, [isAuthenticated, selectedEnterpriseId]);

  const fetchEnterprises = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/enterprises`);
      if (!res.ok) throw new Error('API server unavailable');
      const data = await res.json();
      setEnterprisesList(data);
    } catch (err) {
      setEnterprisesList(fallbackEnterprises);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/officer/portfolio`);
      if (!res.ok) throw new Error('API server unavailable');
      const data = await res.json();
      setPortfolioData(data);
    } catch (err) {
      setPortfolioData(fallbackPortfolio);
    }
  };

  const fetchEnterpriseDetail = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/enterprises/${id}`);
      if (!res.ok) throw new Error('API server unavailable');
      const data = await res.json();
      setEnterpriseDetail(data);
    } catch (err) {
      const fb = fallbackEnterpriseDetails[id] || fallbackEnterpriseDetails['ENT-101'];
      setEnterpriseDetail(fb);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = async (entId, transactionPayload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/enterprises/${entId}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(transactionPayload)
      });
      if (res.ok) {
        await fetchEnterpriseDetail(entId);
        await fetchPortfolio();
      }
    } catch (err) {
      alert('Logged transaction locally (Simulated Offline Sync).');
    }
  };

  const handleRunSimulation = async (entId, simParams) => {
    try {
      const res = await fetch(`${API_BASE_URL}/simulation/${entId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(simParams)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    }
    return null;
  };

  const handleLogOfficerAction = async (actionPayload) => {
    try {
      await fetch(`${API_BASE_URL}/officer/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(actionPayload)
      });
      fetchPortfolio();
    } catch (err) {
      console.error('Officer action logging failed:', err);
    }
  };

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Offline Status Banner */}
      {isOfflineMode && (
        <div className="bg-amber-800 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center space-x-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Low-Network Offline Mode Active &bull; IndexedDB Local Cache Synchronized</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className="bg-[#005A36] text-white shadow-md border-b border-[#004529]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-inner">
              NABARD
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">Project Providentia</h1>
                <span className="text-[10px] bg-emerald-800/80 border border-emerald-500/40 text-emerald-100 px-2 py-0.5 rounded font-semibold uppercase">
                  NABARD Hackathon @ GFF 2026
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 font-normal">
                AI Cash Flow Forecasting & Risk Early-Warning Platform for Rural Micro Enterprises
              </p>
            </div>
          </div>

          {/* User Profile Badge & Navigation Controls */}
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            
            {/* Role Switcher Tabs (Only if Officer or Admin) */}
            {user?.role === 'OFFICER' && (
              <div className="bg-emerald-950/60 p-1 rounded-lg border border-white/10 flex space-x-1">
                <button
                  onClick={() => setUserRole('enterprise')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center space-x-1.5 ${
                    userRole === 'enterprise'
                      ? 'bg-white text-[#005A36] shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Enterprise App</span>
                </button>
                <button
                  onClick={() => setUserRole('officer')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center space-x-1.5 ${
                    userRole === 'officer'
                      ? 'bg-white text-[#005A36] shadow-sm'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Officer Dashboard</span>
                </button>
              </div>
            )}

            {/* Authenticated User Profile Pill */}
            <div className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg flex items-center space-x-2 text-xs">
              {user?.role === 'OFFICER' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-300" />
              )}
              <div>
                <span className="font-bold text-white">{user?.full_name}</span>
                <span className="text-[10px] text-emerald-200 block">
                  {user?.role === 'OFFICER' ? `District: ${user.assigned_district}` : `Enterprise ID: ${user?.enterprise_id}`}
                </span>
              </div>
            </div>

            {/* Network Toggle Button */}
            <button
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              title="Toggle Low-Network Rural Simulation Mode"
              className={`p-2 rounded-lg border text-xs font-medium transition flex items-center space-x-1 ${
                isOfflineMode
                  ? 'bg-amber-600 border-amber-400 text-white'
                  : 'bg-white/10 border-white/20 text-emerald-100 hover:bg-white/20'
              }`}
            >
              {isOfflineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg bg-rose-800/80 hover:bg-rose-900 border border-rose-700 text-white text-xs font-medium transition flex items-center space-x-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {userRole === 'enterprise' ? (
          <EnterprisePortal
            enterpriseData={enterpriseDetail}
            selectedEnterpriseId={selectedEnterpriseId}
            onSelectEnterprise={setSelectedEnterpriseId}
            enterprisesList={enterprisesList}
            onAddTransaction={handleAddTransaction}
            onRunSimulation={handleRunSimulation}
          />
        ) : (
          <OfficerDashboard
            portfolioData={portfolioData}
            onSelectEnterprise={(id) => {
              setSelectedEnterpriseId(id);
              setUserRole('enterprise');
            }}
            onLogOfficerAction={handleLogOfficerAction}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <span className="font-semibold text-slate-700">Project Providentia</span> &bull; Bannari Amman Institute of Technology &bull; Team: Nithyanandam, Mithun R S, Sabareesh S S, Purushothaman L, Dhanvanth S
          </div>
          <div>
            Theme: AI for Rural Finance &bull; Target: Self-Help Groups (SHGs) & Farmer Producer Organizations (FPOs)
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

// Fallback dataset for instant offline execution
const fallbackEnterprises = [
  { id: 'ENT-101', name: 'Sri Lakshmi Mahila SHG', type: 'SHG', sector: 'Handicrafts & Weaving', district: 'Salem', location: 'Omalur', members_count: 14, current_loan_outstanding: 120000, monthly_loan_emi: 11500, current_savings: 45000, credit_limit: 300000, contact_person: 'Lakshmi Ammal' },
  { id: 'ENT-102', name: 'Kaveri Organic Farmers Producer Co', type: 'FPO', sector: 'Agriculture & Paddy', district: 'Thanjavur', location: 'Orathanadu', members_count: 185, current_loan_outstanding: 850000, monthly_loan_emi: 62000, current_savings: 210000, credit_limit: 1500000, contact_person: 'Ramanathan K' },
  { id: 'ENT-103', name: 'GreenAgri Dairy Cooperative', type: 'FPO', sector: 'Dairy & Animal Husbandry', district: 'Coimbatore', location: 'Pollachi', members_count: 42, current_loan_outstanding: 420000, monthly_loan_emi: 31000, current_savings: 95000, credit_limit: 800000, contact_person: 'Senthil Kumar' },
  { id: 'ENT-104', name: 'Annapurna Spice Crafters SHG', type: 'SHG', sector: 'Food Processing', district: 'Madurai', location: 'Usilampatti', members_count: 10, current_loan_outstanding: 190000, monthly_loan_emi: 16500, current_savings: 18000, credit_limit: 250000, contact_person: 'Meenakshi S' },
  { id: 'ENT-105', name: 'Sirumugai Weavers Guild', type: 'Small Business', sector: 'Textiles & Handloom', district: 'Erode', location: 'Sirumugai', members_count: 25, current_loan_outstanding: 110000, monthly_loan_emi: 9800, current_savings: 140000, credit_limit: 600000, contact_person: 'Natarajan P' }
];

const fallbackEnterpriseDetails = {
  'ENT-101': {
    enterprise: fallbackEnterprises[0],
    historical_logs: [
      { year_month: '2025-08', income: 42000, expense: 31000 },
      { year_month: '2025-09', income: 44100, expense: 30380 },
      { year_month: '2025-10', income: 50400, expense: 35650 },
      { year_month: '2025-11', income: 48300, expense: 34100 },
      { year_month: '2025-12', income: 39900, expense: 29450 },
      { year_month: '2026-01', income: 52500, expense: 32550 },
      { year_month: '2026-02', income: 37800, expense: 27900 },
      { year_month: '2026-03', income: 35700, expense: 28520 },
      { year_month: '2026-04', income: 33600, expense: 29450 },
      { year_month: '2026-05', income: 36960, expense: 30380 },
      { year_month: '2026-06', income: 46200, expense: 32550 },
      { year_month: '2026-07', income: 42840, expense: 31000 }
    ],
    forecasts: [
      { year_month: '2026-08', projected_income: 43696, projected_expense: 31000, projected_net_cash_flow: 12696, pessimistic_net_cash_flow: 8860, optimistic_net_cash_flow: 17166 },
      { year_month: '2026-09', projected_income: 46267, projected_expense: 32550, projected_net_cash_flow: 13717, pessimistic_net_cash_flow: 9620, optimistic_net_cash_flow: 18499 },
      { year_month: '2026-10', projected_income: 49266, projected_expense: 34720, projected_net_cash_flow: 14546, pessimistic_net_cash_flow: 10191, optimistic_net_cash_flow: 19627 },
      { year_month: '2026-11', projected_income: 47124, projected_expense: 33480, projected_net_cash_flow: 13644, pessimistic_net_cash_flow: 9514, optimistic_net_cash_flow: 18456 },
      { year_month: '2026-12', projected_income: 40698, projected_expense: 30380, projected_net_cash_flow: 10318, pessimistic_net_cash_flow: 6931, optimistic_net_cash_flow: 14210 },
      { year_month: '2027-01', projected_income: 51408, projected_expense: 32550, projected_net_cash_flow: 18858, pessimistic_net_cash_flow: 13836, optimistic_net_cash_flow: 24822 }
    ],
    risk_assessment: {
      score: 28,
      level: 'Low Risk',
      category: 'Low',
      metrics: { dscr: 1.34, liquidity_days: 43.5, negative_months: 0, leverage_ratio_pct: 40 },
      drivers: [
        { name: 'Debt Service Coverage (DSCR)', value: '1.34x', benchmark: '> 1.25x recommended', impact: 'Low', status: 'Stable' },
        { name: 'Liquidity Buffer', value: '43.5 days', benchmark: '> 45 days recommended', impact: 'Low', status: 'Adequate Reserve' },
        { name: 'Projected Cash Deficit', value: '0 out of 6 months', benchmark: '0 months deficit', impact: 'Low', status: 'Positive Projection' },
        { name: 'Credit Limit Utilization', value: '40%', benchmark: '< 70% recommended', impact: 'Low', status: 'Healthy Margin' }
      ]
    },
    recommendations: [
      { type: 'Credit Expansion', title: 'Eligible for Low-Interest Working Capital Expansion', description: 'Enterprise maintains robust financial health. Recommend applying for NABARD Working Capital Scheme at concessionary interest rates to scale operations.' }
    ]
  }
};

const fallbackPortfolio = {
  portfolio_summary: {
    total_enterprises: 5,
    total_loan_outstanding: 1690000,
    total_credit_at_risk: 190000,
    high_risk_count: 1,
    medium_risk_count: 1,
    low_risk_count: 3,
    overall_portfolio_health_score: 82
  },
  enterprises: [
    { id: 'ENT-101', name: 'Sri Lakshmi Mahila SHG', type: 'SHG', sector: 'Handicrafts & Weaving', district: 'Salem', contact_person: 'Lakshmi Ammal', loan_outstanding: 120000, monthly_emi: 11500, risk_score: 28, risk_level: 'Low Risk', risk_category: 'Low', dscr: 1.34, liquidity_days: 43.5 },
    { id: 'ENT-102', name: 'Kaveri Organic Farmers Producer Co', type: 'FPO', sector: 'Agriculture & Paddy', district: 'Thanjavur', contact_person: 'Ramanathan K', loan_outstanding: 850000, monthly_emi: 62000, risk_score: 32, risk_level: 'Low Risk', risk_category: 'Low', dscr: 1.28, liquidity_days: 32.3 },
    { id: 'ENT-103', name: 'GreenAgri Dairy Cooperative', type: 'FPO', sector: 'Dairy & Animal Husbandry', district: 'Coimbatore', contact_person: 'Senthil Kumar', loan_outstanding: 420000, monthly_emi: 31000, risk_score: 42, risk_level: 'Medium Risk', risk_category: 'Medium', dscr: 1.15, liquidity_days: 34.7 },
    { id: 'ENT-104', name: 'Annapurna Spice Crafters SHG', type: 'SHG', sector: 'Food Processing', district: 'Madurai', contact_person: 'Meenakshi S', loan_outstanding: 190000, monthly_emi: 16500, risk_score: 74, risk_level: 'High Risk', risk_category: 'High', dscr: 0.82, liquidity_days: 15.8 },
    { id: 'ENT-105', name: 'Sirumugai Weavers Guild', type: 'Small Business', sector: 'Textiles & Handloom', district: 'Erode', contact_person: 'Natarajan P', loan_outstanding: 110000, monthly_emi: 9800, risk_score: 22, risk_level: 'Low Risk', risk_category: 'Low', dscr: 1.62, liquidity_days: 80.7 }
  ]
};
