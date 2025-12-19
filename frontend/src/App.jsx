import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // Component thông báo

// Import trang chính của bạn (nó sẽ tự tìm file index.jsx)
import AdminTables from "./pages/AdminTables";
import MenuVerify from "./pages/MenuVerify";

// Giả sử bạn có layout chung (nếu chưa có thì bỏ qua bọc Layout)
// import AdminLayout from './components/layouts/AdminLayout';

function App() {
  return (
    // 1. BrowserRouter bọc toàn bộ ứng dụng
    <BrowserRouter>
      {/* 2. Toaster để hiển thị thông báo ở góc màn hình (dùng cho các file hook/api) */}
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        {/* Redirect trang chủ về trang admin tables để tiện Demo */}
        <Route path="/" element={<Navigate to="/admin/tables" replace />} />

        {/* Route chính của bài Assignment */}
        <Route path="/admin/tables" element={<AdminTables />} />

        {/* Route cho khách hàng quét QR */}
        <Route path="/menu" element={<MenuVerify />} />

        {/* Route 404 nếu nhập sai link */}
        <Route
          path="*"
          element={<div className="p-10 text-center">404 - Not Found</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
