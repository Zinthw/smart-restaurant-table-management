import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import toast from 'react-hot-toast';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // --- LẤY DỮ LIỆU THẬT TỪ LOCALSTORAGE ---
  // Lấy email và role đã lưu từ trang Login
  const userEmail = localStorage.getItem("userEmail") || "Admin User";
  const userRole = localStorage.getItem("role") || "Staff";
  // Lấy chữ cái đầu của Email để làm Avatar
  const avatarLetter = userEmail.charAt(0).toUpperCase();

  const allowedRoutes = [
    '/admin/menu/items',
    '/admin/menu/categories',
    '/admin/menu/modifiers',
    '/admin/tables'
  ];

  const isActive = (path) => location.pathname.startsWith(path) ? 'active' : '';

  // --- XỬ LÝ ĐĂNG XUẤT THẬT ---
  const handleLogout = (e) => {
    e.preventDefault();
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      // Xóa sạch dấu vết đăng nhập
      localStorage.removeItem("accessToken");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("role");
      localStorage.removeItem("userEmail");
      
      toast.success("Đã đăng xuất thành công");
      navigate("/admin/login"); // Đá về trang login
    }
  };

  const renderNavLink = (to, icon, label, badge = null) => {
    const isAllowed = allowedRoutes.includes(to);

    return (
      <Link 
        to={isAllowed ? to : '#'} 
        className={`nav-link ${isActive(to)}`}
        style={{
          opacity: isAllowed ? 1 : 0.5,
          cursor: isAllowed ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s'
        }}
        onClick={(e) => {
          if (!isAllowed) {
            e.preventDefault();
            toast("Tính năng này đang được phát triển", { icon: '🏗️' });
          }
        }}
      >
        <span className="nav-icon">{icon}</span> 
        {label}
        {badge && <span className="nav-badge" style={{opacity: isAllowed ? 1 : 0.5}}>{badge}</span>}
      </Link>
    );
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: '30px' }}>🍽️</span>
          <span>Smart Restaurant</span>
        </div>

        <nav className="sidebar-nav">
          {renderNavLink('/admin/dashboard', '📊', 'Dashboard')}
          {renderNavLink('/admin/orders', '📋', 'Orders', '5')}
          
          <div style={{margin: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.1)'}}></div>
          
          {renderNavLink('/admin/menu/items', '🍔', 'Menu Items')}
          {renderNavLink('/admin/menu/categories', '📂', 'Categories')}
          {renderNavLink('/admin/menu/modifiers', '✨', 'Modifiers')}
          
          <div style={{margin: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.1)'}}></div>

          {renderNavLink('/admin/tables', '🪑', 'Tables')}
          
          {renderNavLink('/admin/reports', '📈', 'Reports')}
          {renderNavLink('/admin/kds', '📺', 'Kitchen Display')}
        </nav>

        <div style={{ margin: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
          <Link 
            to="/menu/guest" 
            target="_blank" 
            className="nav-link"
            style={{ 
              color: '#ecf0f1', 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              borderRadius: '8px',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <span className="nav-icon" style={{ fontSize: '18px' }}>📱</span>
            <span style={{ fontWeight: '500' }}>Xem Menu Khách</span>
          </Link>

        <div className="sidebar-footer">
          <div className="admin-profile">
            {/* Avatar động theo tên user */}
            <div className="admin-avatar">{avatarLetter}</div>
            <div className="admin-info">
              {/* Tên và quyền hạn lấy từ Login */}
              <div className="admin-name" style={{ fontSize: '12px', wordBreak: 'break-all' }}>{userEmail}</div>
              <div className="admin-role" style={{ textTransform: 'capitalize' }}>{userRole}</div>
            </div>
          </div>
          {/* Nút logout thực tế */}
          <button 
            onClick={handleLogout} 
            className="logout-link" 
            style={{ 
              background: 'none', border: 'none', color: 'inherit', 
              font: 'inherit', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', width: '100%', padding: '10px 20px' 
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {children}
      </div>
    </div>
  );
}