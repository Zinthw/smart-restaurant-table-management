import React, { useEffect, useState } from "react";
import { menuApi } from "../../../api/menu.api";
import toast from "react-hot-toast";
import Loading from "../../../components/Loading";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- STATES MODAL & FORM ---
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const initialForm = {
    id: null,
    name: "",
    display_order: 0,
    status: "active",
  };
  const [formData, setFormData] = useState(initialForm);

  // --- STATES PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await menuApi.getCategories();
      setCategories(res.data.data || res.data || []);
    } catch (error) {
      console.log("Backend chưa sẵn sàng, dùng Mock Data");
      setCategories([
        {
          id: 1,
          name: "Món Khai Vị",
          display_order: 1,
          status: "active",
          items_count: 5,
        },
        {
          id: 2,
          name: "Món Chính",
          display_order: 2,
          status: "active",
          items_count: 12,
        },
        {
          id: 3,
          name: "Đồ Uống",
          display_order: 3,
          status: "active",
          items_count: 8,
        },
        {
          id: 4,
          name: "Tráng Miệng",
          display_order: 4,
          status: "active",
          items_count: 2,
        },
        {
          id: 5,
          name: "Combo Gia Đình",
          display_order: 5,
          status: "inactive",
          items_count: 0,
        },
        {
          id: 6,
          name: "Món Ăn Kèm",
          display_order: 6,
          status: "active",
          items_count: 3,
        },
        {
          id: 7,
          name: "Rượu Vang",
          display_order: 7,
          status: "active",
          items_count: 10,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- LOGIC PHÂN TRANG ---
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = categories.slice(indexOfFirstItem, indexOfLastItem);

  // --- HANDLERS ---
  const handleOpenCreate = () => {
    // Tự động gợi ý số thứ tự tiếp theo (lấy max order + 1)
    const maxOrder =
      categories.length > 0
        ? Math.max(...categories.map((c) => c.display_order))
        : 0;
    setFormData({ ...initialForm, display_order: maxOrder + 1 });

    setIsEditMode(false);
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setFormData(cat);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      setCategories(categories.filter((c) => c.id !== id));
      toast.success("Đã xóa danh mục!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newOrder = Number(formData.display_order);

    // --- VALIDATION: CHẶN TRÙNG THỨ TỰ ---
    const isDuplicate = categories.some((cat) => {
      // Nếu đang sửa thì bỏ qua chính nó (cho phép nó giữ nguyên số của nó)
      if (isEditMode && cat.id === formData.id) return false;

      // So sánh số thứ tự
      return cat.display_order === newOrder;
    });

    if (isDuplicate) {
      toast.error(`Thứ tự số ${newOrder} đã tồn tại! Vui lòng chọn số khác.`);
      return; // Dừng hàm ngay lập tức, không lưu
    }
    // -----------------------------------------

    // Logic Mock Data
    if (isEditMode) {
      setCategories(
        categories.map((c) => (c.id === formData.id ? formData : c))
      );
      toast.success("Cập nhật thành công!");
    } else {
      const newCat = { ...formData, id: Date.now(), items_count: 0 };
      setCategories([...categories, newCat]);
      toast.success("Thêm danh mục thành công!");
    }
    setShowModal(false);
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="admin-header">
        <div>
          <h1 className="page-title">Quản Lý Danh Mục</h1>
          <p className="page-subtitle">Quản lý nhóm món ăn (Categories)</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          + Thêm Danh Mục
        </button>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>Danh sách danh mục ({categories.length})</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tên Danh Mục</th>
              <th>Thứ tự</th>
              <th>Số lượng món</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentCategories.length > 0 ? (
              currentCategories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 600 }}>{cat.name}</td>
                  <td>{cat.display_order}</td>
                  <td>{cat.items_count || 0} món</td>
                  <td>
                    <span
                      className={`status-badge ${
                        cat.status === "active" ? "active" : "inactive"
                      }`}
                    >
                      {cat.status === "active" ? "Hiển thị" : "Ẩn"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "center",
                      }}
                    >
                      <button
                        className="btn-small"
                        onClick={() => handleOpenEdit(cat)}
                        title="Sửa"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="btn-small"
                        style={{ borderColor: "#e74c3c", color: "#e74c3c" }}
                        onClick={() => handleDelete(cat.id)}
                        title="Xóa"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: 20 }}>
                  Chưa có danh mục nào
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* --- PHÂN TRANG --- */}
        {totalPages > 1 && (
          <div className="pagination" style={{ padding: "20px 0" }}>
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              ← Trước
            </button>
            <span className="page-info">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 30, maxWidth: 450 }}
          >
            <h2 style={{ marginBottom: 20 }}>
              {isEditMode ? "Cập Nhật Danh Mục" : "Thêm Danh Mục Mới"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tên danh mục</label>
                <input
                  className="form-input"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ví dụ: Món Khai Vị"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Thứ tự hiển thị</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: Number(e.target.value),
                    })
                  }
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "#e74c3c",
                    marginTop: 5,
                    display: "block",
                  }}
                >
                  * Không được trùng với danh mục khác
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select
                  className="form-input"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="active">Hiển thị (Active)</option>
                  <option value="inactive">Ẩn (Inactive)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 25 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {isEditMode ? "Lưu Thay Đổi" : "Tạo Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
