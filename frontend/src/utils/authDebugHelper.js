/**
 * Auth Debug Helper
 * Copy & paste vào browser console (F12) để debug token issues
 */

// ===== 1. CHECK TOKEN STATUS =====
window.debugAuth = {
  // Kiểm tra token có tồn tại không
  checkToken: () => {
    const token = localStorage.getItem("admin_token");
    console.log("✅ Token exists:", !!token);
    if (token) {
      console.log("Token value:", token.substring(0, 20) + "...");
    }
    return token;
  },

  // Xem tất cả auth data
  showAllAuthData: () => {
    console.log("=== AUTH DATA ===");
    console.log("admin_token:", localStorage.getItem("admin_token"));
    console.log("role:", localStorage.getItem("role"));
    console.log("userEmail:", localStorage.getItem("userEmail"));
  },

  // Xóa token (logout)
  clearToken: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("role");
    localStorage.removeItem("userEmail");
    console.log("✅ Token cleared");
  },

  // Thử gọi API test
  testAPI: async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/admin/menu/modifier-groups",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
        }
      );
      console.log("Status:", response.status);
      const data = await response.json();
      console.log("Response:", data);
    } catch (err) {
      console.error("API Error:", err);
    }
  },

  // Decode JWT token (không cần thư viện ngoài)
  decodeToken: () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      console.log("❌ No token found");
      return null;
    }

    try {
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error("Invalid token format");

      // Decode payload (phần thứ 2)
      const decoded = JSON.parse(atob(parts[1]));
      console.log("=== TOKEN DECODED ===");
      console.log("User ID:", decoded.id);
      console.log("Email:", decoded.email);
      console.log("Role:", decoded.role);
      console.log("Expires at:", new Date(decoded.exp * 1000));
      console.log("Issued at:", new Date(decoded.iat * 1000));

      // Check nếu hết hạn
      if (decoded.exp * 1000 < Date.now()) {
        console.log("❌ TOKEN EXPIRED!");
      } else {
        console.log("✅ Token valid");
      }

      return decoded;
    } catch (err) {
      console.error("Cannot decode token:", err);
      return null;
    }
  },
};

// ===== 2. HOW TO USE =====
console.log(`
📋 AUTH DEBUG COMMANDS:
- window.debugAuth.checkToken()          // Check if token exists
- window.debugAuth.showAllAuthData()     // Show all stored auth data
- window.debugAuth.decodeToken()         // Decode & check token expiry
- window.debugAuth.testAPI()             // Test API call with token
- window.debugAuth.clearToken()          // Clear all auth data (logout)

📌 Example:
  window.debugAuth.checkToken();
  window.debugAuth.decodeToken();
  window.debugAuth.testAPI();
`);
