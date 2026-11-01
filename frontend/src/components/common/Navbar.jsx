import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Clock3,
  DoorOpen,
  Library,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  X,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const currentRole = user?.role?.role_name || user?.role_name || user?.role || '';
  const currentProfile = {
    name: user?.full_name || user?.email || 'Tài khoản khách',
    code: user?.user_code || currentRole || 'Chưa đăng nhập',
  };
  const groups = [
    {
      label: 'Bạn đọc',
      roles: ['STUDENT', 'LECTURER', 'LIBRARIAN', 'ADMIN'],
      links: [
        { path: '/', label: 'Tra cứu tài nguyên', icon: BookOpen },
        { path: '/rooms/schedule', label: 'Lịch và đặt phòng', icon: DoorOpen, roles: ['STUDENT', 'LECTURER'] },
        { path: '/my-loans', label: 'Phiếu mượn của tôi', icon: Clock3, roles: ['STUDENT', 'LECTURER'] },
        { path: '/my-history', label: 'Lịch sử và công nợ', icon: Clock3, roles: ['STUDENT', 'LECTURER'] },
      ],
    },
    {
      label: 'Nghiệp vụ',
      roles: ['LIBRARIAN', 'ADMIN', 'LECTURER'],
      links: [
        { path: '/librarian/resources', label: 'Quản lý tài nguyên', icon: Library, roles: ['LIBRARIAN', 'ADMIN'] },
        { path: '/librarian/circulation', label: 'Quầy mượn – trả', icon: ClipboardCheck, roles: ['LIBRARIAN', 'ADMIN'] },
        { path: '/reports', label: 'Báo cáo', icon: BarChart3 },
      ],
    },
    {
      label: 'Quản trị',
      roles: ['ADMIN'],
      links: [{ path: '/admin/users', label: 'Tài khoản, cấu hình & nhật ký', icon: ShieldCheck }],
    },
  ];
  const visibleGroups = groups
    .filter((group) => group.roles.includes(currentRole))
    .map((group) => ({
      ...group,
      links: group.links.filter((item) => !item.roles || item.roles.includes(currentRole)),
    }))
    .filter((group) => group.links.length > 0);

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await logout();
    } catch (error) {
      setLogoutError(error.message || 'Đã xóa phiên đăng nhập nhưng chưa thể thông báo đăng xuất cho máy chủ.');
    }
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const isActive = (path) => path === '/'
    ? location.pathname === '/' || location.pathname === '/catalog'
    : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold text-slate-900">Thư viện Số Đại học</span>
            <span className="hidden text-[11px] font-medium text-slate-500 sm:block">Học liệu và tài sản</span>
          </span>
        </Link>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          <NotificationBell />
          {isLoading ? (
            <span className="text-xs text-slate-500">Đang kiểm tra phiên...</span>
          ) : isAuthenticated ? (
            <>
              <span className="hidden max-w-40 truncate text-xs font-semibold text-slate-600 xl:block" title={currentProfile.name}>{currentProfile.name}</span>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Đăng xuất"
                title="Đăng xuất"
                className="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 sm:w-auto sm:px-3"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="hidden text-xs font-semibold sm:inline">Đăng xuất</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                aria-label="Đăng nhập bằng OTP"
                title="Đăng nhập bằng OTP"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <LogIn className="h-5 w-5" />
              </Link>
            </>
          )}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Mở điều hướng"
              aria-expanded={menuOpen}
              aria-controls="primary-navigation"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {logoutError && <p role="alert" className="border-t border-rose-100 bg-rose-50 px-4 py-1 text-center text-xs text-rose-700">{logoutError}</p>}

      <div className="border-t border-amber-100 bg-amber-50/80 px-4 py-1 text-center text-[10px] font-medium text-amber-800 sm:text-xs">
        {isAuthenticated ? `Đã đăng nhập · ${currentRole}` : 'Đăng nhập bằng email trường để sử dụng các chức năng thư viện.'}
      </div>
      {createPortal(
        <div
          className={`fixed inset-0 z-50 overflow-hidden transition ${menuOpen ? 'visible' : 'invisible delay-200'}`}
          aria-hidden={!menuOpen}
        >
          <button
            type="button"
            tabIndex={menuOpen ? 0 : -1}
            aria-label="Đóng điều hướng"
            onClick={() => setMenuOpen(false)}
            className={`absolute inset-0 h-full w-full bg-slate-950/40 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          />
          <nav
            id="primary-navigation"
            aria-label="Điều hướng chính"
            inert={!menuOpen ? '' : undefined}
            className={`absolute inset-y-0 right-0 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
              menuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <UserRound className="h-5 w-5" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-bold text-slate-900">{currentProfile.name}</span>
                  <span className="block text-xs text-slate-500">{currentProfile.code}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Đóng điều hướng"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {visibleGroups.map((group) => (
                <section key={group.label} className="mb-5 last:mb-0">
                  <h2 className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{group.label}</h2>
                  <div className="space-y-1">
                    {group.links.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                            isActive(item.path)
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </nav>
        </div>,
        document.body,
      )}
    </header>
  );
}
