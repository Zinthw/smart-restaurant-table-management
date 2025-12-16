import React from 'react';

function TableList({ tables, onEdit, onToggleStatus, onGenerateQr }) {
  if (!tables.length) return <p>No tables yet.</p>;

  return (
    <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th>Table #</th>
          <th>Capacity</th>
          <th>Location</th>
          <th>Status</th>
          <th>QR</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tables.map((t) => (
          <tr key={t.id}>
            <td>{t.table_number}</td>
            <td>{t.capacity}</td>
            <td>{t.location}</td>
            <td>{t.status}</td>
            <td>{t.qr_token ? 'Generated' : 'Not generated'}</td>
            <td>
              <button onClick={() => onEdit(t)}>Edit</button>{' '}
              <button onClick={() => onToggleStatus(t)}>
                {t.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>{' '}
              <button onClick={() => onGenerateQr(t)}>
                {t.qr_token ? 'Regenerate QR' : 'Generate QR'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TableList;
