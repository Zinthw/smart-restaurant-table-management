import React from 'react';

function QrModal({ apiBase, qrData, onClose }) {
  const handleDownload = (format) => {
    const url = `${apiBase}/api/admin/tables/${qrData.tableId}/qr/download?format=${format}`;
    window.open(url, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', padding: 16, minWidth: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>QR Code</h3>
        <p>URL:</p>
        <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{qrData.url}</code>
        <p>Created at: {qrData.qrTokenCreatedAt}</p>
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <img src={qrData.qrImageDataUrl} alt="QR code" style={{ maxWidth: 200 }} />
        </div>
        <div>
          <button onClick={() => handleDownload('png')}>Download PNG</button>{' '}
          <button onClick={() => handleDownload('pdf')}>Download PDF</button>{' '}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default QrModal;
