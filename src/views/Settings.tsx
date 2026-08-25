import React from 'react';
import { useStore } from '../context/StoreContext';
import { Save, TrendingUp, ShieldCheck } from 'lucide-react';

export function Settings() {
  const { settings, updateSettings } = useStore();

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let checked = false;
    if (type === 'checkbox') {
      checked = (e.target as HTMLInputElement).checked;
    }
    updateSettings({
      ...settings,
      company: {
        ...settings.company,
        [name]: type === 'checkbox' ? checked : value
      }
    });
  };

  const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateSettings({
      ...settings,
      pricing: {
        ...settings.pricing,
        [name]: parseFloat(value) || 0
      }
    });
  };

  const handleSave = () => {
    alert('Settings saved successfully.');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Application Settings</h1>
      </div>

      {/* Dynamic Pricing & Rules Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Dynamic Pricing & Rules</h2>
            <p className="text-sm text-neutral-500">Configure margins, discounts and bulk thresholds</p>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-blue-100 bg-white rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full opacity-50"></div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>BASE PROFIT</p>
              <h3 className="text-3xl font-bold text-neutral-900 mt-2">{settings.pricing.profitPercent}<span className="text-lg text-neutral-400 font-normal">%</span></h3>
              <p className="text-xs text-neutral-500 mt-2">Applied on top of total factory manufacturing cost.</p>
            </div>
            <div className="border border-emerald-100 bg-white rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full opacity-50"></div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>CASH REWARD</p>
              <h3 className="text-3xl font-bold text-neutral-900 mt-2">{settings.pricing.cashDiscountPercent}<span className="text-lg text-neutral-400 font-normal">%</span></h3>
              <p className="text-xs text-neutral-500 mt-2">For payments cleared within {settings.pricing.validityDays} days.</p>
            </div>
            <div className="border border-indigo-100 bg-white rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-50 rounded-full opacity-50"></div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>VOLUME CAP</p>
              <h3 className="text-3xl font-bold text-neutral-900 mt-2">{settings.pricing.volumeDiscountPercent}<span className="text-lg text-neutral-400 font-normal">%</span></h3>
              <p className="text-xs text-neutral-500 mt-2">Threshold: ₹{settings.pricing.volumeThreshold.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Base Rules */}
            <div className="border border-cyan-100 bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-cyan-500 text-white p-2 rounded-lg"><TrendingUp size={20} /></div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 leading-tight">Base Rules</h3>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Margin & Overhead</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="flex justify-between items-center text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                    Profit Margin <span className="text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">Primary</span>
                  </label>
                  <div className="flex items-center border-b border-neutral-200 py-2">
                    <span className="text-neutral-400 font-medium mr-2">%</span>
                    <input type="number" name="profitPercent" value={settings.pricing.profitPercent} onChange={handlePricingChange} className="w-full text-xl font-bold text-neutral-900 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="flex justify-between items-center text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                    Factory OH <span className="text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">Fixed</span>
                  </label>
                  <div className="flex items-center border-b border-neutral-200 py-2">
                    <span className="text-neutral-400 font-medium mr-2">%</span>
                    <input type="number" name="overheadPercent" value={settings.pricing.overheadPercent} onChange={handlePricingChange} className="w-full text-xl font-bold text-neutral-900 outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Cash Disc. %</label>
                  <div className="flex items-center border-b border-emerald-200 bg-emerald-50/50 px-2 py-2 rounded-t-md">
                    <span className="text-emerald-500 font-medium mr-2">⚡</span>
                    <input type="number" name="cashDiscountPercent" value={settings.pricing.cashDiscountPercent} onChange={handlePricingChange} className="w-full text-xl font-bold text-neutral-900 outline-none bg-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Validity (Days)</label>
                  <div className="flex items-center border-b border-emerald-200 bg-emerald-50/50 px-2 py-2 rounded-t-md">
                    <span className="text-emerald-500 font-medium mr-2">#</span>
                    <input type="number" name="validityDays" value={settings.pricing.validityDays} onChange={handlePricingChange} className="w-full text-xl font-bold text-neutral-900 outline-none bg-transparent" />
                  </div>
                </div>
              </div>
              
              <div className="bg-cyan-50/50 p-4 rounded-lg flex gap-3 items-start border border-cyan-100">
                <span className="text-cyan-500 shrink-0 text-sm">ⓘ</span>
                <p className="text-xs text-neutral-600 italic leading-relaxed">Cash discounts are triggered automatically based on the Payment Terms selected in the quotation engine.</p>
              </div>
            </div>

            {/* Volume Slabs */}
            <div className="bg-[#0f1423] rounded-xl p-6 shadow-lg border border-neutral-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-5 rounded-full blur-3xl"></div>
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500 text-white p-2 rounded-lg"><ShieldCheck size={20} /></div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">Volume Slabs</h3>
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Automatic Discounts</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-neutral-800 text-indigo-300 text-xs font-bold rounded-lg border border-neutral-700 hover:bg-neutral-700 transition-colors uppercase tracking-wider">
                  + Add Level
                </button>
              </div>

              <div className="bg-[#1a1f30] rounded-xl p-4 border border-neutral-700 flex items-center gap-4 relative z-10 shadow-inner">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Baseline Threshold</label>
                  <div className="flex items-center">
                    <span className="text-neutral-500 text-lg mr-2 font-medium">₹</span>
                    <input type="number" name="volumeThreshold" value={settings.pricing.volumeThreshold} onChange={handlePricingChange} className="w-full bg-transparent text-2xl font-bold text-white outline-none" />
                  </div>
                </div>
                <div className="w-24 bg-indigo-500 rounded-lg p-3 text-center shadow-lg shadow-indigo-500/20">
                  <label className="block text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Disc. %</label>
                  <input type="number" name="volumeDiscountPercent" value={settings.pricing.volumeDiscountPercent} onChange={handlePricingChange} className="w-full bg-transparent text-3xl font-bold text-white outline-none text-center" />
                </div>
              </div>
              
              {/* Also placing Wastage & GST here to not lose them from settings, but keeping them visually subtle */}
              <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
                <div>
                   <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Global Wastage %</label>
                   <input type="number" name="wastagePercent" value={settings.pricing.wastagePercent} onChange={handlePricingChange} className="w-full bg-[#1a1f30] border border-neutral-800 rounded p-2 text-white outline-none text-sm" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Default GST %</label>
                   <input type="number" name="gstPercent" value={settings.pricing.gstPercent} onChange={handlePricingChange} className="w-full bg-[#1a1f30] border border-neutral-800 rounded p-2 text-white outline-none text-sm" />
                </div>
              </div>

            </div>
          </div>
        </div>
        
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
           <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-[#0f1423] text-white rounded-lg hover:bg-neutral-800 text-sm font-bold shadow-md transition-all">
            <Save size={16} /> Commit Pricing Strategy
          </button>
        </div>
      </section>

      {/* Company Profile Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Company Profile</h2>
            <p className="text-sm text-neutral-500">This information will appear at the top of your quotations.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Company Logo</span>
            <div className="w-16 h-16 border border-neutral-200 rounded-lg flex items-center justify-center bg-neutral-50 relative overflow-hidden group cursor-pointer">
              <span className="font-bold text-neutral-700 text-xs">LOGO</span>
              <div className="absolute inset-0 bg-black/50 items-center justify-center hidden group-hover:flex">
                <span className="text-white text-[10px] font-bold">UPLOAD</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2">Company Name</label>
              <div className="flex items-center border border-neutral-200 rounded-lg p-3 bg-neutral-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-neutral-400 mr-3">🏢</span>
                <input type="text" name="name" value={settings.company.name} onChange={handleCompanyChange} className="w-full bg-transparent outline-none font-medium text-neutral-800 text-sm" placeholder="Your Company Name" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2">GST Number</label>
              <div className="flex items-center border border-neutral-200 rounded-lg p-3 bg-neutral-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-neutral-400 mr-3">📄</span>
                <input type="text" name="gst" value={settings.company.gst} onChange={handleCompanyChange} className="w-full bg-transparent outline-none font-medium text-neutral-800 text-sm" placeholder="e.g. 08AZHPM1603R1ZZ" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2">Address</label>
            <div className="flex items-start border border-neutral-200 rounded-lg p-3 bg-neutral-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <span className="text-neutral-400 mr-3 mt-0.5">📍</span>
              <textarea name="address" value={settings.company.address} onChange={handleCompanyChange} rows={3} className="w-full bg-transparent outline-none font-medium text-neutral-800 text-sm resize-none" placeholder="Full registered address..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2">Phone Number</label>
              <div className="flex items-center border border-neutral-200 rounded-lg p-3 bg-neutral-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-neutral-400 mr-3">📞</span>
                <input type="text" name="phone" value={settings.company.phone} onChange={handleCompanyChange} className="w-full bg-transparent outline-none font-medium text-neutral-800 text-sm" placeholder="+91 9000000000" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2">Email Address</label>
              <div className="flex items-center border border-neutral-200 rounded-lg p-3 bg-neutral-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-neutral-400 mr-3">✉️</span>
                <input type="text" name="email" value={settings.company.email} onChange={handleCompanyChange} className="w-full bg-transparent outline-none font-medium text-neutral-800 text-sm" placeholder="mail@example.com" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2">Bank Details (Optional)</label>
            <div className="flex items-start border border-neutral-200 rounded-lg p-3 bg-neutral-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <span className="text-neutral-400 mr-3 mt-0.5">🏦</span>
              <textarea name="bankDetails" value={settings.company.bankDetails} onChange={handleCompanyChange} rows={3} className="w-full bg-transparent outline-none font-medium text-neutral-800 text-sm resize-none" placeholder="Bank Name, Account Number, IFSC..." />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-3">Print Settings</label>
            <div className="space-y-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <label className="flex items-center gap-3 text-sm text-neutral-700 cursor-pointer">
                <input type="checkbox" name="hideBankDetails" checked={settings.company.hideBankDetails} onChange={handleCompanyChange} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                Hide Bank Details on Prints
              </label>
              <label className="flex items-center gap-3 text-sm text-neutral-700 cursor-pointer">
                <input type="checkbox" name="hideNotes" checked={settings.company.hideNotes} onChange={handleCompanyChange} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                Hide Notes on Prints
              </label>
              <label className="flex items-center gap-3 text-sm text-neutral-700 cursor-pointer">
                <input type="checkbox" name="hideTerms" checked={settings.company.hideTerms} onChange={handleCompanyChange} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                Hide Terms on Prints
              </label>
            </div>
          </div>

        </div>
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
           <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-[#0f1423] text-white rounded-lg hover:bg-neutral-800 text-sm font-bold shadow-md transition-all">
            <Save size={16} /> Save Company Profile
          </button>
        </div>
      </section>

    </div>
  );
}
