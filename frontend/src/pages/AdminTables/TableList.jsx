import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  getTables,
  createTable,
  updateTable,
  updateTableStatus,
  generateQR,
} from "../../api/tables.api";
import AdminLayout from "../../components/layout/AdminLayout";
import TableFormModal from "./TableFormModal";
import QRModal from "./QRModal";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function TableList() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTables = async () => {
    try {
      setLoading(true);
      const res = await getTables();
      setTables(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleSave = async (data) => {
    try {
      if (selectedTable) await updateTable(selectedTable.id, data);
      else await createTable(data);
      toast.success(selectedTable ? "Table updated!" : "Table created!");
      setShowForm(false);
      setSelectedTable(null);
      loadTables();
    } catch (error) {
      toast.error("Error saving table");
    }
  };

  const handleToggleStatus = async (table) => {
    try {
      await updateTableStatus(
        table.id,
        table.status === "active" ? "inactive" : "active"
      );
      toast.success("Status updated!");
      setConfirm(null);
      loadTables();
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  const handleDownloadAll = (format) => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    const url = `${apiUrl}/admin/tables/qr/download-all?format=${format}`;
    window.open(url, "_blank");
    toast.success(`Downloading all QR codes as ${format.toUpperCase()}...`);
  };

  const handleGenerateQR = async (table) => {
    try {
      const res = await generateQR(table.id);
      // Backend trả về { tableId, url, qrImageDataUrl, qrTokenCreatedAt }
      const url = res.data?.url;
      if (url) {
        setQrUrl(url);
        setSelectedTable(table);
        setShowQR(true);
        toast.success("QR Generated!");
        loadTables();
      }
    } catch (error) {
      toast.error("Error generating QR");
    }
  };

  // Tính toán thống kê
  const totalTables = tables.length;
  const activeTables = tables.filter((t) => t.status === "active").length;
  const inactiveTables = totalTables - activeTables;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="page-title">Table Management</h1>
          <p className="page-subtitle">Manage tables and generate QR codes</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setSelectedTable(null);
            setShowForm(true);
          }}
        >
          + Add Table
        </button>
      </div>

      {/* Stats Cards */}
      <div
        className="stats-grid"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "#e8f8f5", color: "#27ae60" }}
          >
            🪑
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalTables}</div>
            <div className="stat-label">Total Tables</div>
          </div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "#ebf5fb", color: "#3498db" }}
          >
            ✅
          </div>
          <div className="stat-content">
            <div className="stat-value">{activeTables}</div>
            <div className="stat-label">Active (Available)</div>
          </div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "#fef9e7", color: "#f39c12" }}
          >
            🚫
          </div>
          <div className="stat-content">
            <div className="stat-value">{inactiveTables}</div>
            <div className="stat-label">Inactive</div>
          </div>
        </div>
      </div>

      {/* Main Table Grid Area */}
      <div className="table-card">
        <div className="table-header">
          <h3>All Tables</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn-secondary"
              onClick={() => handleDownloadAll("png")}
            >
              ⬇️ Download All (ZIP)
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleDownloadAll("pdf")}
            >
              📄 Download All (PDF)
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-5 text-center">Loading...</div>
        ) : (
          <div className="tables-grid">
            {tables.map((t) => (
              <div
                key={t.id}
                className={`table-tile ${
                  t.status === "active" ? "available" : "inactive"
                }`}
              >
                <div className="table-number">{t.table_number}</div>

                <div
                  className={`table-status ${
                    t.status === "active" ? "available" : "inactive"
                  }`}
                >
                  {t.status === "active" ? "✅ Available" : "🚫 Inactive"}
                </div>

                <div className="table-info">
                  <span>{t.capacity} seats</span>
                  <span>•</span>
                  <span>{t.location}</span>
                </div>

                <div className="table-session">
                  {t.qrToken ? (
                    <div className="session-detail" style={{ color: "green" }}>
                      QR Ready
                    </div>
                  ) : (
                    <div className="session-detail" style={{ color: "gray" }}>
                      No QR
                    </div>
                  )}
                </div>

                <div className="table-actions">
                  <button
                    className="btn-small"
                    onClick={() => handleGenerateQR(t)}
                    title="QR Code"
                  >
                    QR
                  </button>
                  <button
                    className="btn-small"
                    onClick={() => {
                      setSelectedTable(t);
                      setShowForm(true);
                    }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-small"
                    onClick={() =>
                      setConfirm({
                        table: t,
                        message: `Change status to ${
                          t.status === "active" ? "Inactive" : "Active"
                        }?`,
                      })
                    }
                    title="Toggle Status"
                  >
                    {t.status === "active" ? "🔒" : "🔓"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TableFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSave}
        initialData={selectedTable}
      />
      <QRModal
        open={showQR}
        onClose={() => setShowQR(false)}
        table={selectedTable}
        qrUrl={qrUrl}
      />
      <ConfirmDialog
        open={!!confirm}
        title="Confirm Action"
        message={confirm?.message}
        onConfirm={() => handleToggleStatus(confirm.table)}
        onCancel={() => setConfirm(null)}
      />
    </AdminLayout>
  );
}
