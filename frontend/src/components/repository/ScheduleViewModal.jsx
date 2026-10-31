import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getResourceSchedule } from '../../services/api';

export default function ScheduleViewModal({ resource, onClose, onBookNow }) {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Tính toán khoảng ngày tuần
  const getWeekDates = (offset = 0) => {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay() + 1 + offset * 7));
    const lastDay = new Date(today.setDate(firstDay.getDate() + 6));

    return {
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0],
      display_label: `${firstDay.toLocaleDateString('vi-VN')} - ${lastDay.toLocaleDateString('vi-VN')}`,
    };
  };

  const weekInfo = getWeekDates(currentWeekOffset);

  useEffect(() => {
    if (!resource) return;
    setLoading(true);

    getResourceSchedule(resource.resource_id, weekInfo.start_date, weekInfo.end_date)
      .then((res) => {
        setScheduleData(res.data);
      })
      .catch((err) => {
        console.error('Lỗi tải lịch:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [resource, currentWeekOffset]);

  if (!resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                Lịch sử dụng: {resource.title}
              </h3>
              <p className="text-xs text-gray-500">
                Mã: {resource.code} {resource.location ? `• Vị trí: ${resource.location}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh chuyển tuần */}
        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Tuần trước
          </button>

          <span className="text-sm font-semibold text-gray-800">
            Tuần: {weekInfo.display_label}
          </span>

          <button
            onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            Tuần sau <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung danh sách khung giờ đã kín */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center text-gray-400">Đang tải lịch trống thời gian thực...</div>
          ) : scheduleData?.occupied_slots?.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-gray-800 text-lg">Chưa có ai đặt trong tuần này</h4>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Tất cả các khung giờ đều đang sẵn sàng. Bạn có thể tiến hành đặt mượn hoặc giữ chỗ ngay!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Các khung giờ đã kín lịch / đang giữ chỗ:
              </h4>
              {scheduleData?.occupied_slots?.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3.5 bg-red-50/60 border border-red-100 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        {new Date(slot.borrow_from).toLocaleString('vi-VN', {
                          weekday: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}{' '}
                        →{' '}
                        {new Date(slot.due_date).toLocaleString('vi-VN', {
                          weekday: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Phiếu mượn: #{slot.loan_id} {slot.user_code ? `• Người đặt: ${slot.user_code}` : ''}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      slot.status === 'HOLDING'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : slot.status === 'PENDING'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                  >
                    {slot.status === 'HOLDING'
                      ? 'Đang giữ 10p'
                      : slot.status === 'PENDING'
                      ? 'Đã xác nhận'
                      : 'Đang mượn'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Hệ thống tự động khóa chống trùng lịch theo thời gian thực (BR02).
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition shadow-sm"
            >
              Đóng
            </button>
            {onBookNow && resource.available_quantity > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onBookNow(resource);
                }}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition shadow-sm"
              >
                Đặt mượn ngay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
