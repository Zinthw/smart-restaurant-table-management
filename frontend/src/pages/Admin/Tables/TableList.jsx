import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { hasValidToken } from "../../../utils/authHelper";
import {
  getTables,
  createTable,
  updateTable,
  updateTableStatus,
  generateQR,
  regenerateAllQRs,
  deleteTable,
} from "../../../api/tables.api";
import TableFormModal from "./TableFormModal";
import QRModal from "./QRModal";
import ConfirmDialog from "../../../components/ConfirmDialog";

export default function TableList() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [confirm, setConfirm] = useState(null);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("number_asc");

  // Kiểm tra token khi component mount
  useEffect(() => {
    if (!hasValidToken()) {
      toast.error("Vui lòng đăng nhập lại");
      navigate("/admin/login");
    }
  }, [navigate]);

  const loadTables = async () => {
    // Kiểm tra token trước khi fetch
    if (!hasValidToken()) {
      console.warn("⚠️ Token không tồn tại, chuyển hướng đến login");
      navigate("/admin/login");
      return;
    }

    try {
      setLoading(true);
      const res = await getTables();

      let dataArray = [];
      if (res.data && Array.isArray(res.data)) {
        dataArray = res.data;
      } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        dataArray = res.data.data;
      } else if (Array.isArray(res)) {
        dataArray = res;
      }
      setTables(dataArray);
    } catch (error) {
      console.error("❌ Lỗi khi tải danh sách bàn:", error);
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

  // --- LOGIC XỬ LÝ CONFIRM CHUNG ---
  const executeConfirmAction = async () => {
    if (!confirm) return;

    // Xử lý logic dựa trên loại hành động (type)
    if (confirm.type === "TOGGLE_STATUS") {
      await handleToggleStatus(confirm.table);
    } else if (confirm.type === "REGEN_ALL") {
      await handleRegenerateAll();
    } else if (confirm.type === "DELETE_TABLE") {
      await handleDelete(confirm.table);
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

  // Hàm xử lý Regenerate All
  const handleRegenerateAll = async () => {
    try {
      setLoading(true);
      // Gọi API regenerate all (giả định backend trả về success)
      await regenerateAllQRs();
      toast.success("All QR Codes regenerated successfully!");
      setConfirm(null); // Đóng modal
      loadTables(); // Tải lại để update timestamp mới (nếu có hiển thị)
    } catch (error) {
      console.error(error);
      toast.error("Failed to regenerate QR codes");
    } finally {
      setLoading(false);
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

  const handleDelete = async (table) => {
    try {
      setLoading(true);
      await deleteTable(table.id);
      toast.success("Table deleted!");
      setConfirm(null);
      loadTables();
    } catch (error) {
      console.error("❌ Lỗi khi xóa bàn:", error);
      toast.error("Error deleting table");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTables = () => {
    if (!tables || !Array.isArray(tables)) return [];
    let result = [...tables];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter((t) => {
        const tableNum = t.table_number
          ? String(t.table_number).toLowerCase()
          : "";
        const location = t.location ? String(t.location).toLowerCase() : "";
        const tableNumCamel = t.tableNumber
          ? String(t.tableNumber).toLowerCase()
          : "";
        return (
          tableNum.includes(lowerTerm) ||
          location.includes(lowerTerm) ||
          tableNumCamel.includes(lowerTerm)
        );
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (locationFilter !== "all") {
      result = result.filter(
        (t) => t.location && t.location === locationFilter
      );
    }

    result.sort((a, b) => {
      const numA = a.table_number || a.tableNumber || "";
      const numB = b.table_number || b.tableNumber || "";
      const capA = a.capacity || 0;
      const capB = b.capacity || 0;

      if (sortBy === "number_asc") {
        return String(numA).localeCompare(String(numB), undefined, {
          numeric: true,
        });
      }
      if (sortBy === "capacity_desc") return capB - capA;
      if (sortBy === "capacity_asc") return capA - capB;
      return 0;
    });

    return result;
  };

  const filteredTables = getFilteredTables();
  const totalTables = tables.length;
  const activeTables = tables.filter((t) => t.status === "active").length;
  const inactiveTables = totalTables - activeTables;
  const uniqueLocations = [
    ...new Set(tables.map((t) => t.location).filter(Boolean)),
  ];

  return (
    <>
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

      {/* Stats Cards (Giữ nguyên) */}
      <div
        className="stats-grid"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {/* ... (Code Stats Cards giữ nguyên) ... */}
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
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {/* Regenerate All */}
            <button
              className="btn-secondary"
              style={{
                backgroundColor: "#fff1f0",
                color: "#e74c3c",
                borderColor: "#ffccc7",
              }}
              onClick={() =>
                setConfirm({
                  type: "REGEN_ALL",
                  message:
                    "WARNING: This will invalidate ALL existing QR codes. Customers will need to rescan the new codes. Are you sure?",
                })
              }
            >
              🔄 Regenerate All QR
            </button>

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

        {/* Filter Area */}
        <div
          style={{
            padding: "15px",
            borderBottom: "1px solid #eee",
            background: "#f9fafb",
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search table number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px 8px 35px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                outline: "none",
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Locations</option>
            <option value="Indoor">Indoor</option>
            <option value="Outdoor">Outdoor</option>
            <option value="VIP Room">VIP Room</option>
            {uniqueLocations.map(
              (loc) =>
                !["Indoor", "Outdoor", "VIP Room"].includes(loc) && (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                )
            )}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="number_asc">Sort: Table No. (Asc)</option>
            <option value="capacity_desc">Sort: Capacity (High-Low)</option>
            <option value="capacity_asc">Sort: Capacity (Low-High)</option>
          </select>
        </div>

        {loading ? (
          <div className="p-5 text-center">Loading...</div>
        ) : (
          <div className="tables-grid">
            {filteredTables.length > 0 ? (
              filteredTables.map((t) => (
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
                      <div
                        className="session-detail"
                        style={{ color: "green" }}
                      >
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
                          type: "DELETE_TABLE",
                          table: t,
                          message: `Delete table ${t.table_number}? This will remove its QR link.`,
                        })
                      }
                      title="Delete"
                    >
                      🗑️
                    </button>
                    <button
                      className="btn-small"
                      onClick={() =>
                        setConfirm({
                          type: "TOGGLE_STATUS", // Đánh dấu loại hành động
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
              ))
            ) : (
              <div
                style={{
                  padding: "20px",
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: "#666",
                }}
              >
                No tables found matching your filters.
              </div>
            )}
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

      {/* Confirm Dialog được nâng cấp để xử lý động */}
      <ConfirmDialog
        open={!!confirm}
        title="Confirm Action"
        message={confirm?.message}
        onConfirm={executeConfirmAction} // Gọi hàm trung gian thay vì gọi trực tiếp
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
