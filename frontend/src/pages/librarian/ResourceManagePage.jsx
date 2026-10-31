import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Upload,
  X,
  FileText,
  Filter,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  getResources,
  getCategories,
  createResource,
  updateResource,
  deleteResource,
  createCategory,
} from '../../services/api';
import OnlineReaderModal from '../../components/repository/OnlineReaderModal';

export default function ResourceManagePage() {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('');
  const [notification, setNotification] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [previewResource, setPreviewResource] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    category_id: '',
    resource_type: 'BOOK',
    author_or_brand: '',
    location: '',
    total_quantity: 1,
    available_quantity: 1,
    status: 'ACTIVE',
    description: '',
    file: null,
  });

  const [categoryName, setCategoryName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getResources({
        keyword,
        resource_type: filterType,
        status: filterStatus,
        include_inactive: true,
        per_page: 50,
      }),
      getCategories(true),
    ])
      .then(([resResources, resCategories]) => {
        setResources(resResources.data?.data || []);
        setCategories(resCategories.data || []);
      })
      .catch((err) => {
        showNotice('error', err.message || 'Lỗi khi tải dữ liệu');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [filterType, filterStatus]);

  const showNotice = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOpenCreateModal = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      code: '',
      category_id: categories[0]?.category_id || '',
      resource_type: 'BOOK',
      author_or_brand: '',
      location: '',
      total_quantity: 1,
      available_quantity: 1,
      status: 'ACTIVE',
      description: '',
      file: null,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (res) => {
    setEditingResource(res);
    setFormData({
      title: res.title,
      code: res.code,
      category_id: res.category_id,
      resource_type: res.resource_type,
      author_or_brand: res.author_or_brand || '',
      location: res.location || '',
      total_quantity: res.total_quantity,
      available_quantity: res.available_quantity,
      status: res.status,
      description: res.description || '',
      file: null,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    });

    try {
      if (editingResource) {
        await updateResource(editingResource.resource_id, data);
        showNotice('success', `Đã cập nhật tài sản [${formData.code}] thành công`);
      } else {
        await createResource(data);
        showNotice('success', `Đã thêm mới tài sản [${formData.code}] thành công`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        showNotice('error', err.message || 'Không thể lưu tài nguyên');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMaintenance = async (res) => {
    const nextStatus = res.status === 'MAINTENANCE' ? 'ACTIVE' : 'MAINTENANCE';
    try {
      const data = new FormData();
      data.append('status', nextStatus);
      await updateResource(res.resource_id, data);
      showNotice(
        'success',
        `Tài sản [${res.code}] đã chuyển sang: ${nextStatus === 'MAINTENANCE' ? 'Bảo trì (Xám)' : 'Hoạt động (Xanh)'}`
      );
      loadData();
    } catch (err) {
      showNotice('error', err.message || 'Không thể đổi trạng thái');
    }
  };

  const handleDelete = async (res) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mềm tài nguyên [${res.code}] ${res.title}?`)) {
      return;
    }

    try {
      await deleteResource(res.resource_id);
      showNotice('success', `Đã xóa mềm tài nguyên [${res.code}] (chuyển INACTIVE)`);
      loadData();
    } catch (err) {
      // Chặn xóa nếu có phiếu mượn hoạt động (409)
      showNotice('error', err.message || 'Không thể xóa tài sản đang có người mượn hoặc giữ chỗ.');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      await createCategory({
        category_name: categoryName.trim(),
        parent_id: parentCategoryId || null,
      });
      showNotice('success', `Đã tạo mới danh mục "${categoryName}"`);
      setCategoryName('');
      setParentCategoryId('');
      setIsCategoryModalOpen(false);
      loadData();
    } catch (err) {
      showNotice('error', err.message || 'Không thể tạo danh mục');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Toast thông báo */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center gap-3 shadow-md animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Header trang W6 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">
            Nghiệp vụ Quản lý Kho Thư viện (W6 / F-01)
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Quản lý Kho Tài liệu số, Thiết bị & Phòng học
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kiểm tra trùng mã ISBN/Serial, ràng buộc số lượng khả dụng và xóa mềm an toàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition"
          >
            + Danh mục mới
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition shadow-md"
          >
            <Plus className="w-4 h-4" /> Thêm tài nguyên
          </button>
        </div>
      </div>

      {/* Bộ lọc tra cứu trong bảng */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              placeholder="Lọc theo tên, mã ISBN, Serial..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>

          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
            title="Làm mới"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700"
          >
            <option value="ALL">Tất cả loại</option>
            <option value="DIGITAL">Tài liệu số</option>
            <option value="BOOK">Sách in</option>
            <option value="EQUIPMENT">Thiết bị</option>
            <option value="ROOM">Phòng học</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
            <option value="INACTIVE">Đã ẩn (INACTIVE)</option>
          </select>
        </div>
      </div>

      {/* Bảng danh sách tài nguyên */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-4 px-6">Mã / Tiêu đề</th>
                <th className="py-4 px-4">Loại</th>
                <th className="py-4 px-4">Danh mục</th>
                <th className="py-4 px-4 text-center">Tồn kho (Khả dụng / Tổng)</th>
                <th className="py-4 px-4">Trạng thái nhãn</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    Đang tải danh sách kho...
                  </td>
                </tr>
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    Chưa có tài nguyên nào trong kho.
                  </td>
                </tr>
              ) : (
                resources.map((item) => (
                  <tr key={item.resource_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 line-clamp-1">{item.title}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        {item.code} {item.location ? `• ${item.location}` : ''}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700">
                        {item.resource_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-xs font-medium">
                      {item.category?.category_name || '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-gray-900">{item.available_quantity}</span>
                      <span className="text-gray-400"> / {item.total_quantity}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.status_badge === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status_badge === 'BORROWED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status_badge === 'AVAILABLE'
                              ? 'bg-emerald-500'
                              : item.status_badge === 'BORROWED'
                              ? 'bg-rose-500'
                              : 'bg-gray-400'
                          }`}
                        />
                        {item.status_label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      {item.resource_type === 'DIGITAL' && (
                        <button
                          onClick={() => setPreviewResource(item)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Đọc thử tài liệu số"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleMaintenance(item)}
                        className={`p-1.5 rounded-lg transition ${
                          item.status === 'MAINTENANCE'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                        title={item.status === 'MAINTENANCE' ? 'Bật hoạt động' : 'Chuyển bảo trì (Xám)'}
                      >
                        <Wrench className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {item.status !== 'INACTIVE' && (
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa mềm (INACTIVE)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm mới / Cập nhật Tài nguyên */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-lg">
                {editingResource ? `Cập nhật: ${editingResource.title}` : 'Thêm mới Tài nguyên vào Kho'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Loại tài nguyên *
                  </label>
                  <select
                    value={formData.resource_type}
                    onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="BOOK">Sách in (BOOK)</option>
                    <option value="DIGITAL">Tài liệu số (DIGITAL)</option>
                    <option value="EQUIPMENT">Thiết bị (EQUIPMENT)</option>
                    <option value="ROOM">Phòng học (ROOM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Danh mục phân loại *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tiêu đề / Tên tài sản *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  placeholder="Ví dụ: Giáo trình Mạng Máy tính, Máy chiếu Sony..."
                  required
                />
                {formErrors.title && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.title[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Mã ISBN / Serial / Mã phòng *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono"
                    placeholder="ISBN-978..., DEV-EPSON-01..."
                    required
                  />
                  {formErrors.code && (
                    <p className="text-xs text-rose-500 mt-1">{formErrors.code[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tác giả / Hãng sản xuất
                  </label>
                  <input
                    type="text"
                    value={formData.author_or_brand}
                    onChange={(e) => setFormData({ ...formData, author_or_brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    placeholder="Robert Martin, Sony, Dell..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tổng số lượng *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.total_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    required
                  />
                  {formErrors.total_quantity && (
                    <p className="text-xs text-rose-500 mt-1">{formErrors.total_quantity[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Số lượng khả dụng *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.total_quantity}
                    value={formData.available_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        available_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    required
                  />
                  {formErrors.available_quantity && (
                    <p className="text-xs text-rose-500 mt-1">{formErrors.available_quantity[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Vị trí kệ / Tòa nhà
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    placeholder="Kệ A2, Phòng 301..."
                  />
                </div>
              </div>

              {/* Upload file PDF nếu là DIGITAL */}
              {formData.resource_type === 'DIGITAL' && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                  <label className="block text-xs font-bold text-emerald-800 uppercase mb-1 flex items-center gap-1.5">
                    <Upload className="w-4 h-4" /> Tệp tin PDF / EPUB (Online Reader F-02)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.epub"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                  />
                  {formErrors.file && (
                    <p className="text-xs text-rose-500 mt-1">{formErrors.file[0]}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Mô tả chi tiết / Ghi chú
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  placeholder="Ghi chú về thiết bị hoặc cấu hình phòng..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingResource ? 'Lưu thay đổi' : 'Thêm tài sản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm mới Danh mục */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Thêm mới Danh mục Phân cấp</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ví dụ: Mạng Máy tính, Thiết bị số..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Danh mục cha (để trống nếu là danh mục gốc)
                </label>
                <select
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="">Không có (Danh mục gốc)</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  Tạo danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Online Reader Modal */}
      {previewResource && (
        <OnlineReaderModal
          resource={previewResource}
          onClose={() => setPreviewResource(null)}
        />
      )}
    </div>
  );
}

