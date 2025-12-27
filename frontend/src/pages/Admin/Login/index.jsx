import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../../../api/auth.api";
import toast from "react-hot-toast";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.login({ email, password });

      localStorage.setItem("admin_token", response.data.token);
      localStorage.setItem("role", response.data.user.role);
      localStorage.setItem("userEmail", response.data.user.email);

      toast.success("Đăng nhập thành công!");
      navigate("/admin/menu/items");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Đăng nhập thất bại";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container" style={{ background: "#f5f6fa", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="admin-login-box" style={{ background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", width: "100%", maxWidth: "400px" }}>
        
        {/* Logo & Header từ Mockup */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "50px", marginBottom: "15px" }}>🍽️</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#2c3e50" }}>Smart Restaurant</div>
          <div style={{ color: "#7f8c8d", fontSize: "14px" }}>Admin Dashboard</div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label" style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#2c3e50" }}>Email</label>
            <input
              type="email"
              className="form-input"
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", outline: "none" }}
              placeholder="admin@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label" style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#2c3e50" }}>Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", outline: "none" }}
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Extra Options từ Mockup */}
          <div style={{ display: "flex", justifyHeight: "space-between", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: 14, color: "#7f8c8d", cursor: "pointer" }}>
              <input type="checkbox" style={{ cursor: "pointer" }} />
              Ghi nhớ đăng nhập
            </label>
            <a href="#" style={{ color: "#e74c3c", textDecoration: "none", fontSize: "14px" }}>Quên mật khẩu?</a>
          </div>

          {error && (
            <div style={{ color: "#e74c3c", fontSize: "13px", textAlign: "center", marginBottom: "15px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.3s",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Đang xử lý..." : "Đăng nhập vào Dashboard"}
          </button>
        </form>

        {/* Footer từ Mockup */}
        <div style={{ textAlign: "center", marginTop: "30px", color: "#7f8c8d", fontSize: "13px" }}>
          &copy; 2025 Smart Restaurant. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;