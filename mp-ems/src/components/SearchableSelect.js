import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

// Lightweight searchable dropdown (no external dependency).
const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    getLabel,
    getValue,
    className = ''
}) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = options.find(o => String(getValue(o)) === String(value));
    const filtered = options.filter(o => getLabel(o).toLowerCase().includes(query.toLowerCase()));

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 flex items-center justify-between focus:ring-2 focus:ring-indigo-500/20"
            >
                <span className={selected ? '' : 'text-slate-400'}>{selected ? getLabel(selected) : placeholder}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-30 mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3">
                            <Search size={14} className="text-slate-400" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full bg-transparent border-none py-2 text-sm focus:ring-0 outline-none font-medium"
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {filtered.length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-400 font-medium">No matches</div>
                        )}
                        {filtered.map(o => {
                            const val = getValue(o);
                            const isSel = String(val) === String(value);
                            return (
                                <button
                                    type="button"
                                    key={val}
                                    onClick={() => { onChange(String(val)); setOpen(false); setQuery(''); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${isSel ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {getLabel(o)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
