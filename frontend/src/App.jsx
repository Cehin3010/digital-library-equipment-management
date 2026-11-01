import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import CatalogPage from './pages/CatalogPage';
import ResourceManagePage from './pages/ResourceManagePage';
import ReportDashboardPage from './pages/ReportDashboardPage';
import RoomSchedulePage from './pages/RoomSchedulePage';
import CirculationDeskPage from './pages/CirculationDeskPage';
import MyLoansPage from './pages/MyLoansPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import MyHistoryAndFinesPage from './pages/MyHistoryAndFinesPage';
import PaymentResultPage from './pages/PaymentResultPage';
import HoldConfirmPage from './pages/HoldConfirmPage';
import { AuthProvider, useAuth } from './context/AuthContext';

function RoleRoute({ allowedRoles, children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <div className="flex items-center justify-center py-24 text-sm text-slate-500">Đang kiểm tra phiên đăng nhập...</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role?.role_name || user?.role_name || user?.role;
  return allowedRoles.includes(role) ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
          <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<RoleRoute allowedRoles={['STUDENT', 'LECTURER', 'LIBRARIAN', 'ADMIN']}><CatalogPage /></RoleRoute>} />
                <Route path="/catalog" element={<RoleRoute allowedRoles={['STUDENT', 'LECTURER', 'LIBRARIAN', 'ADMIN']}><CatalogPage /></RoleRoute>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/my-history" element={<RoleRoute allowedRoles={['STUDENT', 'LECTURER']}><MyHistoryAndFinesPage /></RoleRoute>} />
                <Route path="/payments/result" element={<RoleRoute allowedRoles={['STUDENT', 'LECTURER']}><PaymentResultPage /></RoleRoute>} />
                <Route path="/rooms/schedule" element={<RoleRoute allowedRoles={['STUDENT', 'LECTURER']}><RoomSchedulePage /></RoleRoute>} />
                <Route path="/my-loans" element={<RoleRoute allowedRoles={['STUDENT', 'LECTURER']}><MyLoansPage /></RoleRoute>} />
                <Route path="/loans/hold/:id" element={<RoleRoute allowedRoles={['STUDENT', 'LECTURER']}><HoldConfirmPage /></RoleRoute>} />
                <Route path="/librarian/resources" element={<RoleRoute allowedRoles={['LIBRARIAN', 'ADMIN']}><ResourceManagePage /></RoleRoute>} />
                <Route path="/librarian/circulation" element={<RoleRoute allowedRoles={['LIBRARIAN', 'ADMIN']}><CirculationDeskPage /></RoleRoute>} />
                <Route path="/reports" element={<RoleRoute allowedRoles={['LIBRARIAN', 'ADMIN', 'LECTURER']}><ReportDashboardPage /></RoleRoute>} />
                <Route path="/admin/users" element={<RoleRoute allowedRoles={['ADMIN']}><AdminDashboardPage /></RoleRoute>} />
                <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
