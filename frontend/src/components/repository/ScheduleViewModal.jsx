import React, { useEffect, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import WeeklyScheduleGrid from '../common/WeeklyScheduleGrid';
import { getResourceSchedule } from '../../services/api';

function getWeek(offset = 0) {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1 + offset * 7);
  return {
    start: `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`,
    end: (() => {
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      return `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
    })(),
    monday,
  };
}

function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function ScheduleViewModal({ resource, onClose, onBookNow }) {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const week = getWeek(currentWeekOffset);

  useEffect(() => {
    if (!resource) return undefined;
    let active = true;
    setLoading(true);
    setError('');

    getResourceSchedule(resource.resource_id, week.start, week.end)
      .then((response) => {
        if (active) setScheduleData(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Không thể tải lịch tài nguyên.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [resource, week.start, week.end, refreshKey]);

  if (!resource) return null;

  const displayEnd = new Date(week.monday);
  displayEnd.setDate(displayEnd.getDate() + 6);
  const occupiedSlots = scheduleData?.occupied_slots || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900">Lịch tuần: {resource.title}</h2>
              <p className="truncate text-xs text-slate-500">{resource.code}{resource.location ? ` · ${resource.location}` : ''}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng lịch" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <button type="button" onClick={() => setCurrentWeekOffset((offset) => offset - 1)} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" /> Tuần trước
          </button>
          <span className="text-center text-xs font-bold text-slate-800 sm:text-sm">
            {week.monday.toLocaleDateString('vi-VN')} – {displayEnd.toLocaleDateString('vi-VN')}
          </span>
          <button type="button" onClick={() => setCurrentWeekOffset((offset) => offset + 1)} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Tuần sau <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border border-emerald-200 bg-emerald-50" /> Còn trống</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm border border-rose-200 bg-rose-50" /> Đã có lịch</span>
            <span className="text-slate-400">Khung giờ hiển thị: 08:00–20:00</span>
          </div>
          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <AlertCircle className="h-5 w-5 shrink-0" /> {error}
              <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="ml-auto font-bold underline">Thử lại</button>
            </div>
          ) : (
            <WeeklyScheduleGrid
              startDate={week.start}
              occupiedSlots={occupiedSlots}
              loading={loading}
              isAvailable={resource.available_quantity > 0}
              onSelectTime={onBookNow ? ({ startsAt, endsAt }) => onBookNow(resource, {
                startsAt: toLocalInputValue(startsAt),
                endsAt: toLocalInputValue(endsAt),
              }) : undefined}
            />
          )}
          {!loading && !error && occupiedSlots.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Chưa có lượt đặt nào trong tuần. Các khung giờ trống có thể chọn để bắt đầu đặt.
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <span className="text-xs text-slate-500">Chọn ô màu xanh để bắt đầu đặt khung giờ đó.</span>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Đóng</button>
        </div>
      </div>
    </div>
  );
}
