import React, { useEffect, useState } from 'react';
import { masterDataApi } from '../api/masterDataApi';
import { X } from 'lucide-react';

const AuditLogModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await masterDataApi.getTeacherAuditLogs();
        setLogs(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-11/12 max-w-4xl max-h-[80vh] overflow-y-auto p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4">Audit Logs</h2>
        {loading && <p className="text-gray-600">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left border">ID</th>
                <th className="p-2 text-left border">Action</th>
                <th className="p-2 text-left border">User</th>
                <th className="p-2 text-left border">Timestamp</th>
                <th className="p-2 text-left border">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="p-2 border">{log.id}</td>
                  <td className="p-2 border">{log.action}</td>
                  <td className="p-2 border">{log.user_name || log.user_id}</td>
                  <td className="p-2 border">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-2 border break-words max-w-xs">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log, null, 2)}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditLogModal;
