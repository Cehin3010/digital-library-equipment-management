import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ClipboardList, LoaderCircle, Plus, RefreshCw, Save, Search, Settings2, ShieldCheck, Users } from 'lucide-react';
import {
  createAdminUser,
  getAdminUsers,
  getAuditLogs,
  getSystemSettings,
  updateAdminUser,
  updateSystemSettings,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'users', label: 'Tài khoản', icon: Users },
  { id: 'settings', label: 'Tham số hệ thống', icon: Settings2 },
  { id: 'audit', label: 'Nhật ký kiểm toán', icon: ClipboardList },
];

const ROLES = ['STUDENT', 'LECTURER', 'LIBRARIAN', 'ADMIN'];
const SETTINGS = [
  { key: 'MAX_ACTIVE_LOANS', label: 'Số lượt mượn tối đa', min: 1 },
  { key: 'FINE_PER_DAY', label: 'Đơn giá phạt mỗi ngày (VNĐ)', min: 0 },
  { key: 'HOLD_MINUTES', label: 'Thời gian giữ chỗ (phút)', min: 1 },
  { key: 'ROOM_CANCEL_HOURS', label: 'Thời gian tối thiểu để hủy phòng (giờ)', min: 0 },
  { key: 'DAMAGE_FINE', label: 'Phạt làm hỏng tài sản (VNĐ)', min: 0 },
  { key: 'LOST_FINE', label: 'Phạt làm mất tài sản (VNĐ)', min: 0 },
];

function getArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function roleName(user) {
  return user.role?.role_name || user.role_name || user.role || 'STUDENT';
}

function normalizeSettings(data) {
  const value = data?.settings ?? data;
  if (Array.isArray(value)) {
    return Object.fromEntries(value.map((item) => [item.key || item.setting_key, item.value ?? item.setting_value ?? '']));
  }
  return value && typeof value === 'object' ? value : {};
}

function showDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('vi-VN');
}

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    user_code: '',
    role_name: 'STUDENT',
  });

  const loadTab = useCallback(async (tab = activeTab) => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'users') {
        const response = await getAdminUsers();
        setUsers(getArray(response.data));
      } else if (tab === 'settings') {
        const response = await getSystemSettings();
        setSettings(normalizeSettings(response.data));
      } else {
        const response = await getAuditLogs();
        setAuditLogs(getArray(response.data));
      }
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải dữ liệu quản trị.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab, loadTab]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');
    return users.filter((user) => {
      const matchesRole = !roleFilter || roleName(user) === roleFilter;
      const searchable = [user.full_name, user.email, user.user_code, roleName(user)]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('vi');
      return matchesRole && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [query, roleFilter, users]);

  const addUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await createAdminUser({
        ...newUser,
        email: newUser.email.trim().toLowerCase(),
        full_name: newUser.full_name.trim(),
        user_code: newUser.user_code.trim(),
      });
      setNewUser({ email: '', full_name: '', user_code: '', role_name: 'STUDENT' });
      setShowCreateForm(false);
      setNotice('Đã gửi yêu cầu tạo tài khoản.');
      await loadTab('users');
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  const changeUser = async (user, changes) => {
    setBusyUserId(user.user_id);
    setError('');
    setNotice('');
    try {
      await updateAdminUser(user.user_id, changes);
      setNotice(`Đã cập nhật tài khoản ${user.user_code || user.email}.`);
      await loadTab('users');
    } catch (requestError) {
      setError(requestError.message || 'Không thể cập nhật tài khoản.');
    } finally {
      setBusyUserId(null);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await updateSystemSettings(settings);
      setNotice('Đã gửi yêu cầu cập nhật tham số hệ thống.');
      await loadTab('settings');
    } catch (requestError) {
      setError(requestError.message || 'Không thể lưu tham số hệ thống.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> Quản trị hệ thống
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Tài khoản, cấu hình và kiểm toán</h1>
          <p className="mt-1 text-sm text-slate-500">Chỉ dành cho quản trị viên. Các thay đổi được gửi tới API quản trị.</p>
        </div>
        <button type="button" onClick={() => loadTab()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </header>

      {(error || notice) && (
        <div role={error ? 'alert' : 'status'} className={`mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}
          {error || notice}
        </div>
      )}

      <div role="tablist" aria-label="Các chức năng quản trị" className="mb-5 flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => { setActiveTab(id); setError(''); setNotice(''); }} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === id ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <section className="min-h-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" /> Đang tải dữ liệu...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 py-12 text-center text-sm text-rose-800">
            Không thể hiển thị dữ liệu cho đến khi API tải thành công.
          </div>
        ) : activeTab === 'users' ? (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quản lý tài khoản</h2>
                <p className="text-xs text-slate-500">{users.length} tài khoản</p>
              </div>
              <button type="button" onClick={() => setShowCreateForm((open) => !open)} className="flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800">
                <Plus className="h-4 w-4" /> {showCreateForm ? 'Đóng' : 'Tạo tài khoản'}
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={addUser} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5">
                <label className="text-xs font-semibold text-slate-600">Họ và tên
                  <input required maxLength={100} value={newUser.full_name} onChange={(event) => setNewUser({ ...newUser, full_name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-slate-600">Email trường
                  <input required type="email" maxLength={100} value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-slate-600">Mã người dùng
                  <input required maxLength={20} value={newUser.user_code} onChange={(event) => setNewUser({ ...newUser, user_code: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-slate-600">Vai trò
                  <select value={newUser.role_name} onChange={(event) => setNewUser({ ...newUser, role_name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
                    {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
                <button disabled={saving} className="self-end rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                  {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </form>
            )}

            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr,14rem]">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, email hoặc mã số" className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm" />
              </label>
              <select aria-label="Lọc theo vai trò" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                <option value="">Tất cả vai trò</option>
                {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>

            {users.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">API chưa trả về tài khoản nào.</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">Không tìm thấy tài khoản phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="px-4 py-3">Người dùng</th><th className="px-4 py-3">Mã số</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Cập nhật</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((item) => {
                      const isCurrentUser = currentUser?.user_id && Number(currentUser.user_id) === Number(item.user_id);
                      const busy = busyUserId === item.user_id;
                      return (
                        <tr key={item.user_id}>
                          <td className="px-4 py-3"><p className="font-semibold text-slate-800">{item.full_name}</p><p className="text-xs text-slate-500">{item.email}</p></td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.user_code || '—'}</td>
                          <td className="px-4 py-3">
                            <select aria-label={`Vai trò ${item.email}`} disabled={busy || isCurrentUser} value={roleName(item)} onChange={(event) => changeUser(item, { role_name: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs disabled:bg-slate-100">
                              {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{item.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}</span></td>
                          <td className="px-4 py-3">
                            <button type="button" disabled={busy || isCurrentUser} onClick={() => changeUser(item, { status: item.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                              {busy ? 'Đang lưu...' : item.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          <form onSubmit={saveSettings}>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">Tham số hệ thống</h2>
              <p className="text-xs text-slate-500">Chỉ lưu các giá trị đã được tải từ API hoặc do quản trị viên nhập.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {SETTINGS.map(({ key, label, min }) => (
                <label key={key} className="rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-700">
                  {label}
                  <input
                    type="number"
                    min={min}
                    step="1"
                    value={settings[key] ?? ''}
                    placeholder="Chưa cấu hình"
                    onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.value }))}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                  />
                  <span className="mt-1 block font-mono text-[10px] text-slate-400">{key}</span>
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button disabled={saving} className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu tham số'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">Nhật ký kiểm toán</h2>
              <p className="text-xs text-slate-500">Lịch sử thao tác được API quản trị trả về.</p>
            </div>
            {auditLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">API chưa trả về bản ghi kiểm toán nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Người thực hiện</th><th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Đối tượng</th><th className="px-4 py-3">IP</th><th className="px-4 py-3">Chi tiết</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.log_id || log.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{showDate(log.created_at || log.timestamp)}</td>
                        <td className="px-4 py-3">{log.user?.full_name || log.user?.email || log.user_id || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{log.action || '—'}</td>
                        <td className="px-4 py-3">{[log.entity_type, log.entity_id].filter(Boolean).join(' #') || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs">{log.ip_address || '—'}</td>
                        <td className="max-w-xs px-4 py-3">
                          <details>
                            <summary className="cursor-pointer text-xs font-semibold text-emerald-700">Xem dữ liệu</summary>
                            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-[10px] text-slate-100">{JSON.stringify(log.details || log.old_values || {}, null, 2)}</pre>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
