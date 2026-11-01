import React from 'react';

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;

function localDate(value) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDay(date) {
  return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function getSlotStatus(slot) {
  if (slot.status === 'HOLDING') return 'Đang giữ chỗ';
  if (slot.status === 'PENDING') return 'Chờ duyệt';
  if (slot.status === 'BORROWING') return 'Đang mượn';
  return 'Đã đặt';
}

export default function WeeklyScheduleGrid({
  startDate,
  occupiedSlots = [],
  loading = false,
  onSelectTime,
  isAvailable = true,
}) {
  const monday = localDate(startDate);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR },
    (_, index) => DAY_START_HOUR + index,
  );

  const getOccupiedSlot = (day, hour) => {
    const cellStart = new Date(day);
    cellStart.setHours(hour, 0, 0, 0);
    const cellEnd = new Date(cellStart);
    cellEnd.setHours(hour + 1);
    return occupiedSlots.find((slot) => (
      new Date(slot.borrow_from) < cellEnd && new Date(slot.due_date) > cellStart
    ));
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[4.25rem_repeat(7,minmax(5rem,1fr))] border-b border-slate-200 bg-slate-50">
          <div className="px-2 py-3 text-center text-[11px] font-semibold text-slate-500">Giờ</div>
          {days.map((day) => (
            <div key={day.toISOString()} className="border-l border-slate-200 px-1 py-3 text-center text-xs font-bold text-slate-700">
              {formatDay(day)}
            </div>
          ))}
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Đang tải lịch tuần...</div>
        ) : (
          hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[4.25rem_repeat(7,minmax(5rem,1fr))] border-b border-slate-100 last:border-b-0">
              <div className="flex items-start justify-center pt-2 text-[11px] font-medium text-slate-500">
                {String(hour).padStart(2, '0')}:00
              </div>
              {days.map((day) => {
                const occupied = getOccupiedSlot(day, hour);
                const startsAt = new Date(day);
                startsAt.setHours(hour, 0, 0, 0);
                const endsAt = new Date(startsAt);
                endsAt.setHours(hour + 1);
                const isPast = startsAt < new Date();
                const label = occupied
                  ? `${getSlotStatus(occupied)} · ${new Date(occupied.borrow_from).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}–${new Date(occupied.due_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                  : !isAvailable
                    ? 'Tài nguyên hiện không còn số lượng khả dụng'
                    : isPast
                      ? 'Khung giờ đã qua'
                      : `Còn trống ${formatDay(day)} lúc ${String(hour).padStart(2, '0')}:00`;

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={Boolean(occupied) || !onSelectTime || !isAvailable || isPast}
                    onClick={() => onSelectTime({ startsAt, endsAt })}
                    aria-label={label}
                    title={label}
                    className={`m-0.5 min-h-9 rounded-md border text-[10px] transition ${
                      occupied
                        ? 'cursor-not-allowed border-rose-100 bg-rose-50 text-rose-700'
                        : !isAvailable || isPast
                          ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
                          : onSelectTime
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100'
                        : 'border-emerald-100 bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {occupied ? 'Đã đặt' : 'Trống'}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
