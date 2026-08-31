import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { CompanySettings, PricingSettings } from "../types";
import {
  Save,
  TrendingUp,
  ShieldCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTenant } from "../contexts/TenantContext";

export function Settings() {
  const { settings, updateSettings } = useStore();
  const { changePassword, deleteAccount } = useAuth();
  const { updateTenant } = useTenant();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    setIsDeletingAccount(true);
    setDeleteError("");
    try {
      await deleteAccount();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account");
      setIsDeletingAccount(false);
    }
  };

  const handleCompanyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    let checked = false;
    if (type === "checkbox") {
      checked = (e.target as HTMLInputElement).checked;
    }
    const defaultCompany: CompanySettings = {
      name: '',
      gst: '',
      address: '',
      phone: '',
      email: '',
      bankDetails: '',
      hideBankDetails: false,
      hideNotes: false,
      hideTerms: false,
    };
    updateSettings({
      ...settings,
      company: {
        ...defaultCompany,
        ...(settings.company || {}),
        [name]: type === "checkbox" ? checked : value,
      },
    });
  };

  const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const defaultPricing: PricingSettings = {
      wastagePercent: 10,
      overheadPercent: 5,
      profitPercent: 23,
      gstPercent: 18,
      cashDiscountPercent: 2,
      validityDays: 7,
      volumeThreshold: 1000000,
      volumeDiscountPercent: 3,
    };
    updateSettings({
      ...settings,
      pricing: {
        ...defaultPricing,
        ...(settings.pricing || {}),
        [name]: parseFloat(value) || 0,
      },
    });
  };

  const handleSavePricing = () => {
    alert("Pricing strategy saved successfully.");
  };

  const handleSaveCompanyProfile = async () => {
    try {
      await updateTenant({
        name: (settings.company || {}).name,
        email: (settings.company || {}).email,
        phone: (settings.company || {}).phone,
        address: (settings.company || {}).address,
        updatedAt: new Date().toISOString()
      });
      alert("Company profile saved successfully.");
    } catch (err) {
      alert("Failed to save company profile.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");
    setPwdLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwdSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPwdError(err.message || "Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Application Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure pricing rules, company profile, and security preferences.
          </p>
        </div>
      </div>

      {/* Dynamic Pricing & Rules Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Dynamic Pricing & Rules
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Configure margins, discounts and bulk thresholds
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div className="border border-blue-100 bg-white rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full opacity-50"></div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                BASE PROFIT
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5">
                {(settings.pricing || {}).profitPercent}
                <span className="text-base text-slate-400 font-normal">%</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Applied on top of factory cost.
              </p>
            </div>
            <div className="border border-emerald-100 bg-white rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full opacity-50"></div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                CASH REWARD
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5">
                {(settings.pricing || {}).cashDiscountPercent}
                <span className="text-base text-slate-400 font-normal">%</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1.5">
                For payments in {(settings.pricing || {}).validityDays} days.
              </p>
            </div>
            <div className="border border-indigo-100 bg-white rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-50 rounded-full opacity-50"></div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                VOLUME CAP
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5">
                {(settings.pricing || {}).volumeDiscountPercent}
                <span className="text-base text-slate-400 font-normal">%</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Threshold: ₹{(settings.pricing || {}).volumeThreshold.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Base Rules */}
            <div className="border border-slate-200 bg-white rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-cyan-500 text-white p-2 rounded-lg">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Base Rules
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Margin & Overhead
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-5">
                <div>
                  <label className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Profit Margin
                    <span className="text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded text-[9px]">
                      Primary
                    </span>
                  </label>
                  <div className="flex items-center border-b border-slate-200 py-1.5">
                    <span className="text-slate-400 font-medium mr-2">%</span>
                    <input
                      type="number"
                      name="profitPercent"
                      value={(settings.pricing || {}).profitPercent}
                      onChange={handlePricingChange}
                      className="w-full text-lg sm:text-xl font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Factory OH
                    <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[9px]">
                      Fixed
                    </span>
                  </label>
                  <div className="flex items-center border-b border-slate-200 py-1.5">
                    <span className="text-slate-400 font-medium mr-2">%</span>
                    <input
                      type="number"
                      name="overheadPercent"
                      value={(settings.pricing || {}).overheadPercent}
                      onChange={handlePricingChange}
                      className="w-full text-lg sm:text-xl font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-5">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1.5">
                    Cash Disc. %
                  </label>
                  <div className="flex items-center border-b border-emerald-200 bg-emerald-50/50 px-2 py-1.5 rounded-t-md">
                    <span className="text-emerald-500 font-medium mr-1.5 text-xs">
                      ⚡
                    </span>
                    <input
                      type="number"
                      name="cashDiscountPercent"
                      value={(settings.pricing || {}).cashDiscountPercent}
                      onChange={handlePricingChange}
                      className="w-full text-lg sm:text-xl font-bold text-slate-900 outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1.5">
                    Validity (Days)
                  </label>
                  <div className="flex items-center border-b border-emerald-200 bg-emerald-50/50 px-2 py-1.5 rounded-t-md">
                    <span className="text-emerald-500 font-medium mr-1.5 text-xs">#</span>
                    <input
                      type="number"
                      name="validityDays"
                      value={(settings.pricing || {}).validityDays}
                      onChange={handlePricingChange}
                      className="w-full text-lg sm:text-xl font-bold text-slate-900 outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-cyan-50/60 p-3.5 rounded-xl flex gap-2.5 items-start border border-cyan-100">
                <span className="text-cyan-600 shrink-0 text-xs mt-0.5">ⓘ</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cash discounts are applied based on the Payment Terms selected in the quotation engine.
                </p>
              </div>
            </div>

            {/* Volume Slabs */}
            <div className="bg-[#0f1423] rounded-xl p-4 sm:p-6 shadow-lg border border-neutral-800 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500 text-white p-2 rounded-lg">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                        Volume Slabs
                      </h3>
                      <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                        Automatic Discounts
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1f30] rounded-xl p-3.5 sm:p-4 border border-neutral-700 flex items-center gap-3 sm:gap-4 relative z-10 shadow-inner">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
                      Baseline Threshold
                    </label>
                    <div className="flex items-center">
                      <span className="text-neutral-500 text-base sm:text-lg mr-1.5 font-medium">
                        ₹
                      </span>
                      <input
                        type="number"
                        name="volumeThreshold"
                        value={(settings.pricing || {}).volumeThreshold}
                        onChange={handlePricingChange}
                        className="w-full bg-transparent text-xl sm:text-2xl font-bold text-white outline-none"
                      />
                    </div>
                  </div>
                  <div className="w-20 sm:w-24 bg-indigo-500 rounded-xl p-2.5 sm:p-3 text-center shadow-lg shadow-indigo-500/20 shrink-0">
                    <label className="block text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-1">
                      Disc. %
                    </label>
                    <input
                      type="number"
                      name="volumeDiscountPercent"
                      value={(settings.pricing || {}).volumeDiscountPercent}
                      onChange={handlePricingChange}
                      className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-white outline-none text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Wastage & GST */}
              <div className="mt-6 grid grid-cols-2 gap-3.5 relative z-10">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    Global Wastage %
                  </label>
                  <input
                    type="number"
                    name="wastagePercent"
                    value={(settings.pricing || {}).wastagePercent}
                    onChange={handlePricingChange}
                    className="w-full bg-[#1a1f30] border border-neutral-800 rounded-lg p-2 text-white outline-none text-xs sm:text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    Default GST %
                  </label>
                  <input
                    type="number"
                    name="gstPercent"
                    value={(settings.pricing || {}).gstPercent}
                    onChange={handlePricingChange}
                    className="w-full bg-[#1a1f30] border border-neutral-800 rounded-lg p-2 text-white outline-none text-xs sm:text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSavePricing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f1423] text-white rounded-xl hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-md transition-all"
          >
            <Save size={15} /> Commit Pricing Strategy
          </button>
        </div>
      </section>

      {/* Company Profile Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Company Profile
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              This information will appear at the top of your quotations.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Company Name
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">🏢</span>
                <input
                  type="text"
                  name="name"
                  value={(settings.company || {}).name}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="Your Company Name"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                GST Number
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">📄</span>
                <input
                  type="text"
                  name="gst"
                  value={(settings.company || {}).gst}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="e.g. 08AZHPM1603R1ZZ"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Address
            </label>
            <div className="flex items-start border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <span className="text-slate-400 mr-2.5 mt-0.5 text-sm">📍</span>
              <textarea
                name="address"
                value={(settings.company || {}).address}
                onChange={handleCompanyChange}
                rows={2}
                className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm resize-none"
                placeholder="Full registered address..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">📞</span>
                <input
                  type="text"
                  name="phone"
                  value={(settings.company || {}).phone}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="+91 9000000000"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">✉️</span>
                <input
                  type="text"
                  name="email"
                  value={(settings.company || {}).email}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="mail@example.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Bank Details (Optional)
            </label>
            <div className="flex items-start border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <span className="text-slate-400 mr-2.5 mt-0.5 text-sm">🏦</span>
              <textarea
                name="bankDetails"
                value={(settings.company || {}).bankDetails}
                onChange={handleCompanyChange}
                rows={2}
                className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm resize-none"
                placeholder="Bank Name, Account Number, IFSC..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Print Settings
            </label>
            <div className="space-y-2.5 p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  name="hideBankDetails"
                  checked={(settings.company || {}).hideBankDetails}
                  onChange={handleCompanyChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Hide Bank Details on Prints
              </label>
              <label className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  name="hideNotes"
                  checked={(settings.company || {}).hideNotes}
                  onChange={handleCompanyChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Hide Notes on Prints
              </label>
              <label className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  name="hideTerms"
                  checked={(settings.company || {}).hideTerms}
                  onChange={handleCompanyChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Hide Terms on Prints
              </label>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSaveCompanyProfile}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f1423] text-white rounded-xl hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-md transition-all"
          >
            <Save size={15} /> Save Company Profile
          </button>
        </div>
      </section>

      {/* Security & Password Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock size={18} className="text-slate-500" /> Security Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Update your account password and security preferences.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
            {pwdError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs sm:text-sm border border-red-200 flex items-start gap-2">
                <AlertCircle
                  size={16}
                  className="text-red-600 mt-0.5 flex-shrink-0"
                />
                <div>{pwdError}</div>
              </div>
            )}
            {pwdSuccess && (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs sm:text-sm border border-emerald-200 flex items-start gap-2">
                <CheckCircle2
                  size={16}
                  className="text-emerald-600 mt-0.5 flex-shrink-0"
                />
                <div>{pwdSuccess}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
                placeholder="••••••••"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Must be at least 8 characters.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 disabled:opacity-70 shadow-md shadow-blue-500/20 transition-colors"
              >
                {pwdLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-red-600 mb-2">Danger Zone</h3>
            <p className="text-xs text-slate-500 mb-4">
              Permanently delete your personal account and remove your data from this workspace.
            </p>
            {deleteError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs sm:text-sm border border-red-200 mb-4 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>{deleteError}</div>
              </div>
            )}
            <button
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="inline-flex items-center justify-center bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-red-50 disabled:opacity-70 transition-colors"
            >
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
