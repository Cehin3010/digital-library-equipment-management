import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import CatalogPage from './pages/repository/CatalogPage';
import ResourceManagePage from './pages/librarian/ResourceManagePage';
import ReportDashboardPage from './pages/reports/ReportDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* W2: Không gian Tra cứu, Lịch trống & Đọc tài liệu số */}
            <Route path="/" element={<CatalogPage />} />
            <Route path="/catalog" element={<CatalogPage />} />

            {/* W6: Quản lý Kho Tài nguyên cho Thủ thư */}
            <Route path="/librarian/resources" element={<ResourceManagePage />} />

            {/* Báo cáo & Thống kê thời gian thực */}
            <Route path="/reports" element={<ReportDashboardPage />} />

            {/* Điều hướng mặc định */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
