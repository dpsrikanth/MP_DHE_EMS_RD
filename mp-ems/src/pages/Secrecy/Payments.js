import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import authUtils from '../../utils/authUtils';
import { toast } from 'react-toastify';

const SecrecyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/secrecy/payments`, {
        headers: authUtils.getAuthHeader()
      });
      if (res.ok) setPayments(await res.json());
    } catch (e) { 
      console.error(e); 
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (payment_id) => {
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/secrecy/payments/process`, {
        method: 'POST',
        headers: { ...authUtils.getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id, status: 'Paid' })
      });
      if (res.ok) {
        toast.success('Payment processed successfully');
        fetchPayments();
      } else {
        toast.error('Failed to process payment');
      }
    } catch (e) { toast.error('Network error'); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Payments...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/30 min-h-screen pb-20 fade-in duration-500 animate-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <CreditCard size={32} className="text-sky-500" />
        <div>
          <h2 className="text-2xl font-black text-slate-800 italic">Payment Management</h2>
          <p className="text-slate-500 text-sm font-medium">Manage and process paper setter payments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
          <p className="text-xs font-black text-emerald-600 uppercase">Total Payments</p>
          <h3 className="text-3xl font-black text-emerald-700 mt-1">
            ₹{payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString()}
          </h3>
          <p className="text-xs font-bold text-emerald-500 mt-1">This month</p>
        </div>
        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
          <p className="text-xs font-black text-amber-600 uppercase">Pending Payments</p>
          <h3 className="text-3xl font-black text-amber-700 mt-1">
            ₹{payments.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString()}
          </h3>
          <p className="text-xs font-bold text-amber-500 mt-1">{payments.filter(p => p.status !== 'Paid').length} pending</p>
        </div>
        <div className="bg-sky-50/50 p-6 rounded-2xl border border-sky-100">
          <p className="text-xs font-black text-sky-600 uppercase">Average per Paper</p>
          <h3 className="text-3xl font-black text-sky-700 mt-1">
            ₹{payments.length > 0 
              ? Math.round(payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) / payments.length).toLocaleString()
              : 0}
          </h3>
          <p className="text-xs font-bold text-sky-500 mt-1">Standard rate</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Paper Setter</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Subject</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Amount</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {payments && payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-700 text-sm">{p.setter_name}</td>
                <td className="px-6 py-4 text-slate-500 font-medium text-sm">{p.subject_name}</td>
                <td className="px-6 py-4 font-black text-slate-800 text-sm">₹{Number(p.amount).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                    p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                    p.status === 'Processing' ? 'bg-blue-100 text-blue-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {p.status !== 'Paid' && (
                    <button 
                      onClick={() => handleProcessPayment(p.id)}
                      className="text-xs font-black text-sky-600 hover:text-sky-700 transition-colors decoration-2 underline-offset-4 hover:underline"
                    >
                      Process Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {payments && payments.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-bold">No payments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SecrecyPayments;
