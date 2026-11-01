import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, DoorOpen, RefreshCw } from 'lucide-react';
import LoanBookingModal from '../components/repository/LoanBookingModal';
import WeeklyScheduleGrid from '../components/common/WeeklyScheduleGrid';
import { cancelRoomBooking, getResourceSchedule, getResources, getRoomBookings } from '../services/api';

const dateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalInputValue = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

function getWeek(offset) {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1 + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: dateOnly(monday), end: dateOnly(sunday) };
}

export default function RoomSchedulePage() {
  const [rooms, setRooms] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [view, setView] = useState('schedule');
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [bookingRoom, setBookingRoom] = useState(null);
  const [bookingSlot, setBookingSlot] = useState(null);
  const week = useMemo(() => getWeek(weekOffset), [weekOffset]);
  const selectedRoom = rooms.find((room) => String(room.resource_id) === String(selectedId));

  useEffect(() => {
    let active = true;
    getResources({ resource_type: 'ROOM', per_page: 100 })
      .then((response) => {
        if (!active) return;
        const roomList = response.data?.data || [];
        setRooms(roomList);
        setSelectedId((current) => current || String(roomList[0]?.resource_id || ''));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Không thể tải danh sách phòng.');
      })
      .finally(() => {
        if (active) setLoadingRooms(false);
      });
    return () => { active = false; };
  }, []);

  const loadMyBookings = () => {
    setLoadingBookings(true);
    getRoomBookings()
      .then((response) => setMyBookings(response.data?.data || []))
      .catch((requestError) => setError(requestError.message || 'Không thể tải lịch đặt phòng của bạn.'))
      .finally(() => setLoadingBookings(false));
  };

  useEffect(() => { loadMyBookings(); }, []);

  useEffect(() => {
    if (!selectedId) return undefined;
    let active = true;
    setLoadingSchedule(true);
    setError('');
    getResourceSchedule(selectedId, week.start, week.end)
      .then((response) => {
        if (active) setSchedule(response.data?.occupied_slots || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Không thể tải lịch phòng.');
      })
      .finally(() => {
        if (active) setLoadingSchedule(false);
      });
    return () => { active = false; };
  }, [selectedId, week.start, week.end, refreshKey]);

  const formatDate = (value) => new Date(value).toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const cancelBooking = async (booking) => {
    setError('');
    try {
      await cancelRoomBooking(booking.room_booking_id);
      setMyBookings((current) => current.map((item) =>
        item.room_booking_id === booking.room_booking_id ? { ...item, status: 'CANCELLED' } : item
      ));
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message || 'Không thể hủy lượt đặt phòng.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-700">
            <DoorOpen className="h-4 w-4" /> Đặt phòng học
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Lịch phòng theo tuần</h1>
          <p className="mt-1 text-sm text-slate-500">Chọn khung giờ còn trống; hệ thống sẽ kiểm tra trùng lịch khi xác nhận.</p>
        </div>
        {selectedRoom && (
          <button onClick={() => { setBookingSlot(null); setBookingRoom(selectedRoom); }} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
            Đặt phòng này
          </button>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex gap-2 border-b border-slate-100 pb-3">
          <button onClick={() => setView('schedule')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${view === 'schedule' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>Lịch phòng</button>
          <button onClick={() => setView('mine')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${view === 'mine' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>Lượt đặt của tôi</button>
        </div>
        {view === 'mine' && error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}
        {view === 'mine' ? (
          loadingBookings ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Đang tải đặt phòng...</div>
          ) : myBookings.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">Bạn chưa có lượt đặt phòng nào.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myBookings.map((booking) => {
                const canCancel = booking.status === 'CONFIRMED' && new Date(booking.starts_at).getTime() - Date.now() >= 2 * 60 * 60 * 1000;
                return (
                  <div key={booking.room_booking_id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="font-semibold text-slate-800">{booking.resource?.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(booking.starts_at)} – {formatDate(booking.ends_at)}</p>
                      {Number(booking.total_fee) > 0 && <p className="mt-1 text-xs font-semibold text-slate-700">Phí đặt: {Number(booking.total_fee).toLocaleString('vi-VN')} VNĐ</p>}
                      {booking.purpose && <p className="mt-1 text-xs text-slate-500">Mục đích: {booking.purpose}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{booking.status === 'CONFIRMED' ? 'Đã đặt' : 'Đã hủy'}</span>
                      {canCancel && <button onClick={() => cancelBooking(booking)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">Hủy lượt đặt</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
        <>
        <label className="block max-w-xl text-sm font-semibold text-slate-700">
          Chọn phòng
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={loadingRooms || rooms.length === 0} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            {rooms.length === 0 && <option value="">Chưa có phòng trong danh mục</option>}
            {rooms.map((room) => <option key={room.resource_id} value={room.resource_id}>{room.title} ({room.code}) — {Number(room.booking_fee_per_hour || 0).toLocaleString('vi-VN')}đ/giờ</option>)}
          </select>
        </label>

        <div className="mt-6 flex items-center justify-between border-y border-slate-100 py-3">
          <button onClick={() => setWeekOffset((value) => value - 1)} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            <ChevronLeft className="h-4 w-4" /> Tuần trước
          </button>
          <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <CalendarDays className="h-4 w-4 text-emerald-600" />
            {new Date(`${week.start}T00:00:00`).toLocaleDateString('vi-VN')} – {new Date(`${week.end}T00:00:00`).toLocaleDateString('vi-VN')}
          </span>
          <button onClick={() => setWeekOffset((value) => value + 1)} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Tuần sau <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        ) : loadingRooms || loadingSchedule ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <RefreshCw className="h-4 w-4 animate-spin" /> Đang tải lịch...
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border border-emerald-200 bg-emerald-50" /> Còn trống — chọn để đặt</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border border-rose-200 bg-rose-50" /> Đã có lịch</span>
              <span className="text-slate-400">Khung giờ hiển thị: 08:00–20:00</span>
            </div>
            <WeeklyScheduleGrid
              startDate={week.start}
              occupiedSlots={schedule}
              onSelectTime={({ startsAt, endsAt }) => {
                setBookingSlot({
                  startsAt: toLocalInputValue(startsAt),
                  endsAt: toLocalInputValue(endsAt),
                });
                setBookingRoom(selectedRoom);
              }}
            />
          </div>
        )}
        </>
        )}
      </section>

      {bookingRoom && (
        <LoanBookingModal
          resource={bookingRoom}
          initialStartAt={bookingSlot?.startsAt}
          initialEndAt={bookingSlot?.endsAt}
          onClose={() => { setBookingRoom(null); setBookingSlot(null); }}
          onSuccess={() => {
            setRefreshKey((key) => key + 1);
            loadMyBookings();
          }}
        />
      )}
    </div>
  );
}
