import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Layers, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

import { examApi } from '../../api/examApi';

const RoundManagement = () => {
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newRoundName, setNewRoundName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRounds();
    }, []);

    const fetchRounds = async () => {
        try {
            setLoading(true);
            const data = await examApi.getInternalRounds();
            if (data) setRounds(data);
        } catch (error) {
            console.error("Fetch rounds error:", error);
            toast.error("Failed to load exam rounds");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRound = async (e) => {
        e.preventDefault();
        if (!newRoundName.trim()) return;

        try {
            setSaving(true);
            await examApi.createInternalRound({ name: newRoundName });

            toast.success("Exam round created successfully!");
            setNewRoundName('');
            fetchRounds();
        } catch (error) {
            console.error("Create round error:", error);
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                        <Layers className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Assessment Rounds</h1>
                        <p className="text-slate-500 text-sm">Define internal exam rounds like MID-1, MID-2, etc.</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8">
                    <form onSubmit={handleCreateRound} className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Enter Round Name (e.g., MID-1)"
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={newRoundName}
                            onChange={(e) => setNewRoundName(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-200"
                        >
                            {saving ? 'Creating...' : <><Plus size={18} /> Create Round</>}
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-3xl" />
                        ))
                    ) : rounds.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <AlertCircle className="mx-auto text-slate-300 mb-3" size={48} />
                            <p className="text-slate-400 font-medium">No assessment rounds defined yet.</p>
                        </div>
                    ) : (
                        rounds.map((round) => (
                            <div key={round.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold">
                                        {round.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{round.name}</h3>
                                        <p className="text-xs text-slate-400">Created: {new Date(round.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Active
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoundManagement;
