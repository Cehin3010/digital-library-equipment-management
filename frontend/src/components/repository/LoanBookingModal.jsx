import React, { useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createRoomBooking, holdLoan } from '../../services/api';

const localInputValue = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const getErrorMessage = (error) =>
  error?.message || error?.errors?.message || 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';

export default function LoanBookingModal({ resource, onClose, onSuccess, initialStartAt, initialEndAt }) {
  const navigate = useNavigate();
  const isRoom = resource?.resource_type === 'ROOM';
  const start = new Date(Date.now() + 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const [startsAt, setStartsAt] = useState(() => initialStartAt || localInputValue(start));
  const [endsAt, setEndsAt] = useState(() => initialEndAt || localInputValue(end));
  const [purpose, setPurpose] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [completed, setCompleted] = useState(false);
  const chargeUnits = isRoom
    ? Math.max(1, Math.ceil((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 3600000))
    : Math.max(1, Math.ceil((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 86400000));
  const unitRate = isRoom ? Number(resource?.booking_fee_per_hour || 0) : Number(resource?.rental_fee_per_day || 0);
  const estimatedFee = unitRate * chargeUnits;
  const isLoanTimeValid = isRoom
    || (new Date(startsAt).getTime() >= Date.now()
      && new Date(endsAt).getTime() > new Date(startsAt).getTime());

  if (!resource) return null;

  const submitBooking = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      if (isRoom) {
        const response = await createRoomBooking({
          resource_id: resource.resource_id,
          starts_at: startsAt,
          ends_at: endsAt,
          purpose: purpose.trim() || undefined,
        });
        setMessage({ type: 'success', text: response.message || 'Đặt phòng thành công.' });
        setCompleted(true);
        onSuccess?.();
      } else {
        const response = await holdLoan({
          resource_id: resource.resource_id,
          borrow_from: startsAt,
          due_date: endsAt,
        });
        onSuccess?.();
        navigate(`/loans/hold/${response.data.loan_id}`, { state: { loan: response.data } });
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
              {isRoom ? <CalendarClock className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{isRoom ? 'Đặt phòng học' : 'Đặt mượn tài nguyên'}</h2>
              <p className="mt-1 text-sm text-slate-500">{resource.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {message && (
            <div className={`flex gap-2 rounded-xl border p-3 text-sm ${message.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
              {message.type === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {!isRoom && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
              {resource.resource_type === 'BOOK'
                ? 'Sách in được mượn miễn phí.'
                : `Phí dự kiến: ${estimatedFee.toLocaleString('vi-VN')} VNĐ (${unitRate.toLocaleString('vi-VN')} VNĐ/ngày, tính theo thời gian mượn thực tế khi trả).`}
            </div>
          )}

          {isRoom && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
              Phí đặt dự kiến: {estimatedFee.toLocaleString('vi-VN')} VNĐ ({unitRate.toLocaleString('vi-VN')} VNĐ/giờ × {chargeUnits} giờ, tính tròn giờ và ghi công nợ khi xác nhận đặt).
            </div>
          )}

          {completed ? (
            <button onClick={onClose} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">Đóng</button>
          ) : (
            <form onSubmit={submitBooking} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  {isRoom ? 'Bắt đầu' : 'Ngày nhận'}
                  <input required type="datetime-local" min={localInputValue(new Date())} value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  {isRoom ? 'Kết thúc' : 'Ngày trả dự kiến'}
                  <input required type="datetime-local" value={endsAt} min={startsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
                </label>
              </div>
              {!isRoom && !isLoanTimeValid && (
                <p role="alert" className="text-sm text-rose-700">Giờ nhận phải từ thời điểm hiện tại trở đi và giờ trả phải sau giờ nhận.</p>
              )}
              {isRoom && (
                <label className="block text-sm font-semibold text-slate-700">
                  Mục đích sử dụng <span className="font-normal text-slate-400">(không bắt buộc)</span>
                  <input maxLength={500} value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Ví dụ: họp nhóm làm đồ án" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
                </label>
              )}
              <p className="text-xs leading-relaxed text-slate-500">
                {isRoom
                  ? 'Khung giờ sẽ được kiểm tra để tránh trùng. Hủy trước giờ bắt đầu ít nhất 2 tiếng; phí đã thanh toán không được hoàn tự động.'
                  : 'Phiếu giữ tài nguyên trong 10 phút. Sau khi xác nhận, mang mã phiếu đến quầy để nhận tài sản.'}
              </p>
              <button disabled={busy || (!isRoom && !isLoanTimeValid)} type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                {busy ? 'Đang gửi yêu cầu...' : isRoom ? 'Xác nhận đặt phòng' : 'Giữ chỗ 10 phút'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
