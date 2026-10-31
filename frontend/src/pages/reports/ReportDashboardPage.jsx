import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  BookOpen,
  Laptop,
  Layers,
  DoorOpen,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  CheckCircle2,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import { getDashboardStats, exportReport } from '../../services/api';

export default function ReportDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bộ lọc xuất báo cáo F-10
  const [exportType, setExportType] = useState('usage');
  const [exportFormat, setExportFormat] = useState('csv');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadStats = () => {
    setLoading(true);
    setError(null);
    getDashboardStats()
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        setError(err.message || 'Không thể tải thống kê Dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleExport = () => {
    exportReport({
      type: exportType,
      format: exportFormat,
      start_date: startDate,
      end_date: endDate,
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Đang tổng hợp số liệu thời gian thực...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <h3 className="font-bold text-lg mb-1">Không thể tải báo cáo</h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadStats}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const byType = stats?.by_type || {};
  const penalties = stats?.penalties || {};
  const topResources = stats?.top_resources || [];
  const monthlyTrend = stats?.monthly_trend || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">
            Báo cáo Thống kê & Phân tích Học liệu (F-09, F-10)
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Dashboard Báo cáo Thời gian thực
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Dành cho Cán bộ Thư viện, Giảng viên & Quản trị viên theo dõi tỷ lệ luân chuyển tài sản.
          </p>
        </div>

        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới số liệu
        </button>
      </div>

      {/* 4 Thẻ chỉ số tổng quan (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Tổng số tài nguyên</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{overview.total_resources || 0}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {overview.active_resources || 0} đang phục vụ
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Tỷ lệ đang mượn</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{overview.lending_rate || 0}%</h3>
            <p className="text-xs text-gray-500 mt-1">
              {overview.total_borrowed_quantity || 0} / {overview.total_physical_quantity || 0} hiện vật
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Kho tài liệu số</p>
            <h3 className="text-2xl font-black text-purple-600 mt-1">{byType.DIGITAL || 0}</h3>
            <p className="text-xs text-gray-500 mt-1">Đọc trực tuyến 24/7</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Công nợ phạt chưa đóng</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">
              {new Intl.NumberFormat('vi-VN').format(penalties.unpaid_amount || 0)}đ
            </h3>
            <p className="text-xs text-rose-600 font-medium mt-1">
              {penalties.unpaid_count || 0} phiếu vi phạm
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Biểu đồ xu hướng & Cơ cấu phân loại */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Biểu đồ xu hướng mượn trả 6 tháng */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" /> Xu hướng Mượn & Trả (6 tháng gần nhất)
            </h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm" /> Lượt mượn
              </span>
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 bg-blue-500 rounded-sm" /> Lượt trả
              </span>
            </div>
          </div>

          {monthlyTrend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Chưa có dữ liệu giao dịch 6 tháng gần nhất
            </div>
          ) : (
            <div className="h-56 flex items-end justify-between gap-4 pt-4 border-b border-gray-100">
              {monthlyTrend.map((m, idx) => {
                const maxVal = Math.max(
                  ...monthlyTrend.map((item) => Math.max(item.borrow_count, item.return_count, 1))
                );
                const borrowHeight = Math.round((m.borrow_count / maxVal) * 160) || 6;
                const returnHeight = Math.round((m.return_count / maxVal) * 160) || 6;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center gap-1.5 h-44">
                      {/* Cột lượt mượn */}
                      <div
                        style={{ height: `${borrowHeight}px` }}
                        className="w-4 bg-emerald-500 rounded-t-md hover:bg-emerald-600 transition"
                        title={`Lượt mượn: ${m.borrow_count}`}
                      />
                      {/* Cột lượt trả */}
                      <div
                        style={{ height: `${returnHeight}px` }}
                        className="w-4 bg-blue-500 rounded-t-md hover:bg-blue-600 transition"
                        title={`Lượt trả: ${m.return_count}`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Thống kê phân loại cơ cấu tài nguyên */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" /> Cơ cấu Kho Tài nguyên
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4 text-emerald-500" /> Sách in (BOOK)
                </span>
                <strong className="text-gray-900">{byType.BOOK || 0} tựa</strong>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4 text-purple-500" /> Tài liệu số (DIGITAL)
                </span>
                <strong className="text-gray-900">{byType.DIGITAL || 0} file</strong>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <Laptop className="w-4 h-4 text-blue-500" /> Thiết bị (EQUIPMENT)
                </span>
                <strong className="text-gray-900">{byType.EQUIPMENT || 0} loại</strong>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <DoorOpen className="w-4 h-4 text-amber-500" /> Phòng học (ROOM)
                </span>
                <strong className="text-gray-900">{byType.ROOM || 0} phòng</strong>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 bg-slate-50 p-4 rounded-xl text-xs text-gray-500">
            Hệ thống cập nhật tự động khi có thao tác mượn, trả hoặc upload tệp số mới.
          </div>
        </div>
      </div>

      {/* Top 10 Tài nguyên được quan tâm & đọc nhiều nhất */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" /> Top 10 Tài liệu được Mượn & Đọc trực tuyến nhiều nhất
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-2">Thứ hạng</th>
                <th className="py-3 px-4">Tên tài nguyên</th>
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Loại</th>
                <th className="py-3 px-4 text-center">Lượt mượn</th>
                <th className="py-3 px-4 text-center">Lượt đọc online</th>
                <th className="py-3 px-4 text-right font-bold text-emerald-600">Tổng tương tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topResources.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400">
                    Chưa có lượt tương tác mượn hoặc đọc nào.
                  </td>
                </tr>
              ) : (
                topResources.map((item, index) => (
                  <tr key={item.resource_id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-2 font-black text-gray-400">
                      #{index + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">
                      {item.code}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                        {item.resource_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-700">
                      {item.borrow_count}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-purple-600">
                      {item.read_count}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 text-base">
                      {item.total_engagements}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Khu vực Xuất Báo Cáo Định Kỳ F-10 */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="px-2.5 py-1 bg-white/20 text-emerald-200 text-xs font-bold rounded-lg uppercase tracking-wider">
              Nghiệp vụ Xuất Báo Cáo Định Kỳ (F-10)
            </span>
            <h3 className="text-xl font-bold mt-2">
              Xuất Báo cáo Sử dụng Tài sản & Công nợ Phạt
            </h3>
            <p className="text-emerald-100 text-xs mt-1 max-w-xl">
              Hỗ trợ định dạng file Excel (.xlsx / .csv) đính kèm UTF-8 BOM hiển thị chuẩn tiếng Việt không lỗi font.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] text-emerald-200 uppercase mb-1">Loại báo cáo</label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:bg-slate-900"
              >
                <option value="usage" className="text-gray-900">Sử dụng tài sản</option>
                <option value="fines" className="text-gray-900">Danh sách nợ phạt</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-emerald-200 uppercase mb-1">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] text-emerald-200 uppercase mb-1">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:bg-slate-900"
              />
            </div>

            <div className="self-end">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md"
              >
                <Download className="w-4 h-4" /> Tải tệp Báo cáo (.csv)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
