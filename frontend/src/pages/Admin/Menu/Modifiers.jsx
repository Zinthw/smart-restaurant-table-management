import React, { useEffect, useState } from "react";
import { menuApi } from "../../../api/menu.api";
import toast from "react-hot-toast";
import Loading from "../../../components/Loading";

export default function ModifiersPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- STATES MODAL ---
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);

  // --- STATES FORM & EDIT ---
  const [isEditGroupMode, setIsEditGroupMode] = useState(false); // Check xem đang thêm hay sửa Group
  const [isEditOptionMode, setIsEditOptionMode] = useState(false); // Check xem đang thêm hay sửa Option

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    required: false,
    selection_type: "single",
  });

  // State cho Option Form
  const [optionData, setOptionData] = useState({
    id: null,
    name: "",
    price: 0,
  });
  // State phụ để biết đang sửa option nào (index hoặc id)
  const [editingOptionIndex, setEditingOptionIndex] = useState(-1);

  // --- STATES PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. Load dữ liệu
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await menuApi.getModifierGroups();
      setGroups(res.data?.data || res.data || []);
    } catch (error) {
      console.log("Backend chưa sẵn sàng, dùng Mock Data");
      setGroups([
        {
          id: 1,
          name: "Size (Kích cỡ)",
          selection_type: "single",
          options: [
            { id: 101, name: "M", price: 0 },
            { id: 102, name: "L", price: 5000 },
            { id: 103, name: "XL", price: 10000 },
          ],
        },
        {
          id: 2,
          name: "Mức Đường",
          selection_type: "single",
          options: [
            { id: 201, name: "100%", price: 0 },
            { id: 202, name: "50%", price: 0 },
            { id: 203, name: "0%", price: 0 },
          ],
        },
        {
          id: 3,
          name: "Topping (Thêm)",
          selection_type: "multi",
          options: [
            { id: 301, name: "Trân châu đen", price: 5000 },
            { id: 302, name: "Pudding trứng", price: 5000 },
            { id: 303, name: "Thạch dừa", price: 5000 },
          ],
        },
        {
          id: 4,
          name: "Mức Đá",
          selection_type: "single",
          options: [
            { id: 401, name: "100%", price: 0 },
            { id: 402, name: "50%", price: 0 },
            { id: 403, name: "Không đá", price: 0 },
          ],
        },
        {
          id: 5,
          name: "Loại Vỏ Bánh",
          selection_type: "single",
          options: [
            { id: 501, name: "Mỏng giòn", price: 0 },
            { id: 502, name: "Dày xốp", price: 0 },
            { id: 503, name: "Viền phô mai", price: 15000 },
          ],
        },
        {
          id: 6,
          name: "Sốt Ăn Kèm",
          selection_type: "multi",
          options: [
            { id: 601, name: "Tương ớt", price: 0 },
            { id: 602, name: "Mayonnaise", price: 0 },
            { id: 603, name: "Sốt BBQ", price: 5000 },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // --- LOGIC PHÂN TRANG ---
  const totalPages = Math.ceil(groups.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGroups = groups.slice(indexOfFirstItem, indexOfLastItem);

  // --- HANDLERS GROUP ---

  const handleOpenCreateGroup = () => {
    setFormData({
      id: null,
      name: "",
      required: false,
      selection_type: "single",
    });
    setIsEditGroupMode(false);
    setShowGroupModal(true);
  };

  const handleOpenEditGroup = (group) => {
    setFormData(group); // Điền thông tin cũ vào form
    setSelectedGroup(group); // Lưu lại group đang sửa để hiển thị list option bên dưới
    setIsEditGroupMode(true);
    setShowGroupModal(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Tên nhóm không được để trống!");
      return;
    }

    // Logic Mock
    if (isEditGroupMode) {
      // Cập nhật
      setGroups(
        groups.map((g) => {
          if (g.id === formData.id) {
            return {
              ...g,
              name: formData.name,
              selection_type: formData.selection_type,
              required: formData.required,
            };
          }
          return g;
        })
      );
      toast.success("Cập nhật nhóm thành công!");
    } else {
      // Thêm mới
      const newGroup = { ...formData, id: Date.now(), options: [] };
      setGroups([...groups, newGroup]);
      toast.success("Tạo nhóm thành công!");
    }
    setShowGroupModal(false);
  };

  // --- HANDLERS OPTION ---

  const handleOpenAddOption = (group) => {
    setSelectedGroup(group);
    setOptionData({ id: null, name: "", price: 0 });
    setIsEditOptionMode(false);
    setShowOptionModal(true);
  };

  const handleOpenEditOption = (group, option, index) => {
    setSelectedGroup(group);
    setOptionData(option);
    setEditingOptionIndex(index); // Lưu vị trí để sửa trong mảng
    setIsEditOptionMode(true);
    setShowOptionModal(true);
  };

  const handleSaveOption = async (e) => {
    e.preventDefault();
    if (!optionData.name.trim()) {
      toast.error("Tên lựa chọn trống!");
      return;
    }
    if (optionData.price < 0) {
      toast.error("Giá không được âm!");
      return;
    }

    // Logic Mock UI
    const updatedGroups = groups.map((g) => {
      if (g.id === selectedGroup.id) {
        let newOptions = [...(g.options || [])];

        if (isEditOptionMode) {
          // Sửa Option cũ
          // Cách 1: Tìm theo ID (nếu có ID thật)
          if (optionData.id) {
            newOptions = newOptions.map((opt) =>
              opt.id === optionData.id ? optionData : opt
            );
          } else {
            // Cách 2: Tìm theo index (dùng cho mock data chưa có id chuẩn)
            newOptions[editingOptionIndex] = optionData;
          }
        } else {
          // Thêm Option mới
          newOptions.push({ ...optionData, id: Date.now() });
        }
        return { ...g, options: newOptions };
      }
      return g;
    });

    setGroups(updatedGroups);
    // Nếu đang mở modal Edit Group, cần cập nhật cả selectedGroup để UI render lại ngay lập tức
    if (showGroupModal && selectedGroup) {
      const updatedGroup = updatedGroups.find((g) => g.id === selectedGroup.id);
      setSelectedGroup(updatedGroup);
    }

    setShowOptionModal(false);
    toast.success(
      isEditOptionMode ? "Cập nhật lựa chọn!" : "Thêm lựa chọn thành công!"
    );
  };

  const handleDeleteOption = async (group, optionId) => {
    if (!window.confirm("Xóa lựa chọn này?")) return;
    try {
      if (optionId) {
        await menuApi.deleteModifierOption(optionId);
        toast.success("Đã xóa lựa chọn (server)");
        await fetchGroups();
      } else {
        // fallback cho dữ liệu tạm
        const updatedGroups = groups.map((g) => {
          if (g.id === group.id) {
            return {
              ...g,
              options: g.options.filter((opt) => opt.id !== optionId),
            };
          }
          return g;
        });
        setGroups(updatedGroups);
        if (showGroupModal && selectedGroup) {
          const updatedGroup = updatedGroups.find(
            (g) => g.id === selectedGroup.id
          );
          setSelectedGroup(updatedGroup);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Xóa lựa chọn thất bại");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Xóa nhóm và toàn bộ lựa chọn?")) return;
    try {
      await menuApi.deleteModifierGroup(groupId);
      toast.success("Đã xóa nhóm (server)");
      await fetchGroups();
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setShowGroupModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Xóa nhóm thất bại");
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="admin-header">
        <div>
          <h1 className="page-title">Modifiers</h1>
          <p className="page-subtitle">Quản lý Topping, Size, Tùy chọn món</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateGroup}>
          + Tạo Nhóm Mới
        </button>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>Danh sách nhóm tùy chọn ({groups.length})</h3>
        </div>

        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Tên Nhóm</th>
              <th>Loại chọn</th>
              <th>Các lựa chọn (Options)</th>
              <th style={{ textAlign: "right" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentGroups.length > 0 ? (
              currentGroups.map((group) => (
                <tr key={group.id}>
                  <td style={{ fontWeight: 600 }}>{group.name}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        group.selection_type === "single"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {group.selection_type === "single"
                        ? "Chọn 1 (Radio)"
                        : "Chọn nhiều (Check)"}
                    </span>
                  </td>
                  <td>
                    {group.options && group.options.length > 0 ? (
                      <div
                        style={{ display: "flex", gap: 5, flexWrap: "wrap" }}
                      >
                        {group.options.map((opt, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "#f1f2f6",
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 12,
                              border: "1px solid #d1d5db",
                              cursor: "pointer",
                            }}
                            title="Bấm để sửa nhanh"
                            onClick={() =>
                              handleOpenEditOption(group, opt, idx)
                            }
                          >
                            {opt.name} (+
                            {(
                              Number(opt.price_adjustment ?? opt.price ?? 0) ||
                              0
                            ).toLocaleString()}
                            )
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#95a5a6", fontSize: 12 }}>
                        Chưa có lựa chọn
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 5,
                      }}
                    >
                      <button
                        className="btn-small"
                        onClick={() => handleOpenAddOption(group)}
                        title="Thêm Option"
                      >
                        + Option
                      </button>
                      <button
                        className="btn-small"
                        title="Sửa Nhóm"
                        onClick={() => handleOpenEditGroup(group)}
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: 20 }}>
                  Chưa có nhóm nào
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

      {/* --- MODAL 1: TẠO/SỬA NHÓM (QUẢN LÝ LUÔN OPTION) --- */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 30, maxWidth: 600 }}
          >
            <h2 style={{ marginBottom: 20 }}>
              {isEditGroupMode ? "Chỉnh Sửa Nhóm" : "Tạo Nhóm Modifier"}
            </h2>

            <form onSubmit={handleSaveGroup}>
              {/* PHẦN 1: THÔNG TIN CHUNG */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 15,
                }}
              >
                <div className="form-group">
                  <label className="form-label">Tên nhóm</label>
                  <input
                    className="form-input"
                    required
                    placeholder="VD: Size, Topping..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Loại lựa chọn</label>
                  <select
                    className="form-input"
                    value={formData.selection_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        selection_type: e.target.value,
                      })
                    }
                  >
                    <option value="single">Chỉ chọn 1 (Radio)</option>
                    <option value="multi">Chọn nhiều (Checkbox)</option>
                  </select>
                </div>
              </div>

              {/* PHẦN 2: DANH SÁCH OPTIONS (Chỉ hiện khi đang Sửa) */}
              {isEditGroupMode && selectedGroup && (
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 20,
                    background: "#f8f9fa",
                    padding: 15,
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <h4 style={{ margin: 0, fontSize: 15 }}>
                      Danh sách lựa chọn
                    </h4>
                    <button
                      type="button"
                      className="btn-small"
                      onClick={() => handleOpenAddOption(selectedGroup)}
                    >
                      + Thêm
                    </button>
                  </div>

                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {selectedGroup.options &&
                    selectedGroup.options.length > 0 ? (
                      <table style={{ width: "100%", fontSize: 13 }}>
                        <tbody>
                          {selectedGroup.options.map((opt, idx) => (
                            <tr
                              key={idx}
                              style={{ borderBottom: "1px solid #eee" }}
                            >
                              <td style={{ padding: "8px 0" }}>{opt.name}</td>
                              <td style={{ padding: "8px 0" }}>
                                +
                                {(
                                  Number(
                                    opt.price_adjustment ?? opt.price ?? 0
                                  ) || 0
                                ).toLocaleString()}
                                đ
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <button
                                  type="button"
                                  style={{
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    color: "#2980b9",
                                    marginRight: 10,
                                  }}
                                  onClick={() =>
                                    handleOpenEditOption(
                                      selectedGroup,
                                      opt,
                                      idx
                                    )
                                  }
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    color: "#e74c3c",
                                  }}
                                  onClick={() =>
                                    handleDeleteOption(selectedGroup, opt.id)
                                  }
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          color: "#999",
                          fontSize: 13,
                          padding: 10,
                        }}
                      >
                        Chưa có lựa chọn nào
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowGroupModal(false)}
                >
                  Hủy
                </button>
                <button className="btn-primary" style={{ flex: 1 }}>
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: TẠO/SỬA OPTION --- */}
      {showOptionModal && selectedGroup && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100 }}
          onClick={() => setShowOptionModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 30, maxWidth: 400 }}
          >
            <h3 style={{ marginBottom: 20 }}>
              {isEditOptionMode ? "Sửa Lựa Chọn" : "Thêm Lựa Chọn"}
            </h3>
            <p style={{ fontSize: 13, color: "#7f8c8d", marginBottom: 15 }}>
              Thuộc nhóm: <strong>{selectedGroup.name}</strong>
            </p>

            <form onSubmit={handleSaveOption}>
              <div className="form-group">
                <label className="form-label">Tên lựa chọn</label>
                <input
                  className="form-input"
                  required
                  autoFocus
                  placeholder="VD: Size L"
                  value={optionData.name}
                  onChange={(e) =>
                    setOptionData({ ...optionData, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Giá thêm (VNĐ)</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="0"
                  value={optionData.price}
                  onChange={(e) =>
                    setOptionData({
                      ...optionData,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowOptionModal(false)}
                >
                  Hủy
                </button>
                <button className="btn-primary" style={{ flex: 1 }}>
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
