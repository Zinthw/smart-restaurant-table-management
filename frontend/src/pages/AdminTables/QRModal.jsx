import QRCode from "react-qr-code";
import { toast } from "react-hot-toast";
import { generateQR } from "../../api/tables.api";

export default function QRModal({ open, onClose, table, qrUrl, onRefresh }) {
  if (!open || !qrUrl) return null;

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

  // Hàm xử lý khi bấm nút Regenerate
  const handleRegenerate = async () => {
    // 1. Hỏi xác nhận
    const isConfirm = window.confirm(
      `CẢNH BÁO: Bạn có chắc muốn tạo lại mã QR cho bàn ${table.table_number}?\nMã QR cũ đang in sẽ KHÔNG còn dùng được nữa!`
    );

    if (isConfirm) {
      try {
        // 2. Gọi API tạo lại
        await generateQR(table.id);
        toast.success("Đã làm mới mã QR thành công!");

        // 3. Reload lại danh sách bàn ở bên ngoài để cập nhật token mới
        if (onRefresh) onRefresh();

        // 4. Đóng modal
        onClose();
      } catch (error) {
        console.error(error);
        toast.error("Lỗi khi tạo lại mã QR");
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: "750px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- HEADER MODAL: CHỨA NÚT REGENERATE --- */}
        <div className="table-header">
          <h3>QR Code Preview - {table?.table_number}</h3>

          <div style={{ display: "flex", gap: "10px" }}>
            {/* Nút Regenerate mới thêm vào */}
            <button
              onClick={handleRegenerate}
              className="btn-secondary"
              style={{
                borderColor: "#e74c3c",
                color: "#e74c3c",
                fontWeight: "600",
                minWidth: "130px",
              }}
              title="Tạo mã mới và hủy mã cũ"
            >
              🔄 Regenerate
            </button>

            {/* Nút Close */}
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ width: "80px", minWidth: "unset" }}
            >
              Close
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "30px",
            padding: "30px",
            flexWrap: "wrap",
          }}
        >
          {/* Cột trái: QR Image */}
          <div className="qr-preview" style={{ flex: 1, minWidth: "200px" }}>
            <div className="qr-code">
              <QRCode value={qrUrl} size={200} />
              <div
                style={{
                  textAlign: "center",
                  marginTop: "15px",
                  fontWeight: "bold",
                }}
              >
                {table?.table_number}
              </div>
            </div>
          </div>

          {/* Cột phải: Thông tin & Download */}
          <div className="qr-details" style={{ flex: 1.5 }}>
            <h4 style={{ marginTop: 0 }}>Table Information</h4>
            <div className="detail-row">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{table?.location}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Capacity:</span>
              <span className="detail-value">{table?.capacity} Persons</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value" style={{ color: "green" }}>
                Active
              </span>
            </div>

            <div
              style={{
                marginTop: "30px",
                display: "flex",
                gap: "10px",
                flexDirection: "column",
              }}
            >
              <a
                href={`${apiUrl}/admin/tables/${table.id}/qr/download?format=png`}
                target="_blank"
                className="btn-primary"
                style={{ textAlign: "center", textDecoration: "none" }}
              >
                ⬇️ Download PNG Image
              </a>
              <a
                href={`${apiUrl}/admin/tables/${table.id}/qr/download?format=pdf`}
                target="_blank"
                className="btn-secondary"
                style={{ textAlign: "center", textDecoration: "none" }}
              >
                📄 Download PDF Print
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
