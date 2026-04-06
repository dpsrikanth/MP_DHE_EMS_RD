import React, { useState, useEffect } from 'react';
import { Building2, Users, TrendingUp, AlertTriangle, Search } from 'lucide-react';

const InfrastructureAnalytics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInfrastructureData();
  }, []);

  const fetchInfrastructureData = async () => {
    try {
      const response = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/reports/infrastructure-analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      setData(Array.isArray(result) ? result : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => 
    item.college_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-blue-600" /> Infrastructure Analytics
          </h1>
          <p className="text-slate-500">College-wise Capacity vs Student Distribution</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input 
            type="text" 
            placeholder="Search colleges..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400">Loading analytics...</div>
        ) : filteredData.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400">No colleges found</div>
        ) : filteredData.map((item) => {
          const occupancy = item.approved_capacity === 0 ? 0 : Math.round((item.total_students / item.approved_capacity) * 100);
          const isDeficit = item.total_students > item.approved_capacity;

          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 truncate" title={item.college_name}>
                    {item.college_name}
                  </h3>
                  <span className="text-xs text-slate-400 uppercase font-medium tracking-wider">Institution ID: {item.id}</span>
                </div>
                {isDeficit && (
                  <div className="bg-rose-50 text-rose-600 p-2 rounded-lg" title="Seat Deficit Detected">
                    <AlertTriangle size={18} />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users size={16} /> Students
                  </div>
                  <span className="font-bold text-slate-800">{item.total_students}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 size={16} /> Approved Capacity
                  </div>
                  <span className="font-bold text-slate-800">{item.approved_capacity}</span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Capacity Coverage</span>
                    <span className={isDeficit ? 'text-rose-600 font-bold' : 'text-blue-600 font-bold'}>
                      {occupancy}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${isDeficit ? 'bg-rose-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(occupancy, 100)}%` }}
                    />
                  </div>
                </div>

                {isDeficit && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex gap-2 items-center">
                    <TrendingUp className="text-rose-500" size={16} />
                    <span className="text-xs text-rose-700 font-medium">
                      Requires {item.total_students - item.approved_capacity} additional seats
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InfrastructureAnalytics;
