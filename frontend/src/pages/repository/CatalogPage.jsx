import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  Laptop,
  Layers,
  DoorOpen,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { getResources, getCategories } from '../../services/api';
import OnlineReaderModal from '../../components/repository/OnlineReaderModal';
import ScheduleViewModal from '../../components/repository/ScheduleViewModal';

export default function CatalogPage() {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bộ lọc tìm kiếm
  const [keyword, setKeyword] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modals
  const [readingResource, setReadingResource] = useState(null);
  const [schedulingResource, setSchedulingResource] = useState(null);
  const [bookingMessage, setBookingMessage] = useState(null);

  // Tải danh mục
  useEffect(() => {
    getCategories(true)
      .then((res) => {
        setCategories(res.data || []);
      })
      .catch((err) => console.error('Lỗi tải danh mục:', err));
  }, []);

  // Tải danh sách tài nguyên
  const fetchResources = () => {
    setLoading(true);
    setError(null);

    const params = {
      page,
      per_page: 9,
      keyword: keyword.trim(),
      resource_type: selectedType,
      category_id: selectedCategory,
    };

    getResources(params)
      .then((res) => {
        setResources(res.data?.data || []);
        setMeta(res.data);
      })
      .catch((err) => {
        setError(err.message || 'Không thể tải danh sách tài nguyên');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchResources();
  }, [page, selectedType, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResources();
  };

  const handleBookNow = (resource) => {
    setBookingMessage({
      type: 'info',
      text: `Đang liên kết module Đặt mượn (Trần Minh Chiến) cho tài sản [${resource.code}] ${resource.title}. Phiếu sẽ được giữ chỗ 10 phút.`,
    });
    setTimeout(() => setBookingMessage(null), 5000);
  };

  const typeTabs = [
    { key: 'ALL', label: 'Tất cả', icon: Layers },
    { key: 'DIGITAL', label: 'Tài liệu số (PDF)', icon: BookOpen },
    { key: 'BOOK', label: 'Sách in', icon: BookOpen },
    { key: 'EQUIPMENT', label: 'Thiết bị', icon: Laptop },
    { key: 'ROOM', label: 'Phòng học & Nhóm', icon: DoorOpen },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Thông báo thao tác đặt mượn */}
      {bookingMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{bookingMessage.text}</span>
        </div>
      )}

      {/* Header trang W2 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Không gian Tra cứu & Đọc học liệu
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Kho Tài nguyên Số & Thiết bị
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Tra cứu thời gian thực dưới 2 giây với chỉ mục PostgreSQL GIN.
          </p>
        </div>

        {/* Thanh tìm kiếm */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên, tác giả, ISBN, Serial..."
            className="w-full pl-11 pr-24 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
          <button
            type="submit"
            className="absolute right-2 top-2 px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* Thanh bộ lọc loại tài nguyên & danh mục */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        {/* Tabs loại tài nguyên */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0">
          {typeTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedType === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setSelectedType(tab.key);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dropdown lọc danh mục */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name} ({cat.resources_count || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid danh sách tài nguyên */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-24 h-5 bg-gray-200 rounded-full" />
                <div className="w-3/4 h-6 bg-gray-200 rounded-lg" />
                <div className="w-1/2 h-4 bg-gray-100 rounded" />
              </div>
              <div className="w-full h-10 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchResources}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
          >
            Thử lại
          </button>
        </div>
      ) : resources.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 p-8">
          <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">Không tìm thấy tài nguyên nào</h3>
          <p className="text-gray-500 text-sm mt-1">
            Hãy thử tìm với từ khóa khác hoặc điều chỉnh bộ lọc phân loại.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((item) => {
            // Xác định màu trạng thái chuẩn UI Design:
            // AVAILABLE -> Xanh, BORROWED -> Đỏ, MAINTENANCE -> Xám
            const isAvailable = item.status_badge === 'AVAILABLE';
            const isBorrowed = item.status_badge === 'BORROWED';
            const isMaintenance = item.status_badge === 'MAINTENANCE';

            return (
              <div
                key={item.resource_id}
                className="bg-white rounded-2xl border border-gray-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group p-6"
              >
                <div>
                  {/* Hàng nhãn: Danh mục & Trạng thái màu */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg truncate">
                      {item.category?.category_name || item.resource_type}
                    </span>

                    {/* Badge trạng thái chuẩn hóa màu sắc */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isBorrowed
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAvailable
                            ? 'bg-emerald-500'
                            : isBorrowed
                            ? 'bg-rose-500 animate-pulse'
                            : 'bg-gray-400'
                        }`}
                      />
                      {item.status_label}
                    </span>
                  </div>

                  {/* Tiêu đề & tác giả */}
                  <h3 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-emerald-700 transition line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    {item.author_or_brand ? `Tác giả/Hãng: ${item.author_or_brand}` : 'Chưa có thông tin tác giả'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-500">
                    <span className="font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-gray-700">
                      {item.code}
                    </span>
                    {item.location && (
                      <span className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {item.location}
                      </span>
                    )}
                    {item.resource_type !== 'DIGITAL' && (
                      <span className="font-medium text-gray-700">
                        Còn trống: <strong className={item.available_quantity > 0 ? 'text-emerald-600' : 'text-red-500'}>{item.available_quantity}</strong> / {item.total_quantity}
                      </span>
                    )}
                  </div>
                </div>

                {/* Các nút hành động */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2">
                  {/* Nút Đọc Online cho DIGITAL (F-02) */}
                  {item.resource_type === 'DIGITAL' ? (
                    <button
                      onClick={() => setReadingResource(item)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
                    >
                      <BookOpen className="w-4 h-4" /> Đọc trực tuyến PDF
                    </button>
                  ) : (
                    <>
                      {/* Xem lịch tuần cho ROOM hoặc EQUIPMENT (F-07) */}
                      {(item.resource_type === 'ROOM' || item.resource_type === 'EQUIPMENT') && (
                        <button
                          onClick={() => setSchedulingResource(item)}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                          title="Xem lịch trống tuần"
                        >
                          <Calendar className="w-4 h-4" /> Lịch tuần
                        </button>
                      )}

                      {/* Đặt mượn / Đặt phòng */}
                      <button
                        disabled={!isAvailable}
                        onClick={() => handleBookNow(item)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 font-semibold text-sm rounded-xl transition shadow-sm ${
                          isAvailable
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        {item.resource_type === 'ROOM' ? 'Đặt phòng học' : 'Đặt mượn'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phân trang */}
      {meta && meta.last_page > 1 && (
        <div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-500">
            Hiển thị trang <strong className="text-gray-900">{meta.current_page}</strong> trên{' '}
            <strong className="text-gray-900">{meta.last_page}</strong> ({meta.total} tài nguyên)
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-700 px-2">{page}</span>
            <button
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Đọc Trực Tuyến PDF (F-02) */}
      {readingResource && (
        <OnlineReaderModal
          resource={readingResource}
          onClose={() => setReadingResource(null)}
        />
      )}

      {/* Modal Xem Lịch Tuần (F-07) */}
      {schedulingResource && (
        <ScheduleViewModal
          resource={schedulingResource}
          onClose={() => setSchedulingResource(null)}
          onBookNow={handleBookNow}
        />
      )}
    </div>
  );
}

