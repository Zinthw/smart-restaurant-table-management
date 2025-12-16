import React, { useState } from 'react';
import axios from 'axios';

function TableForm({ apiBase, table, onSaved, onCancel }) {
  const [tableNumber, setTableNumber] = useState(table?.table_number || '');
  const [capacity, setCapacity] = useState(table?.capacity || 2);
  const [location, setLocation] = useState(table?.location || '');
  const [description, setDescription] = useState(table?.description || '');
  const [status, setStatus] = useState(table?.status || 'active');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        table_number: tableNumber,
        capacity: Number(capacity),
        location,
        description,
        status,
      };
      if (table) {
        await axios.put(`${apiBase}/api/admin/tables/${table.id}`, payload);
      } else {
        await axios.post(`${apiBase}/api/admin/tables`, payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 16, border: '1px solid #ccc', padding: 16 }}>
      <h3>{table ? 'Edit Table' : 'Add Table'}</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Table number</label><br />
          <input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} required />
        </div>
        <div>
          <label>Capacity</label><br />
          <input
            type="number"
            min="1"
            max="20"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Location</label><br />
          <input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        <div>
          <label>Description</label><br />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label>Status</label><br />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>{' '}
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default TableForm;
