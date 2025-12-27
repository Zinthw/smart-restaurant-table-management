import React, { useEffect, useState } from "react";
import { menuApi } from "../../../api/menu.api";
import toast from "react-hot-toast";
import Loading from "../../../components/Loading";

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]); // List nhóm modifier để chọn
  const [loading, setLoading] = useState(false);

  // --- STATES BỘ LỌC ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // --- STATES PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 14;

  // --- STATES MODAL & TABS ---
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'photos' | 'modifiers'

  // Input tạm để thêm ảnh (URL)
  const [tempPhotoUrl, setTempPhotoUrl] = useState("");

  // Form Data (Cấu trúc mới)
  const initialForm = {
    id: null,
    name: "",
    price: 0,
    category_id: "",
    description: "",
    status: "active",
    is_recommended: false,
    photos: [],
    modifier_group_ids: [],
    prep_time_minutes: 15,
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // Map frontend sort to backend API sort_by param
        let sortParam = "created_at";
        if (sortBy === "price_low" || sortBy === "price_high")
          sortParam = "price";
        if (sortBy === "popular") sortParam = "popularity";

        const [itemsRes, catsRes, modsRes] = await Promise.all([
          menuApi.getItems({ page: 1, limit: 500, sort_by: sortParam }),
          menuApi.getCategories(),
          menuApi.getModifierGroups(),
        ]);
        setItems(itemsRes.data?.data || itemsRes.data || []);
        setCategories(catsRes.data?.data || catsRes.data || []);
        setModifierGroups(modsRes.data?.data || modsRes.data || []);
      } catch (error) {
        console.log("Dùng Mock Data đầy đủ");

        // Mock Categories
        setCategories([
          { id: 1, name: "Món Khai Vị" },
          { id: 2, name: "Món Chính" },
          { id: 3, name: "Đồ Uống" },
          { id: 4, name: "Tráng Miệng" },
        ]);

        // Mock Modifier Groups
        setModifierGroups([
          { id: 1, name: "Size (Kích cỡ)" },
          { id: 2, name: "Mức Đường" },
          { id: 3, name: "Topping (Thêm)" },
          { id: 4, name: "Mức Đá" },
        ]);

        // Mock Items (Update cấu trúc mới)
        setItems([
          {
            id: 1,
            name: "Bò Bít Tết Sốt Tiêu",
            price: 250000,
            category_id: 2,
            status: "active",
            order_count: 150,
            is_recommended: true, // Chef recommended
            photos: [{ id: 1, url: "", is_primary: true }],
            modifier_group_ids: [],
          },
          {
            id: 2,
            name: "Salad Cá Ngừ",
            price: 85000,
            category_id: 1,
            status: "active",
            order_count: 45,
            is_recommended: false,
            photos: [],
            modifier_group_ids: [],
          },
          {
            id: 3,
            name: "Trà Sữa Trân Châu",
            price: 45000,
            category_id: 3,
            status: "sold_out",
            order_count: 500,
            is_recommended: true,
            photos: [],
            modifier_group_ids: [1, 2, 3, 4], // Gắn với Size, Đường, Topping, Đá
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // --- LOGIC LỌC & SORT ---
  useEffect(
    () => setCurrentPage(1),
    [searchTerm, filterCategory, filterStatus, sortBy]
  );

  const getProcessedItems = () => {
    let result = items.filter((item) => {
      const matchSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchCat =
        filterCategory === "All" || item.category_id == filterCategory;
      let matchStatus = true;
      if (filterStatus !== "All") {
        if (filterStatus === "active")
          matchStatus = ["active", "available"].includes(item.status);
        else if (filterStatus === "sold_out")
          matchStatus = item.status === "sold_out";
        else if (filterStatus === "inactive")
          matchStatus = ["inactive", "unavailable"].includes(item.status);
      }
      return matchSearch && matchCat && matchStatus;
    });

    result.sort((a, b) => {
      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      if (sortBy === "popular")
        return (b.order_count || 0) - (a.order_count || 0);
      return b.id - a.id;
    });
    return result;
  };

  const filteredItems = getProcessedItems();
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- ACTIONS ---
  const handleOpenCreate = () => {
    setFormData(initialForm);
    setIsEditMode(false);
    setActiveTab("info");
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    // Fill data, nếu thiếu trường nào thì fill mặc định
    setFormData({
      ...initialForm,
      ...item,
      photos: item.photos || [],
      modifier_group_ids: item.modifier_group_ids || [],
    });
    setIsEditMode(true);
    setActiveTab("info");
    setShowModal(true);
  };

  const handleDuplicate = (item) => {
    setFormData({
      ...item,
      id: null,
      name: `${item.name} (Copy)`,
      photos: item.photos || [],
      modifier_group_ids: item.modifier_group_ids || [],
    });
    setIsEditMode(false);
    setActiveTab("info");
    setShowModal(true);
    toast("Đã sao chép thông tin!", { icon: "📋" });
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa món này không?")) {
      setItems(items.filter((i) => i.id !== id));
      toast.success("Đã xóa món ăn!");
    }
  };

  // --- LOGIC XỬ LÝ ẢNH ---
  const handleAddPhoto = () => {
    if (!tempPhotoUrl.trim()) return;
    const newPhoto = {
      id: Date.now(),
      url: tempPhotoUrl,
      is_primary: formData.photos.length === 0, // Nếu là ảnh đầu tiên thì auto primary
    };
    setFormData({ ...formData, photos: [...formData.photos, newPhoto] });
    setTempPhotoUrl("");
  };

  const handleSetPrimaryPhoto = (photoId) => {
    const updatedPhotos = formData.photos.map((p) => ({
      ...p,
      is_primary: p.id === photoId,
    }));
    setFormData({ ...formData, photos: updatedPhotos });
  };

  const handleRemovePhoto = (photoId) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((p) => p.id !== photoId),
    });
  };

  // --- LOGIC XỬ LÝ MODIFIER ---
  const handleToggleModifierGroup = (groupId) => {
    const currentIds = formData.modifier_group_ids || [];
    if (currentIds.includes(groupId)) {
      // Bỏ chọn
      setFormData({
        ...formData,
        modifier_group_ids: currentIds.filter((id) => id !== groupId),
      });
    } else {
      // Chọn thêm
      setFormData({
        ...formData,
        modifier_group_ids: [...currentIds, groupId],
      });
    }
  };

  // --- SAVE ---
  const handleSave = (e) => {
    e.preventDefault();
    if (formData.price < 0) {
      toast.error("Giá tiền không được phép âm!");
      return;
    }

    if (isEditMode) {
      setItems(items.map((i) => (i.id === formData.id ? formData : i)));
      toast.success("Cập nhật món thành công!");
    } else {
      const newItem = { ...formData, id: Date.now(), order_count: 0 };
      setItems([newItem, ...items]);
      toast.success("Thêm món mới thành công!");
    }
    setShowModal(false);
  };

  // Helper
  const getCategoryName = (id) =>
    categories.find((c) => c.id == id)?.name || "Unknown";
  const getPrimaryImage = (item) => {
    if (item.photos && item.photos.length > 0) {
      const primary = item.photos.find((p) => p.is_primary);
      return primary ? primary.url : item.photos[0].url;
    }
    return item.image || ""; // Fallback cho data cũ
  };
  const getStatusClass = (status) => {
    if (["active", "available"].includes(status)) return "available";
    if (status === "sold_out") return "sold-out";
    return "unavailable";
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="admin-header">
        <div>
          <h1 className="page-title">Quản Lý Thực Đơn</h1>
          <p className="page-subtitle">Danh sách các món ăn hiện có</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          + Thêm Món Mới
        </button>
      </div>

      {/* FILTERS */}
      <div className="filters-bar">
        <div className="search-box">
          <span style={{ color: "#95a5a6", fontSize: 18 }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="All">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="active">Đang bán</option>
          <option value="sold_out">Hết hàng</option>
          <option value="inactive">Ngừng kinh doanh</option>
        </select>
        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Mới nhất</option>
          <option value="price_low">Giá thấp - cao</option>
          <option value="price_high">Giá cao - thấp</option>
          <option value="popular">Phổ biến nhất</option>
        </select>
      </div>

      {/* GRID */}
      <div className="menu-grid">
        {currentItems.length > 0 ? (
          currentItems.map((item) => (
            <div className="menu-admin-card" key={item.id}>
              <div className="menu-card-image" style={{ position: "relative" }}>
                {/* Badge Recommended */}
                {item.is_recommended && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      background: "#f1c40f",
                      color: "#fff",
                      padding: "2px 8px",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: "bold",
                      zIndex: 2,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    ★ Chef's Choice
                  </span>
                )}
                {getPrimaryImage(item) ? (
                  <img src={getPrimaryImage(item)} alt={item.name} />
                ) : (
                  <span style={{ fontSize: 40 }}>🍽️</span>
                )}
              </div>

              <div className="menu-card-body">
                <div className="menu-card-header">
                  <h4>{item.name}</h4>
                  <span
                    className={`status-dot ${getStatusClass(item.status)}`}
                  ></span>
                </div>
                <p className="menu-card-category">
                  {getCategoryName(item.category_id)}
                </p>
                <p className="menu-card-desc">
                  {item.description || "Chưa có mô tả."}
                </p>
                <div className="menu-card-meta">
                  <span className="menu-card-price">
                    {Number(item.price).toLocaleString()}đ
                  </span>
                  <span
                    className="menu-card-prep"
                    style={{ fontSize: 13, color: "#95a5a6" }}
                  >
                    ⏱️ {item.prep_time_minutes || 0}p
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 15,
                    fontSize: 13,
                    color: "#95a5a6",
                    marginBottom: 15,
                  }}
                >
                  <span>{item.is_recommended ? "★ 5.0" : "★ 4.5"}</span>
                  <span>{item.order_count || 0} đã bán</span>
                </div>
                <div className="menu-card-actions">
                  <button
                    className="btn-icon"
                    title="Sửa"
                    onClick={() => handleOpenEdit(item)}
                  >
                    ✎
                  </button>
                  <button
                    className="btn-icon"
                    title="Nhân bản"
                    onClick={() => handleDuplicate(item)}
                  >
                    📋
                  </button>
                  <button
                    className="btn-icon danger"
                    title="Xóa"
                    onClick={() => handleDelete(item.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 40,
              color: "#999",
            }}
          >
            Không tìm thấy món ăn nào.
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            ← Trang trước
          </button>
          <span className="page-info">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Trang sau →
          </button>
        </div>
      )}

      {/* --- MODAL WITH TABS --- */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 0, width: 600, maxWidth: "95%" }}
          >
            {/* Header */}
            <div
              style={{ padding: "20px 30px", borderBottom: "1px solid #eee" }}
            >
              <h2 style={{ margin: 0 }}>
                {isEditMode ? "Chỉnh Sửa Món" : "Thêm Món Mới"}
              </h2>
            </div>

            {/* Tabs Navigation */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #eee",
                background: "#f9f9f9",
              }}
            >
              {["info", "photos", "modifiers"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    background: activeTab === tab ? "#fff" : "transparent",
                    borderBottom:
                      activeTab === tab ? "2px solid var(--primary)" : "none",
                    fontWeight: activeTab === tab ? 600 : 400,
                    color: activeTab === tab ? "var(--primary)" : "#666",
                    cursor: "pointer",
                  }}
                >
                  {tab === "info" && "Thông Tin Chung"}
                  {tab === "photos" && `Hình Ảnh (${formData.photos.length})`}
                  {tab === "modifiers" &&
                    `Topping / Tùy Chọn (${formData.modifier_group_ids.length})`}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave}>
              <div
                style={{ padding: 30, maxHeight: "60vh", overflowY: "auto" }}
              >
                {/* TAB 1: INFO */}
                {activeTab === "info" && (
                  <>
                    <div className="form-group">
                      <label className="form-label">
                        Tên món ăn (2-80 ký tự)
                      </label>
                      <input
                        className="form-input"
                        required
                        minLength={2}
                        maxLength={80}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Nhập tên món ăn..."
                      />
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 15,
                      }}
                    >
                      <div className="form-group">
                        <label className="form-label">Danh mục</label>
                        <select
                          className="form-input"
                          required
                          value={formData.category_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category_id: e.target.value,
                            })
                          }
                        >
                          <option value="">-- Chọn --</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Giá (VNĐ)</label>
                        <input
                          type="number"
                          className="form-input"
                          required
                          min="0"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              price: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    {/*Thời gian chuẩn bị & Trạng thái */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 15,
                      }}
                    >
                      <div className="form-group">
                        <label className="form-label">
                          Thời gian chuẩn bị (phút)
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          max="240"
                          required
                          value={formData.prep_time_minutes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              prep_time_minutes: Number(e.target.value),
                            })
                          }
                        />
                        <small style={{ color: "#95a5a6", fontSize: "11px" }}>
                          Tối đa 240 phút (4 tiếng)
                        </small>
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
                          <option value="active">Đang bán (Available)</option>
                          <option value="sold_out">Hết hàng (Sold Out)</option>
                          <option value="inactive">
                            Ngừng bán (Unavailable)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mô tả ngắn</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      ></textarea>
                    </div>

                    <div
                      className="form-group"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        paddingTop: 10,
                      }}
                    >
                      <input
                        type="checkbox"
                        id="recommend"
                        checked={formData.is_recommended}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_recommended: e.target.checked,
                          })
                        }
                        style={{ width: 20, height: 20, marginRight: 10 }}
                      />
                      <label
                        htmlFor="recommend"
                        style={{ cursor: "pointer", fontWeight: 500 }}
                      >
                        🔥 Món ngon (Chef Recommended)
                      </label>
                    </div>
                  </>
                )}

                {/* TAB 2: PHOTOS */}
                {activeTab === "photos" && (
                  <div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
                      <input
                        className="form-input"
                        placeholder="Dán link ảnh vào đây (URL)..."
                        value={tempPhotoUrl}
                        onChange={(e) => setTempPhotoUrl(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleAddPhoto}
                      >
                        Thêm
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(100px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {formData.photos.map((photo) => (
                        <div
                          key={photo.id}
                          style={{
                            position: "relative",
                            border: photo.is_primary
                              ? "2px solid var(--primary)"
                              : "1px solid #ddd",
                            borderRadius: 8,
                            overflow: "hidden",
                            height: 100,
                          }}
                        >
                          <img
                            src={photo.url}
                            alt="Food"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: "rgba(0,0,0,0.6)",
                              display: "flex",
                              justifyContent: "center",
                              padding: 5,
                            }}
                          >
                            <button
                              type="button"
                              title="Đặt làm ảnh chính"
                              onClick={() => handleSetPrimaryPhoto(photo.id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: photo.is_primary ? "#f1c40f" : "#fff",
                                cursor: "pointer",
                                fontSize: 16,
                              }}
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              title="Xóa"
                              onClick={() => handleRemovePhoto(photo.id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#e74c3c",
                                cursor: "pointer",
                                fontSize: 16,
                                marginLeft: 10,
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                      {formData.photos.length === 0 && (
                        <p
                          style={{
                            gridColumn: "1/-1",
                            color: "#999",
                            textAlign: "center",
                          }}
                        >
                          Chưa có ảnh nào.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: MODIFIERS */}
                {activeTab === "modifiers" && (
                  <div>
                    <p style={{ marginBottom: 15, color: "#666" }}>
                      Chọn các nhóm tùy chọn áp dụng cho món này:
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {modifierGroups.length > 0 ? (
                        modifierGroups.map((group) => (
                          <div
                            key={group.id}
                            style={{
                              padding: 10,
                              border: "1px solid #eee",
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <input
                              type="checkbox"
                              id={`mod-${group.id}`}
                              checked={formData.modifier_group_ids.includes(
                                group.id
                              )}
                              onChange={() =>
                                handleToggleModifierGroup(group.id)
                              }
                              style={{ width: 18, height: 18, marginRight: 15 }}
                            />
                            <label
                              htmlFor={`mod-${group.id}`}
                              style={{
                                cursor: "pointer",
                                flex: 1,
                                fontWeight: 500,
                              }}
                            >
                              {group.name}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: "#999" }}>
                          Chưa có nhóm Modifier nào. Hãy sang trang Modifiers để
                          tạo.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div
                style={{
                  padding: "20px 30px",
                  borderTop: "1px solid #eee",
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  background: "#fff",
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ minWidth: 120 }}
                >
                  {isEditMode ? "Lưu Thay Đổi" : "Tạo Món"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
