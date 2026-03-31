import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Select, { components } from 'react-select';
import { GraduationCap, ArrowLeft, Check, Search, ChevronDown, MapPin, Map, X } from "lucide-react";

const CheckboxOption = (props) => {
  return (
    <div>
      <components.Option {...props}>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={props.isSelected}
            onChange={() => null}
            className="w-4 h-4 text-indigo-500 border-slate-300 rounded focus:ring-indigo-500 pointer-events-none"
          />
          <span className="text-sm font-medium">{props.label}</span>
        </div>
      </components.Option>
    </div>
  );
};

const CollegesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [dataLoading, setDataLoading] = useState(false);
  
  const [universities, setUniversities] = useState([]);
  const [form, setForm] = useState({ 
    name: '', 
    college_code: '', 
    address: '', 
    university_id: '',
    latitude: '',
    longitude: ''
  });

  // Config Mapping State
  const [masterData, setMasterData] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [universityConfig, setUniversityConfig] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [selectedConfig, setSelectedConfig] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    fetchUniversities();
    fetchMasters();
    if (isEditing) {
      loadCollege(id);
    } else if (location.state && location.state.universityId) {
      setForm(prev => ({ ...prev, university_id: location.state.universityId }));
    }
  }, [id]);

  const fetchMasters = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/masters', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMasterData(await res.json());
    } catch (err) {
      console.error('Error fetching masters:', err);
    }
  };

  const fetchUniversities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/universities', { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setUniversities((data || []).filter(u => u.status === true || u.status === 1 || u.status === '1' || u.status === 'true'));
      }
    } catch (err) {
      console.error('Error fetching universities:', err);
    }
  };

  const loadCollege = async (collegeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/colleges', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch colleges');
      const data = await response.json();
      const college = data.find(c => c.id.toString() === collegeId);
      
      if (college) {
        setForm({
          name: college.college_name || college.name || '',
          college_code: college.college_code || '',
          address: college.address || '',
          university_id: college.university_id || '',
          latitude: college.latitude || '',
          longitude: college.longitude || ''
        });
        fetchCollegeConfig(collegeId);
      } else {
        toast.error('College not found');
        navigate('/colleges');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversityConfig = async (uId) => {
    if (!uId) {
      setUniversityConfig({ policies: [], programs: [], academicYears: [], semesters: [] });
      return;
    }
    try {
      setIsConfigLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/universities/${uId}/config`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUniversityConfig(await res.json());
    } catch (err) {
      console.error('Error fetching university config:', err);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const fetchCollegeConfig = async (cId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/colleges/${cId}/config`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSelectedConfig({
          policies: data.policies || [],
          programs: data.programs || [],
          academicYears: data.academicYears || [],
          semesters: data.semesters || []
        });
      }
    } catch (err) {
      console.error('Error fetching college config:', err);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      return toast.error("Geolocation is not supported by your browser");
    }
    
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(8),
          longitude: position.coords.longitude.toFixed(8)
        }));
        setDetectingLocation(false);
        toast.success("Current location captured!");
      },
      (error) => {
        setDetectingLocation(false);
        toast.error("Failed to retrieve location: " + error.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleGeocode = async () => {
    if (!form.address) return toast.warning("Please enter an address first");
    
    setGeocoding(true);
    try {
      // Using OpenStreetMap Nominatim API (Free)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}&limit=1`);
      if (!res.ok) throw new Error("Geocoding service unavailable");
      
      const data = await res.json();
      if (data && data.length > 0) {
        setForm(prev => ({
          ...prev,
          latitude: parseFloat(data[0].lat).toFixed(8),
          longitude: parseFloat(data[0].lon).toFixed(8)
        }));
        toast.success("Coordinates found from address!");
      } else {
        toast.error("Could not find coordinates for this address. Please try refining it or detect current location.");
      }
    } catch (err) {
      toast.error("An error occurred during geocoding: " + err.message);
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (form.university_id) {
      fetchUniversityConfig(form.university_id);
    }
  }, [form.university_id]);

  const handleSave = async () => {
    try {
      setSavingConfig(true);
      const token = localStorage.getItem('token');
      if (!form.name || !form.university_id) {
        setSavingConfig(false);
        return toast.warning('College name and university are required');
      }

      const url = isEditing ? `http://localhost:8080/api/colleges/${id}` : 'http://localhost:8080/api/colleges';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });

      if (!response.ok) throw new Error('Failed to save');
      const savedCollege = await response.json();
      const collegeId = isEditing ? id : savedCollege.id;

      await fetch(`http://localhost:8080/api/colleges/${collegeId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(selectedConfig)
      });
      
      toast.success(savedCollege.message || (isEditing ? 'College updated successfully!' : 'College added successfully!'));
      navigate('/colleges');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Loading Identity Configuration...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {showMapModal && (
        <MapPickerModal 
          onClose={() => setShowMapModal(false)}
          onConfirm={(lat, lon) => {
            setForm(prev => ({ ...prev, latitude: lat, longitude: lon }));
            setShowMapModal(false);
            toast.success("Location updated via Map!");
          }}
          initialLat={form.latitude}
          initialLon={form.longitude}
        />
      )}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/colleges')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner">
              <GraduationCap size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {isEditing ? 'Edit College' : 'Register New College'}
              </h2>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Departmental settings and affiliation details</p>
            </div>
          </div>
        </div>
            
        {/* Body */}
        <div className="flex-1 px-10 py-10 space-y-10 bg-slate-50/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-4 h-px bg-slate-200"></span> Identity
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Code</label>
                  <input 
                    type="number" 
                    placeholder="000" 
                    value={form.college_code} 
                    onChange={(e) => setForm({ ...form, college_code: e.target.value })}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">College Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Science College" 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Affiliated University</label>
                <div className="relative">
                  <select 
                    value={form.university_id} 
                    onChange={(e) => setForm({ ...form, university_id: e.target.value })}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 focus:bg-white focus:border-indigo-500 outline-none appearance-none transition-all font-semibold"
                  >
                    <option value="">Choose Parent Institution</option>
                    {universities.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-slate-700">Address</label>
                  <button 
                    onClick={handleGeocode}
                    disabled={geocoding || !form.address}
                    className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg transition-all disabled:opacity-50"
                  >
                    <Search size={12} />
                    {geocoding ? "Resolving..." : "Fetch Coordinates"}
                  </button>
                </div>
                <textarea 
                  placeholder="Street, City, Pin Code" 
                  rows={3}
                  value={form.address} 
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                />
              </div>

              {/* Dynamic Location Section */}
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-px bg-slate-200"></span> Proximity Engine
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full transition-all active:scale-95"
                    >
                      <MapPin size={12} />
                      {detectingLocation ? "Locating..." : "Auto-Detect"}
                    </button>
                    <button 
                      onClick={() => setShowMapModal(true)}
                      className="text-[10px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-700 flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-full transition-all active:scale-95"
                    >
                      <Map size={12} />
                      Pick on Map
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wide">Latitude</label>
                    <input 
                      type="text" 
                      placeholder="0.00000000" 
                      value={form.latitude} 
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-800 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wide">Longitude</label>
                    <input 
                      type="text" 
                      placeholder="0.00000000" 
                      value={form.longitude} 
                      onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-800 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-white rounded-[2.5rem] p-8 border-2 border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-4 h-px bg-slate-200"></span> Capability Mapping
              </h3>
              
              {!form.university_id ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                    <Search size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 max-w-[200px]">Select a university to see available configurations</p>
                </div>
              ) : isConfigLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Bridging Models...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Policies</label>
                    <Select 
                      isMulti 
                      hideSelectedOptions={false}
                      closeMenuOnSelect={false}
                      components={{ Option: CheckboxOption }}
                      options={masterData.policies.filter(p => universityConfig.policies.includes(p.id)).map(p => ({ value: p.id, label: p.name }))} 
                      value={selectedConfig.policies.map(id => ({ value: id, label: masterData.policies.find(p => p.id === id)?.name || id }))}
                      onChange={(vals) => setSelectedConfig({ ...selectedConfig, policies: vals.map(v => v.value) })}
                      styles={{ control: (base) => ({ ...base, borderRadius: '1.25rem', padding: '0.2rem', border: '2px solid #f1f5f9', boxShadow: 'none' }) }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Programs List</label>
                    <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={masterData.programs.filter(p => universityConfig.programs.includes(p.id)).map(p => ({ value: p.id, label: p.name }))} value={selectedConfig.programs.map(id => ({ value: id, label: masterData.programs.find(p => p.id === id)?.name || id }))} onChange={(vals) => setSelectedConfig({ ...selectedConfig, programs: vals.map(v => v.value) })} styles={{ control: (base) => ({ ...base, borderRadius: '1.25rem', border: '2px solid #f1f5f9' }) }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Years</label>
                    <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={masterData.academicYears.filter(ay => universityConfig.academicYears.includes(ay.id)).map(ay => ({ value: ay.id, label: ay.year_name }))} value={selectedConfig.academicYears.map(id => ({ value: id, label: masterData.academicYears.find(ay => ay.id === id)?.year_name || id }))} onChange={(vals) => setSelectedConfig({ ...selectedConfig, academicYears: vals.map(v => v.value) })} styles={{ control: (base) => ({ ...base, borderRadius: '1.25rem', border: '2px solid #f1f5f9' }) }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Semesters Mapping</label>
                    <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={masterData.semesters.filter(s => universityConfig.semesters.includes(s.id)).map(s => ({ value: s.id, label: s.semester_name }))} value={selectedConfig.semesters.map(id => ({ value: id, label: masterData.semesters.find(s => s.id === id)?.semester_name || id }))} onChange={(vals) => setSelectedConfig({ ...selectedConfig, semesters: vals.map(v => v.value) })} styles={{ control: (base) => ({ ...base, borderRadius: '1.25rem', border: '2px solid #f1f5f9' }) }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-end gap-5 sticky bottom-0 z-10">
          <button className="text-sm font-bold text-slate-500 hover:text-slate-800" onClick={() => navigate('/colleges')}>Discard changes</button>
          <button 
            onClick={handleSave}
            disabled={savingConfig}
            className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 text-sm uppercase tracking-widest flex items-center gap-2"
          >
            {savingConfig ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>{isEditing ? 'Update Record' : 'Create College'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Map Picker Modal Component ---
// This component dynamically loads Leaflet from CDN to avoid adding local dependencies 
// while providing a full interactive map experience.
const MapPickerModal = ({ onClose, onConfirm, initialLat, initialLon }) => {
  const [loading, setLoading] = useState(true);
  const mapRef = React.useRef(null);
  const [markerCoords, setMarkerCoords] = useState({ 
    lat: parseFloat(initialLat) || 22.9734, // Default to MP/India center
    lon: parseFloat(initialLon) || 78.6569 
  });

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setLoading(false);
      setTimeout(initMap, 100);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const initMap = () => {
    if (!window.L) return;
    const L = window.L;

    const map = L.map('map-container').setView([markerCoords.lat, markerCoords.lon], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([markerCoords.lat, markerCoords.lon], { draggable: true }).addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setMarkerCoords({ lat, lon: lng });
    });

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      setMarkerCoords({ lat, lon: lng });
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
              <Map size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">Interactive Map Picker</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select college location precisely</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>

        {/* Map Body */}
        <div className="flex-1 relative bg-slate-50">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Initialising Cartography Engine...</p>
            </div>
          )}
          <div id="map-container" className="w-full h-full"></div>
          
          {/* Coordinates Overlay */}
          <div className="absolute bottom-6 left-6 right-6 z-[1000] flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl shadow-xl border border-white flex gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latitude</p>
                <p className="text-sm font-mono font-bold text-slate-900">{markerCoords.lat.toFixed(8)}</p>
              </div>
              <div className="w-px h-8 bg-slate-200 mt-2"></div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longitude</p>
                <p className="text-sm font-mono font-bold text-slate-900">{markerCoords.lon.toFixed(8)}</p>
              </div>
            </div>
            <button 
              onClick={() => onConfirm(markerCoords.lat.toFixed(8), markerCoords.lon.toFixed(8))}
              className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-xl shadow-indigo-600/20 transition-all hover:translate-y-[-2px] active:translate-y-[1px]"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegesForm;
