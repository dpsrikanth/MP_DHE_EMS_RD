import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Select, { components } from 'react-select';
import { GraduationCap, ArrowLeft, Check, Search, ChevronDown, MapPin, Map, X } from "lucide-react";
import '../styles/FormPage.css';
import { masterDataApi } from '../api/masterDataApi';

const CheckboxOption = (props) => (
  <components.Option {...props}>
    <div className="flex items-center gap-2">
      <input type="checkbox" checked={props.isSelected} onChange={() => null}
        className="w-4 h-4 rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500 pointer-events-none" />
      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{props.label}</span>
    </div>
  </components.Option>
);

const CollegesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [universities, setUniversities] = useState([]);
  const [form, setForm] = useState({ name: '', college_code: '', address: '', university_id: '', latitude: '', longitude: '' });
  const [masterData, setMasterData] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [universityConfig, setUniversityConfig] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [selectedConfig, setSelectedConfig] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    fetchUniversities(); fetchMasters();
    if (isEditing) loadCollege(id);
    else if (location.state?.universityId) setForm(prev => ({ ...prev, university_id: location.state.universityId }));
  }, [id]);

  const fetchMasters = async () => {
    try {
      const data = await masterDataApi.getMasters();
      if (data) setMasterData(data);
    } catch (err) { console.error('Error fetching masters:', err); }
  };

  const fetchUniversities = async () => {
    try {
      const data = await masterDataApi.getUniversities();
      if (data) {
        setUniversities((data || []).filter(u => u.status === true || u.status === 1 || u.status === '1' || u.status === 'true'));
      }
    } catch (err) { console.error('Error fetching universities:', err); }
  };

  const loadCollege = async (collegeId) => {
    try {
      const data = await masterDataApi.getColleges();
      const college = data.find(c => c.id.toString() === collegeId);
      if (college) {
        setForm({ name: college.college_name || college.name || '', college_code: college.college_code || '', address: college.address || '', university_id: college.university_id || '', latitude: college.latitude || '', longitude: college.longitude || '' });
        fetchCollegeConfig(collegeId);
      } else { toast.error('College not found'); navigate('/colleges'); }
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const fetchUniversityConfig = async (uId) => {
    if (!uId) { setUniversityConfig({ policies: [], programs: [], academicYears: [], semesters: [] }); return; }
    try {
      setIsConfigLoading(true);
      const data = await masterDataApi.getUniversityConfig(uId);
      if (data) setUniversityConfig(data);
    } catch (err) { console.error('Error fetching university config:', err); } finally { setIsConfigLoading(false); }
  };

  const fetchCollegeConfig = async (cId) => {
    try {
      const data = await masterDataApi.getCollegeConfig(cId);
      if (data) {
        setSelectedConfig({ policies: data.policies || [], programs: data.programs || [], academicYears: data.academicYears || [], semesters: data.semesters || [] });
      }
    } catch (err) { console.error('Error fetching college config:', err); }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation is not supported by your browser");
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({ ...prev, latitude: position.coords.latitude.toFixed(8), longitude: position.coords.longitude.toFixed(8) }));
        setDetectingLocation(false); toast.success("Current location captured!");
      },
      (error) => { setDetectingLocation(false); toast.error("Failed to retrieve location: " + error.message); },
      { enableHighAccuracy: true }
    );
  };

  const handleGeocode = async () => {
    if (!form.address) return toast.warning("Please enter an address first");
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}&limit=1`);
      if (!res.ok) throw new Error("Geocoding service unavailable");
      const data = await res.json();
      if (data && data.length > 0) {
        setForm(prev => ({ ...prev, latitude: parseFloat(data[0].lat).toFixed(8), longitude: parseFloat(data[0].lon).toFixed(8) }));
        toast.success("Coordinates found from address!");
      } else { toast.error("Could not find coordinates for this address."); }
    } catch (err) { toast.error("Geocoding error: " + err.message); } finally { setGeocoding(false); }
  };

  useEffect(() => { if (form.university_id) fetchUniversityConfig(form.university_id); }, [form.university_id]);

  const handleSave = async () => {
    try {
      setSavingConfig(true);
      if (!form.name || !form.university_id) { setSavingConfig(false); return toast.warning('College name and university are required'); }
      
      let savedCollege;
      if (isEditing) {
        savedCollege = await masterDataApi.updateCollege(id, form);
      } else {
        savedCollege = await masterDataApi.createCollege(form);
      }
      
      const collegeId = isEditing ? id : savedCollege.id;
      if (collegeId) {
        await masterDataApi.updateCollegeConfig(collegeId, selectedConfig);
      }
      
      toast.success(savedCollege.message || (isEditing ? 'College updated successfully!' : 'College added successfully!'));
      navigate('/colleges');
    } catch (err) { toast.error('Error: ' + (err.response?.data?.message || err.message)); } finally { setSavingConfig(false); }
  };

  if (loading) return (
    <div className="form-loading"><div className="form-loading__spinner"></div><p className="form-loading__text">Loading College Profile...</p></div>
  );

  return (
    <div className="form-page form-page--wide">
      {showMapModal && (
        <MapPickerModal 
          onClose={() => setShowMapModal(false)}
          onConfirm={(lat, lon) => { setForm(prev => ({ ...prev, latitude: lat, longitude: lon })); setShowMapModal(false); toast.success("Location updated via Map!"); }}
          initialLat={form.latitude} initialLon={form.longitude}
        />
      )}
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button onClick={() => navigate('/colleges')} className="form-header__back"><ArrowLeft size={20} /></button>
            <div className="form-header__icon"><GraduationCap size={22} /></div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Collegiate Institutional Profile' : 'Institutional Registration'}</h2>
              <p>Academic & Geographical Configuration</p>
            </div>
          </div>
          <div className="form-header__right">
              <span className="text-[12px] font-black text-indigo-400  tracking-widest bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                Infrastructure Module v3.1
              </span>
          </div>
        </div>

        {/* Body */}
        <div className="form-body">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Left Column: Essential Details (5 cols) */}
            <div className="xl:col-span-5 space-y-10">
              <div className="form-section">
                <div className="form-section__title"><span>Administrative Identity</span></div>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="form-field col-span-1">
                      <label className="form-label">Code</label>
                      <input type="number" placeholder="000" value={form.college_code} onChange={(e) => setForm({ ...form, college_code: e.target.value })} className="form-input font-bold" />
                    </div>
                    <div className="form-field col-span-2">
                      <label className="form-label form-label--required">Official Designation</label>
                      <input type="text" placeholder="e.g. Science & Technology Institute" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label form-label--required">Governing University</label>
                    <select value={form.university_id} onChange={(e) => setForm({ ...form, university_id: e.target.value })} className="form-select">
                      <option value="">Select Higher Institution</option>
                      {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section__title"><span>Physical Placement</span></div>
                <div className="space-y-6">
                   <div className="form-field">
                      <div className="flex items-center justify-between mb-2">
                        <label className="form-label m-0">Institutional Address</label>
                        <button type="button" onClick={handleGeocode} disabled={geocoding || !form.address} 
                          className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[12px] font-black  tracking-widest hover:bg-emerald-100 transition-colors">
                          <Search size={10} className="inline mr-1" /> {geocoding ? "Resolving..." : "Geocode Address"}
                        </button>
                      </div>
                      <textarea placeholder="Physical location details..." rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-textarea resize-none" />
                   </div>

                   <div className="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-slate-100 space-y-6">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[12px] font-black text-slate-400  tracking-[0.2em]">Geolocation Engine</h4>
                         <div className="flex gap-2">
                            <button type="button" onClick={handleDetectLocation} disabled={detectingLocation} className="p-2 bg-white border border-slate-200 text-indigo-500 rounded-lg hover:bg-indigo-50 transition-all shadow-sm">
                               <MapPin size={14} />
                            </button>
                            <button type="button" onClick={() => setShowMapModal(true)} className="p-2 bg-white border border-slate-200 text-indigo- rounded-lg hover:bg-indigo- transition-all shadow-sm">
                               <Map size={14} />
                            </button>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-field">
                          <label className="form-label text-[12px]">Latitude</label>
                          <input type="text" placeholder="0.000000" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="form-input bg-white font-mono text-[13px]" />
                        </div>
                        <div className="form-field">
                          <label className="form-label text-[12px]">Longitude</label>
                          <input type="text" placeholder="0.000000" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="form-input bg-white font-mono text-[13px]" />
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Column: Configuration & Mapping (7 cols) */}
            <div className="xl:col-span-7 space-y-10">
              <div className="form-section h-full">
                <div className="form-section__title"><span>Capabilities & Mapping</span></div>
                
                <div className="form-section-card bg-white border-2 border-slate-50 shadow-xl shadow-slate-200/20 rounded-[2.5rem] p-10 h-full">
                  {!form.university_id ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <GraduationCap size={40} />
                      </div>
                      <p className="text-sm font-black text-slate-300  tracking-widest leading-relaxed">
                        Designate a University to<br/>Synchronize Available Configs
                      </p>
                    </div>
                  ) : isConfigLoading ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-[12px] font-black text-indigo-400  tracking-widest">Bridging Models...</p>
                    </div>
                  ) : (
                    <div className="space-y-10 py-4">
                      <div className="form-field">
                        <label className="form-label flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                           Policy Framework
                        </label>
                        <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }}
                          options={masterData.policies.filter(p => universityConfig.policies.includes(p.id)).map(p => ({ value: p.id, label: p.name }))} 
                          value={selectedConfig.policies.map(id => ({ value: id, label: masterData.policies.find(p => p.id === id)?.name || id }))}
                          onChange={(vals) => setSelectedConfig({ ...selectedConfig, policies: vals.map(v => v.value) })}
                          className="form-react-select" classNamePrefix="react-select" />
                      </div>

                      <div className="form-field">
                        <label className="form-label flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                           Academic Programs
                        </label>
                        <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }}
                          options={masterData.programs.filter(p => universityConfig.programs.includes(p.id)).map(p => ({ value: p.id, label: p.name }))}
                          value={selectedConfig.programs.map(id => ({ value: id, label: masterData.programs.find(p => p.id === id)?.name || id }))}
                          onChange={(vals) => setSelectedConfig({ ...selectedConfig, programs: vals.map(v => v.value) })}
                          className="form-react-select" classNamePrefix="react-select" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="form-field">
                          <label className="form-label flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-indigo- rounded-full"></span>
                             Academic Years
                          </label>
                          <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }}
                            options={masterData.academicYears.filter(ay => universityConfig.academicYears.includes(ay.id)).map(ay => ({ value: ay.id, label: ay.year_name }))}
                            value={selectedConfig.academicYears.map(id => ({ value: id, label: masterData.academicYears.find(ay => ay.id === id)?.year_name || id }))}
                            onChange={(vals) => setSelectedConfig({ ...selectedConfig, academicYears: vals.map(v => v.value) })}
                            className="form-react-select" classNamePrefix="react-select" />
                        </div>
                        <div className="form-field">
                          <label className="form-label flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-indigo- rounded-full"></span>
                             Semester Control
                          </label>
                          <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }}
                            options={masterData.semesters.filter(s => universityConfig.semesters.includes(s.id)).map(s => ({ value: s.id, label: s.semester_name }))}
                            value={selectedConfig.semesters.map(id => ({ value: id, label: masterData.semesters.find(s => s.id === id)?.semester_name || id }))}
                            onChange={(vals) => setSelectedConfig({ ...selectedConfig, semesters: vals.map(v => v.value) })}
                            className="form-react-select" classNamePrefix="react-select" />
                        </div>
                      </div>

                      <div className="p-8 bg-indigo-900 rounded-[2rem] text-white relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-all duration-700"></div>
                         <p className="relative z-10 text-[12px] font-black  tracking-[0.2em] text-indigo-300 mb-2">Notice</p>
                         <p className="relative z-10 text-[13px] font-medium leading-relaxed opacity-80">
                           Selected configurations must align with the governing University's master framework to maintain institutional synchronization.
                         </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="button" className="form-btn-cancel" onClick={() => navigate('/colleges')}>Discard Changes</button>
          <button type="button" onClick={handleSave} disabled={savingConfig} className="form-btn-submit">
            {savingConfig ? <div className="form-spinner"></div> : <Check size={20} />}
            <span>{savingConfig ? 'Processing Record...' : (isEditing ? 'Commit Profile Changes' : 'Initialize Collegiate Profile')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Map Picker Modal Component ---
const MapPickerModal = ({ onClose, onConfirm, initialLat, initialLon }) => {
  const [loading, setLoading] = useState(true);
  const mapRef = React.useRef(null);
  const [markerCoords, setMarkerCoords] = useState({ lat: parseFloat(initialLat) || 22.9734, lon: parseFloat(initialLon) || 78.6569 });

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
    }
    const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true; script.onload = () => { setLoading(false); setTimeout(initMap, 100); };
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const initMap = () => {
    if (!window.L) return; const L = window.L;
    const map = L.map('map-container').setView([markerCoords.lat, markerCoords.lon], 13);
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    const marker = L.marker([markerCoords.lat, markerCoords.lon], { draggable: true }).addTo(map);
    map.on('click', (e) => { const { lat, lng } = e.latlng; marker.setLatLng([lat, lng]); setMarkerCoords({ lat, lon: lng }); });
    marker.on('dragend', (e) => { const { lat, lng } = e.target.getLatLng(); setMarkerCoords({ lat, lon: lng }); });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: '56rem', height: '85vh', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e8eaee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div className="form-header__icon" style={{ width: '2.5rem', height: '2.5rem' }}><Map size={18} /></div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Interactive Map Picker</h3>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: '', letterSpacing: '0.08em', margin: '0.15rem 0 0' }}>Select college location precisely</p>
            </div>
          </div>
          <button onClick={onClose} className="form-header__back" style={{ width: '2.25rem', height: '2.25rem' }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, position: 'relative', background: '#f1f5f9' }}>
          {loading && (
            <div className="form-loading" style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}>
              <div className="form-loading__spinner"></div>
              <p className="form-loading__text">Initialising Map...</p>
            </div>
          )}
          <div id="map-container" style={{ width: '100%', height: '100%' }}></div>
          <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', padding: '0.85rem 1.25rem', borderRadius: '14px', boxShadow: '0 4px 16px rgba(0,0,0,.08)', display: 'flex', gap: '1.5rem' }}>
              <div><p style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: '', letterSpacing: '0.1em', margin: 0 }}>Latitude</p><p style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', margin: '2px 0 0' }}>{markerCoords.lat.toFixed(8)}</p></div>
              <div style={{ width: '1px', height: '2rem', background: '#e2e8f0', alignSelf: 'center' }}></div>
              <div><p style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: '', letterSpacing: '0.1em', margin: 0 }}>Longitude</p><p style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', margin: '2px 0 0' }}>{markerCoords.lon.toFixed(8)}</p></div>
            </div>
            <button onClick={() => onConfirm(markerCoords.lat.toFixed(8), markerCoords.lon.toFixed(8))} className="form-btn-submit" style={{ padding: '0.85rem 2rem' }}>
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegesForm;
