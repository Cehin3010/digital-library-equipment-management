import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Library, BarChart3, Settings, User } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Tra cứu & Đọc sách (W2)', icon: BookOpen },
    { path: '/librarian/resources', label: 'Quản lý Kho (W6)', icon: Library },
    { path: '/reports', label: 'Báo cáo & Thống kê', icon: BarChart3 },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-base leading-tight block">
                Thư viện Số Đại học
              </span>
              <span className="text-[11px] text-gray-400 font-medium block">
                Nền tảng Học liệu & Thiết bị
              </span>
            </div>
          </Link>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User profile snippet */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-gray-800">Nguyễn Anh Khoa</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                52400051 • Module 1 & 5
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
