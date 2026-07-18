import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, ShieldCheck, Lock, Phone, Mail, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginModal() {
  const { login, loginDemo, authError } = useAuth();
  const [tab, setTab] = useState('enterprise'); // 'enterprise' or 'officer'
  const [identifier, setIdentifier] = useState('9443123456');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await login(identifier, password);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setErrorMessage('');
    if (newTab === 'enterprise') {
      setIdentifier('9443123456');
      setPassword('password123');
    } else {
      setIdentifier('officer.salem@nabard.org');
      setPassword('officer123');
    }
  };

  // Demo shortcut login handlers
  const handleQuickDemo = (roleType, entId = null) => {
    if (roleType === 'ENT-101') {
      loginDemo({
        id: 1,
        identifier: '9443123456',
        role: 'ENTERPRISE',
        full_name: 'Lakshmi Ammal (Sri Lakshmi SHG)',
        enterprise_id: 'ENT-101',
        assigned_district: 'Salem'
      });
    } else if (roleType === 'ENT-102') {
      loginDemo({
        id: 2,
        identifier: '9842267890',
        role: 'ENTERPRISE',
        full_name: 'Ramanathan K (Kaveri FPO)',
        enterprise_id: 'ENT-102',
        assigned_district: 'Thanjavur'
      });
    } else if (roleType === 'OFFICER-SALEM') {
      loginDemo({
        id: 3,
        identifier: 'officer.salem@nabard.org',
        role: 'OFFICER',
        full_name: 'S. Sundaram (NABARD Officer - Salem)',
        enterprise_id: null,
        assigned_district: 'Salem'
      });
    } else if (roleType === 'OFFICER-THANJAVUR') {
      loginDemo({
        id: 4,
        identifier: 'officer.thanjavur@nabard.org',
        role: 'OFFICER',
        full_name: 'P. Vignesh (NABARD Officer - Thanjavur)',
        enterprise_id: null,
        assigned_district: 'Thanjavur'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#005A36] text-white p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white font-bold text-base shadow-inner">
            NABARD
          </div>
          <h2 className="text-xl font-bold tracking-tight">Project Providentia</h2>
          <p className="text-xs text-emerald-100/90">
            AI Cash Flow Forecasting & Risk Early-Warning Authentication Portal
          </p>
        </div>

        {/* Dual Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => handleTabSwitch('enterprise')}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center space-x-2 border-b-2 ${
              tab === 'enterprise'
                ? 'border-[#005A36] text-[#005A36] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Rural Enterprise Login</span>
          </button>
          <button
            onClick={() => handleTabSwitch('officer')}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center space-x-2 border-b-2 ${
              tab === 'officer'
                ? 'border-[#005A36] text-[#005A36] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>NABARD Officer Portal</span>
          </button>
        </div>

        {/* Login Form Body */}
        <div className="p-6 space-y-5">
          {(errorMessage || authError) && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
              {errorMessage || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {tab === 'enterprise' ? 'Registered Phone Number' : 'NABARD Official Email'}
              </label>
              <div className="relative">
                {tab === 'enterprise' ? (
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                ) : (
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                )}
                <input
                  type={tab === 'enterprise' ? 'text' : 'email'}
                  required
                  placeholder={tab === 'enterprise' ? 'e.g. 9443123456' : 'e.g. officer@nabard.org'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#005A36]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Security PIN / Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter your security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#005A36]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#005A36] hover:bg-[#004529] text-white font-bold rounded-lg text-xs transition shadow-sm flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Section for Hackathon Presentation */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
              Quick Demo Access Buttons
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => handleQuickDemo('ENT-101')}
                className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 transition text-left space-y-0.5"
              >
                <div className="font-bold text-slate-800 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3 text-[#005A36]" />
                  <span>Sri Lakshmi SHG</span>
                </div>
                <div className="text-slate-500 text-[10px]">Salem District</div>
              </button>

              <button
                onClick={() => handleQuickDemo('ENT-102')}
                className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 transition text-left space-y-0.5"
              >
                <div className="font-bold text-slate-800 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3 text-[#005A36]" />
                  <span>Kaveri FPO</span>
                </div>
                <div className="text-slate-500 text-[10px]">Thanjavur District</div>
              </button>

              <button
                onClick={() => handleQuickDemo('OFFICER-SALEM')}
                className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-left space-y-0.5"
              >
                <div className="font-bold text-slate-800 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>NABARD Officer</span>
                </div>
                <div className="text-slate-500 text-[10px]">Salem Region</div>
              </button>

              <button
                onClick={() => handleQuickDemo('OFFICER-THANJAVUR')}
                className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-left space-y-0.5"
              >
                <div className="font-bold text-slate-800 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>NABARD Officer</span>
                </div>
                <div className="text-slate-500 text-[10px]">Thanjavur Region</div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
