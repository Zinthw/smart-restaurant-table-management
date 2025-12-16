import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TableList from '../components/TableList.jsx';
import TableForm from '../components/TableForm.jsx';
import QrModal from '../components/QrModal.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function AdminTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [qrData, setQrData] = useState(null);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/tables`);
      setTables(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCreate = () => {
    setSelectedTable(null);
    setShowForm(true);
  };

  const handleEdit = (table) => {
    setSelectedTable(table);
    setShowForm(true);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    fetchTables();
  };

  const handleToggleStatus = async (table) => {
    const nextStatus = table.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Change status of table ${table.table_number} to ${nextStatus}?`)) return;
    try {
      await axios.patch(`${API_BASE}/api/admin/tables/${table.id}/status`, { status: nextStatus });
      fetchTables();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleGenerateQr = async (table) => {
    try {
      const res = await axios.post(`${API_BASE}/api/admin/tables/${table.id}/qr/generate`);
      setQrData(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate QR');
    }
  };

  const handleCloseQr = () => setQrData(null);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Table Management</h2>
        <button onClick={handleCreate}>+ Add Table</button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <TableList
          tables={tables}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onGenerateQr={handleGenerateQr}
        />
      )}

      {showForm && (
        <TableForm
          apiBase={API_BASE}
          table={selectedTable}
          onSaved={handleFormSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {qrData && (
        <QrModal apiBase={API_BASE} qrData={qrData} onClose={handleCloseQr} />
      )}
    </div>
  );
}

export default AdminTables;
