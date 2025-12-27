import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../assets/guest.css";
import { menuApi } from "../../../api/menu.api";
import Loading from "../../../components/Loading";
import toast from "react-hot-toast";

export default function GuestMenu() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // States Filter
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Quản lý món đang xem chi tiết (Modal)
  const [selectedItem, setSelectedItem] = useState(null);

  // Quản lý lựa chọn Topping và Tính tiền
  const [selectedOptions, setSelectedOptions] = useState({}); // { groupId: [optionObject, ...] }

  // Kiểm tra quyền Admin để hiển thị nút quay lại nhanh
  const isAdmin =
    localStorage.getItem("accessToken") || localStorage.getItem("admin_token");

  // Chuẩn hóa URL ảnh: nếu là đường dẫn tương đối (/uploads/...), thêm origin của backend
  const apiBaseURL =
    import.meta.env.VITE_API_URL || "http://localhost:4000/api";
  const backendOrigin = apiBaseURL.replace(/\/api\/?$/, "");
  const normalizeUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return backendOrigin + url;
    return url;
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // Gọi public menu endpoint (trả về data theo danh mục)
        const menuRes = await menuApi.getPublicMenu();
        const menuData = menuRes.data?.data || [];

        // Flatten categories + items từ response
        const allCats = [];
        const allItems = [];
        const allMods = {};

        menuData.forEach((cat) => {
          allCats.push({ id: cat.id, name: cat.name });
          if (cat.items && Array.isArray(cat.items)) {
            cat.items.forEach((item) => {
              allItems.push({
                id: item.id,
                name: item.name,
                price: item.price,
                category_id: item.category_id,
                status: item.status || "available",
                description: item.description,
                is_recommended: item.is_chef_recommended,
                photos: item.photos || [],
                modifier_group_ids: item.modifiers
                  ? item.modifiers.map((m) => m.id)
                  : [],
              });
              // Ghép modifiers
              if (item.modifiers && Array.isArray(item.modifiers)) {
                item.modifiers.forEach((mod) => {
                  if (!allMods[mod.id]) {
                    allMods[mod.id] = {
                      id: mod.id,
                      name: mod.name,
                      selection_type:
                        mod.selection_type === "single" ? "single" : "multi",
                      options: mod.options || [],
                    };
                  }
                });
              }
            });
          }
        });

        setCategories(allCats);
        setItems(allItems);
        setModifierGroups(Object.values(allMods));
      } catch (error) {
        console.log("Guest: Lỗi load API, dùng Mock Data", error);
        setCategories([
          { id: 1, name: "Món Khai Vị" },
          { id: 2, name: "Món Chính" },
          { id: 3, name: "Đồ Uống" },
          { id: 4, name: "Tráng Miệng" },
        ]);

        setModifierGroups([
          {
            id: 1,
            name: "Kích cỡ (Size)",
            selection_type: "single",
            options: [
              { name: "M", price: 0 },
              { name: "L", price: 10000 },
            ],
          },
          {
            id: 3,
            name: "Topping",
            selection_type: "multi",
            options: [
              { name: "Trân châu đen", price: 5000 },
              { name: "Thạch trái cây", price: 5000 },
            ],
          },
        ]);

        setItems([
          {
            id: 1,
            name: "Bò Bít Tết Sốt Tiêu",
            price: 250000,
            category_id: 2,
            status: "active",
            order_count: 150,
            is_recommended: true,
            description:
              "Thịt bò nhập khẩu mềm ngon, sốt tiêu đen đậm đà, kèm khoai tây và salad.",
            photos: [
              {
                id: 1,
                url: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800",
                is_primary: true,
              },
            ],
            modifier_group_ids: [],
          },
          {
            id: 3,
            name: "Trà Sữa Trân Châu",
            price: 45000,
            category_id: 3,
            status: "active",
            order_count: 500,
            is_recommended: true,
            description:
              "Trà sữa truyền thống nấu từ trà lá đậm vị, kết hợp sữa béo ngậy.",
            photos: [
              {
                id: 3,
                url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800",
                is_primary: true,
              },
            ],
            modifier_group_ids: [1, 3],
          },
          {
            id: 4,
            name: "Bánh Flan Caramel",
            price: 25000,
            category_id: 4,
            status: "sold_out",
            order_count: 230,
            is_recommended: false,
            description:
              "Bánh flan mềm mịn, sốt caramel đắng nhẹ đúng điệu kiểu Pháp.",
            photos: [
              {
                id: 4,
                url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800",
                is_primary: true,
              },
            ],
            modifier_group_ids: [],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Reset lựa chọn khi đóng/mở modal món khác
  useEffect(() => {
    setSelectedOptions({});
  }, [selectedItem]);

  const handleOptionChange = (groupId, option, selectionType) => {
    const currentOptions = { ...selectedOptions };

    if (selectionType === "single") {
      currentOptions[groupId] = [option];
    } else {
      const existing = currentOptions[groupId] || [];
      const isSelected = existing.some((item) => item.name === option.name);

      if (isSelected) {
        currentOptions[groupId] = existing.filter(
          (item) => item.name !== option.name
        );
      } else {
        currentOptions[groupId] = [...existing, option];
      }
    }
    setSelectedOptions(currentOptions);
  };

  const calculateTotalPrice = () => {
    if (!selectedItem) return 0;
    let extraPrice = 0;
    Object.values(selectedOptions).forEach((optionsArray) => {
      optionsArray.forEach((opt) => {
        extraPrice += opt.price || opt.price_adjustment || 0;
      });
    });
    return selectedItem.price + extraPrice;
  };

  const filteredItems = items.filter((item) => {
    const matchSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchCat =
      activeCategory === "All" || item.category_id === activeCategory;
    const isVisible = ["active", "available", "sold_out"].includes(item.status);
    return matchSearch && matchCat && isVisible;
  });

  const getPrimaryImage = (item) => {
    if (item?.photos && item.photos.length > 0) {
      const primary = item.photos.find((p) => p.is_primary);
      const raw = primary ? primary.url : item.photos[0].url;
      return normalizeUrl(raw);
    }
    return "";
  };

  const getItemModifiers = (item) => {
    if (!item.modifier_group_ids) return [];
    return modifierGroups.filter((group) =>
      item.modifier_group_ids.includes(group.id)
    );
  };

  if (loading) return <Loading />;

  return (
    <div className="mobile-container">
      {/* --- HEADER --- */}
      <div className="guest-header" style={{ position: "relative" }}>
        {/* Nút Quay lại Admin dành cho Dev/Admin test nhanh */}
        {isAdmin && (
          <button
            onClick={() => navigate("/admin/menu/items")}
            style={{
              position: "absolute",
              left: "15px",
              top: "15px",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "15px",
              padding: "4px 10px",
              fontSize: "11px",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            ⬅ Admin
          </button>
        )}

        <div style={{ textAlign: "right", marginBottom: "5px" }}>
          <button
            onClick={() => navigate("/guest/login")}
            style={{
              background: "#e74c3c",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            Đăng nhập tích điểm
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <span className="header-title">Smart Restaurant</span>
          <span className="header-table">Bàn số 5</span>
        </div>
      </div>

      {/* --- SEARCH --- */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="&#128269; Tìm món ăn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* --- CATEGORY TABS --- */}
      <div className="category-tabs">
        <button
          className={`category-tab ${activeCategory === "All" ? "active" : ""}`}
          onClick={() => setActiveCategory("All")}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${
              activeCategory === cat.id ? "active" : ""
            }`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* --- MENU LIST --- */}
      <div className="menu-list">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              className="menu-item"
              key={item.id}
              onClick={() => setSelectedItem(item)}
            >
              <div className="menu-item-image">
                {item.is_recommended && (
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      background: "#f1c40f",
                      color: "#fff",
                      fontSize: 10,
                      padding: "2px 6px",
                      borderBottomRightRadius: 8,
                      fontWeight: "bold",
                      zIndex: 1,
                    }}
                  >
                    ★ Hot
                  </span>
                )}
                {getPrimaryImage(item) ? (
                  <img
                    src={getPrimaryImage(item)}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/240x160?text=No+Image";
                    }}
                  />
                ) : (
                  <span>🍽️</span>
                )}
              </div>

              <div className="menu-item-info">
                <div>
                  <div className="menu-item-name">{item.name}</div>
                  <div className="menu-item-desc">{item.description}</div>
                  <div className="menu-item-rating">
                    ★ 4.5 <span style={{ color: "#95a5a6" }}>(100+)</span>
                  </div>
                  {item.status === "sold_out" && (
                    <span className="menu-item-status sold-out">
                      Hết hàng hôm nay
                    </span>
                  )}
                </div>

                <div className="menu-item-bottom">
                  <span className="menu-item-price">
                    {item.price.toLocaleString()}đ
                  </span>
                  {item.status !== "sold_out" && (
                    <button
                      className="add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                    >
                      + Thêm
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: 30, color: "#999" }}>
            Không tìm thấy món nào.
          </div>
        )}
      </div>

      {/* --- ITEM DETAIL MODAL (BOTTOM SHEET) --- */}
      {selectedItem && (
        <div
          className="item-detail-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="item-detail-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-sheet"
              onClick={() => setSelectedItem(null)}
            >
              &times;
            </button>

            <div className="detail-image" style={{ position: "relative" }}>
              {getPrimaryImage(selectedItem) ? (
                <img src={getPrimaryImage(selectedItem)} alt="" />
              ) : (
                <div
                  style={{
                    fontSize: 50,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  🍽️
                </div>
              )}
            </div>

            <div className="detail-body">
              <div className="detail-header">
                <h2>{selectedItem.name}</h2>
                <span className="detail-price">
                  {selectedItem.price.toLocaleString()}đ
                </span>
              </div>
              <p className="detail-desc">{selectedItem.description}</p>

              <div className="modifiers-section">
                {getItemModifiers(selectedItem).map((group) => (
                  <div key={group.id} className="modifier-group">
                    <div className="mod-group-header">
                      <span className="mod-group-name">{group.name}</span>
                      <span className="mod-group-type">
                        {group.selection_type === "single"
                          ? "Chọn 1"
                          : "Được chọn nhiều"}
                      </span>
                    </div>
                    <div className="mod-options">
                      {group.options.map((opt, idx) => (
                        <label key={idx} className="mod-option-item">
                          <input
                            type={
                              group.selection_type === "single"
                                ? "radio"
                                : "checkbox"
                            }
                            name={`group-${group.id}`}
                            checked={(selectedOptions[group.id] || []).some(
                              (item) => item.name === opt.name
                            )}
                            onChange={() =>
                              handleOptionChange(
                                group.id,
                                opt,
                                group.selection_type
                              )
                            }
                          />
                          <div className="mod-option-info">
                            <span>{opt.name}</span>
                            {(opt.price || opt.price_adjustment) > 0 && (
                              <span className="opt-price">
                                +
                                {(
                                  opt.price ||
                                  opt.price_adjustment ||
                                  0
                                ).toLocaleString()}
                                đ
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-footer">
              <button
                className="confirm-add-btn"
                disabled={selectedItem.status === "sold_out"}
                onClick={() => {
                  toast.success(`Đã thêm ${selectedItem.name} vào giỏ hàng!`);
                  setSelectedItem(null);
                }}
              >
                {selectedItem.status === "sold_out"
                  ? "Tạm hết hàng"
                  : `Thêm vào giỏ - ${calculateTotalPrice().toLocaleString()}đ`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BOTTOM NAV --- */}
      <div className="bottom-nav">
        <div className="nav-item active">
          <span className="nav-icon">&#127968;</span>
          <span>Menu</span>
        </div>
        <div
          className="nav-item"
          style={{ position: "relative" }}
          onClick={() => navigate("/guest/login")}
        >
          <span className="nav-icon">&#128722;</span>
          <span className="nav-badge">2</span>
          <span>Giỏ hàng</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">&#128203;</span>
          <span>Đơn hàng</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/guest/login")}>
          <span className="nav-icon">&#128100;</span>
          <span>Tôi</span>
        </div>
      </div>
    </div>
  );
}
