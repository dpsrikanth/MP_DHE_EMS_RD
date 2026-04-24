$content = Get-Content 'd:\MP_DHE_EMS_RD\mp-ems\src\pages\UniversityAdmin\HallApprovals.js' -Raw
$pattern = '(?s)\{/\* Hosting Institutions Section \*/\}\s*<div className=\"mb-5\">\s*<div className=\"flex items-center gap-2 text-\[9px\] font-black text-slate-400 uppercase tracking-widest mb-2\">\s*<Users size=\{11\} \/><span[^>]*>Hosting Institutions<\/span>\s*<\/div>\s+<\/div>'
$replacement = '{/* Hosting Institutions Section */}
                                 <div className="mb-5">
                                     <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                         <Users size={11} /><span>Hosting Institutions</span>
                                     </div>
                                     <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                         {sources && sources.length > 0 ? (
                                             sources.map((src, idx) => (
                                                 <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-[1.25rem] border border-slate-100/50 group-hover:border-purple-200/50 transition-all hover:bg-white hover:shadow-sm">
                                                     <div className="flex items-center gap-3 min-w-0">
                                                         <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)] shrink-0" />
                                                         <span className="text-[11px] font-black text-slate-700 truncate tracking-tight">{src.name}</span>
                                                     </div>
                                                     <div className="flex items-center gap-1.5 shrink-0">
                                                         <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100 whitespace-nowrap tabular-nums">
                                                             {src.count}
                                                         </span>
                                                     </div>
                                                 </div>
                                             ))
                                         ) : (
                                             <div className="py-4 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-1">
                                                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Guests</p>
                                                 <p className="text-[9px] font-bold text-slate-300 tracking-tight">Dedicated Center</p>
                                             </div>
                                         )}
                                     </div>
                                 </div>'

if ($content -match $pattern) {
    $content -replace $pattern, $replacement | Set-Content 'd:\MP_DHE_EMS_RD\mp-ems\src\pages\UniversityAdmin\HallApprovals.js' -NoNewline
    Write-Host "Replacement successful"
} else {
    Write-Host "Pattern not found"
}
