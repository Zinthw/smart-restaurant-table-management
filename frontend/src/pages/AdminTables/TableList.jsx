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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("number_asc");

  const loadTables = async () => {
    try {
      setLoading(true);
      console.log("📡 Đang gọi API lấy danh sách bàn...");
      
      const res = await getTables();
      console.log("✅ Kết quả API trả về:", res); // Xem log này trong F12 Console

      // Xử lý linh hoạt cấu trúc dữ liệu trả về
      let dataArray = [];
      
      if (res.data && Array.isArray(res.data)) {
        // Trường hợp 1: Backend trả về { data: [...] }
        dataArray = res.data;
      } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        // Trường hợp 2: Backend trả về { data: { data: [...] } } (thường gặp với axios + response wrapper)
        dataArray = res.data.data;
      } else if (Array.isArray(res)) {
        // Trường hợp 3: Backend trả về trực tiếp [...]
        dataArray = res;
      } else {
        console.warn("⚠️ Cấu trúc dữ liệu lạ, không tìm thấy mảng:", res);
      }

      setTables(dataArray);
    } catch (error) {
      console.error("❌ Lỗi khi tải danh sách bàn:", error);
      toast.error("Failed to load tables: " + (error.message || "Unknown error"));
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
    const apiUrl =
      import.meta.env.VITE_API_URL || "http://localhost:4000/api";
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

  const getFilteredTables = () => {
    if (!tables || !Array.isArray(tables)) return [];

    let result = [...tables];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter((t) => {
        // Lấy số bàn và vị trí an toàn (nếu null thì coi là chuỗi rỗng)
        const tableNum = t.table_number ? String(t.table_number).toLowerCase() : "";
        const location = t.location ? String(t.location).toLowerCase() : "";
        
        // Hoặc kiểm tra tên biến
        const tableNumCamel = t.tableNumber ? String(t.tableNumber).toLowerCase() : "";

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
      result = result.filter((t) => t.location && t.location === locationFilter);
    }

    // Logic Sort (Sắp xếp)
    result.sort((a, b) => {
      // Lấy số bàn an toàn
      const numA = a.table_number || a.tableNumber || "";
      const numB = b.table_number || b.tableNumber || "";
      const capA = a.capacity || 0;
      const capB = b.capacity || 0;

      if (sortBy === "number_asc") {
        // So sánh chuỗi số bàn
        return String(numA).localeCompare(String(numB), undefined, { numeric: true });
      }
      if (sortBy === "capacity_desc") {
        return capB - capA;
      }
      if (sortBy === "capacity_asc") {
        return capA - capB;
      }
      return 0;
    });

    return result;
  };

  const filteredTables = getFilteredTables();

  // Tính toán thống kê
  const totalTables = tables.length;
  const activeTables = tables.filter((t) => t.status === "active").length;
  const inactiveTables = totalTables - activeTables;

  // Lấy danh sách các Location duy nhất để hiển thị trong dropdown
  const uniqueLocations = [...new Set(tables.map((t) => t.location).filter(Boolean))];

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

        {/* Tìm kiếm, lọc và sắp xếp */}
        <div style={{ 
          padding: "15px", 
          borderBottom: "1px solid #eee", 
          background: "#f9fafb",
          display: "flex", 
          flexWrap: "wrap", 
          gap: "10px", 
          alignItems: "center" 
        }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
             <span style={{position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af"}}>🔍</span>
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
                  outline: "none"
                }}
             />
          </div>

          {/* Filter Status */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none", cursor: "pointer" }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Filter Location */}
          <select 
            value={locationFilter} 
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none", cursor: "pointer" }}
          >
            <option value="all">All Locations</option>
            <option value="Indoor">Indoor</option>
            <option value="Outdoor">Outdoor</option>
            <option value="VIP Room">VIP Room</option>
            {uniqueLocations.map(loc => (
               !["Indoor", "Outdoor", "VIP Room"].includes(loc) && 
               <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Sort By */}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none", cursor: "pointer" }}
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
              ))
            ) : (
              <div style={{ padding: "20px", gridColumn: "1 / -1", textAlign: "center", color: "#666" }}>
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