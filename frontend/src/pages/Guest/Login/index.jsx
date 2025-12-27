import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../../../assets/guest.css';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phoneOrEmail: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      
      // MOCK DATA: Theo đúng cấu trúc bảng customers
      const mockResponse = {
        token: "MOCK_CUSTOMER_JWT_TOKEN",
        customer: {
          id: "cust-001",
          fullName: "Nguyễn Văn A",
          phone: "0909123456",
          tier: "bronze",
          totalPoints: 120
        }
      };

      // Lưu JWT và thông tin dành riêng cho Customer
      localStorage.setItem("customerToken", mockResponse.token);
      localStorage.setItem("customerInfo", JSON.stringify(mockResponse.customer));
      
      toast.success(`Chào mừng trở lại, ${mockResponse.customer.fullName}!`);
      
      // Điều hướng về Menu khách
      navigate('/menu/guest');

    } catch (error) {
      toast.error(error.response?.data?.error || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container" style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', minHeight: '100vh' }}>
      {/* Logo Section */}
      <div style={{ textAlign: 'center', padding: '60px 20px 40px' }}>
        <div style={{ fontSize: '60px', marginBottom: '15px' }}>🍽️</div>
        <div style={{ color: 'white', fontSize: '28px', fontWeight: '700' }}>Smart Restaurant</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '5px' }}>Scan. Order. Enjoy.</div>
      </div>

      {/* Login Form Section */}
      <div style={{ background: 'white', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '40px 25px', minHeight: '60vh' }}>
        <h2 style={{ margin: '0 0 30px', fontSize: '24px', color: '#2c3e50' }}>Chào mừng trở lại</h2>

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', color: '#7f8c8d' }}>Email hoặc Số điện thoại</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="0909xxxxxx hoặc you@example.com"
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', outline: 'none' }}
              value={formData.phoneOrEmail}
              onChange={(e) => setFormData({...formData, phoneOrEmail: e.target.value})}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', color: '#7f8c8d' }}>Mật khẩu</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Nhập mật khẩu"
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', outline: 'none' }}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '25px' }}>
            <span style={{ color: '#e74c3c', textDecoration: 'none', fontSize: '14px', cursor: 'pointer' }}>Quên mật khẩu?</span>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '15px', background: '#e74c3c', color: '#fff', 
              border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', 
              cursor: 'pointer', marginBottom: '20px', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '25px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#dfe6e9' }}></div>
          <span style={{ color: '#7f8c8d', fontSize: '14px' }}>hoặc</span>
          <div style={{ flex: 1, height: '1px', background: '#dfe6e9' }}></div>
        </div>

        {/* Social Login */}
        <button style={{ 
          width: '100%', padding: '12px', background: 'white', border: '2px solid #dfe6e9', 
          borderRadius: '12px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '30px'
        }}>
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" 
            alt="Google" 
            width="20"
            height="20"
            onError={(e) => { e.target.src = "https://www.google.com/favicon.ico" }} // Dự phòng nếu link chính lỗi
          />
          Tiếp tục với Google
        </button>

        {/* Sign Up Link */}
        <div style={{ textAlign: 'center', marginBottom: '15px', color: '#7f8c8d' }}>
          Chưa có tài khoản?{' '}
          <span style={{ color: '#e74c3c', fontWeight: '600', cursor: 'pointer' }}>Đăng ký</span>
        </div>

        {/* Continue as Guest */}
        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
          <Link to="/menu/guest" style={{ color: '#7f8c8d', textDecoration: 'none', fontSize: '14px' }}>
            Tiếp tục với tư cách khách vãng lai &#8594;
          </Link>
        </div>
      </div>
    </div>
  );
}