import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, Search } from 'lucide-react';
import authUtils from '../../utils/authUtils';
import { toast } from 'react-toastify';
import { TableSearch } from '../../components/TableControls';
import { secrecyApi } from '../../api/secrecyApi';


const SecrecyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await secrecyApi.getPayments();
      setPayments(data);
    } catch (e) { 
      console.error(e); 
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (payment_id) => {
    try {
      await secrecyApi.processPayment({ payment_id, status: 'Paid' });
      toast.success('Payment processed successfully');
      fetchPayments();
    } catch (e) { 
      toast.error(e.response?.data?.message || 'Failed to process payment'); 
    }
  };

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const query = searchQuery.toLowerCase().trim();

    return payments.filter(p => {
      const setter = (p.setter_name || "").toLowerCase();
      const subject = (p.subject_name || "").toLowerCase();
      const status = (p.status || "").toLowerCase();
      const amount = (p.amount || "").toString();

      return setter.includes(query) || 
             subject.includes(query) || 
             status.includes(query) || 
             amount.includes(query);
    });
  }, [payments, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black  tracking-widest text-[13px]">Loading Payments...</p>
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
        <div className="ml-auto w-64">
          <TableSearch 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search payments..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
          <p className="text-[13px] font-black text-emerald-600 ">Total Payments</p>
          <h3 className="text-3xl font-black text-emerald-700 mt-1">
            ₹{payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString()}
          </h3>
          <p className="text-[13px] font-bold text-emerald-500 mt-1">This month</p>
        </div>
        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
          <p className="text-[13px] font-black text-amber-600 ">Pending Payments</p>
          <h3 className="text-3xl font-black text-amber-700 mt-1">
            ₹{payments.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString()}
          </h3>
          <p className="text-[13px] font-bold text-amber-500 mt-1">{payments.filter(p => p.status !== 'Paid').length} pending</p>
        </div>
        <div className="bg-sky-50/50 p-6 rounded-2xl border border-sky-100">
          <p className="text-[13px] font-black text-sky-600 ">Average per Paper</p>
          <h3 className="text-3xl font-black text-sky-700 mt-1">
            ₹{payments.length > 0 
              ? Math.round(payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) / payments.length).toLocaleString()
              : 0}
          </h3>
          <p className="text-[13px] font-bold text-sky-500 mt-1">Standard rate</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[13px] font-black text-slate-400 ">Paper Setter</th>
              <th className="px-6 py-4 text-[13px] font-black text-slate-400 ">Subject</th>
              <th className="px-6 py-4 text-[13px] font-black text-slate-400 ">Amount</th>
              <th className="px-6 py-4 text-[13px] font-black text-slate-400 ">Status</th>
              <th className="px-6 py-4 text-[13px] font-black text-slate-400 ">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredPayments && filteredPayments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-700 text-sm">{p.setter_name}</td>
                <td className="px-6 py-4 text-slate-500 font-medium text-sm">{p.subject_name}</td>
                <td className="px-6 py-4 font-black text-slate-800 text-sm">₹{Number(p.amount).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[12px] font-black  ${
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
                      className="text-[13px] font-black text-sky-600 hover:text-sky-700 transition-colors decoration-2 underline-offset-4 hover:underline"
                    >
                      Process Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredPayments && filteredPayments.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center">
                   <div className="flex flex-col items-center gap-3">
                     <Search size={40} className="text-slate-200" />
                     <h3 className="text-lg font-black text-slate-900  tracking-tighter">
                       {searchQuery ? "No matching payments found" : "No payments found"}
                     </h3>
                     {searchQuery && (
                       <button 
                         onClick={() => setSearchQuery('')}
                         className="mt-2 text-[13px] font-black text-sky-600 hover:text-sky-700 underline  tracking-widest"
                       >
                         Reset Search
                       </button>
                     )}
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SecrecyPayments;
