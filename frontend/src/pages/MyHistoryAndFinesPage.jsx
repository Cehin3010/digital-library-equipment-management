import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock3, CreditCard, LoaderCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { cancelLoan, getMyHistory, getMyPenalties } from '../services/api';
import PaymentModal from '../components/fines/PaymentModal';
import { useNavigate } from 'react-router-dom';

function getArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('vi-VN');
}

function loanStatus(status) {
  const labels = {
    HOLDING: 'Đang giữ chỗ',
    PENDING: 'Chờ nhận tài sản',
    BORROWING: 'Đang mượn',
    RETURNED: 'Đã trả',
    CANCELLED: 'Đã hủy',
    EXPIRED: 'Hết hạn',
    REJECTED: 'Bị từ chối',
  };
  return labels[status] || status || '—';
}

export default function MyHistoryAndFinesPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyLoanId, setBusyLoanId] = useState(null);
  const [selectedPenalty, setSelectedPenalty] = useState(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [loansResponse, penaltiesResponse] = await Promise.all([getMyHistory(), getMyPenalties()]);
      setLoans(getArray(loansResponse.data));
      setPenalties(getArray(penaltiesResponse.data));
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải lịch sử mượn và công nợ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const unpaidTotal = useMemo(() => penalties
    .filter((penalty) => penalty.status === 'UNPAID')
    .reduce((sum, penalty) => sum + Number(penalty.amount || 0), 0), [penalties]);

  const cancelReservation = async (loan) => {
    setBusyLoanId(loan.loan_id);
    setError('');
    try {
      await cancelLoan(loan.loan_id);
      await loadData();
    } catch (requestError) {
      setError(requestError.message || 'Không thể hủy phiếu mượn.');
    } finally {
      setBusyLoanId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-700"><Clock3 className="h-4 w-4" /> Lịch sử cá nhân</p>
          <h1 className="text-3xl font-extrabold text-slate-900">Lịch sử mượn và công nợ</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi phiếu mượn, phòng đã đặt và các khoản cần thanh toán.</p>
        </div>
        <button type="button" disabled={loading} onClick={loadData} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </header>

      {unpaidTotal > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Bạn đang có công nợ chưa thanh toán: {unpaidTotal.toLocaleString('vi-VN')} VNĐ.</p>
            <p className="mt-1 text-sm">Một số thao tác mượn mới có thể bị hạn chế theo quy định thư viện.</p>
          </div>
        </div>
      )}
      {error && <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

      <section className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">Phiếu mượn và đặt tài nguyên</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><LoaderCircle className="h-5 w-5 animate-spin text-emerald-700" /></div>
        ) : error ? (
          <p className="py-12 text-center text-sm text-slate-500">Chưa thể hiển thị lịch sử vì API tải dữ liệu thất bại.</p>
        ) : loans.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">Chưa có lịch sử mượn hoặc đặt tài nguyên.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Tài nguyên</th><th className="px-5 py-3">Thời gian</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Thao tác</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const canManage = ['HOLDING', 'PENDING'].includes(loan.status);
                  return (
                    <tr key={loan.loan_id}>
                      <td className="px-5 py-4"><p className="font-semibold text-slate-800">{loan.resource?.title || `Phiếu #${loan.loan_id}`}</p><p className="text-xs text-slate-500">#{loan.loan_id} · {loan.resource?.code || ''}</p></td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        <p>Dự kiến nhận: {formatDate(loan.borrow_from)}</p>
                        <p className="mt-1">Đã nhận: {formatDate(loan.approved_at)}</p>
                        <p className="mt-1">Hạn trả: {formatDate(loan.due_date)}</p>
                        <p className="mt-1">Đã trả: {formatDate(loan.returned_at)}</p>
                      </td>
                      <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{loanStatus(loan.status)}</span></td>
                      <td className="px-5 py-4">
                        {canManage && (
                          <div className="flex gap-2">
                            <button type="button" onClick={() => navigate(`/loans/hold/${loan.loan_id}`, { state: { loan } })} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">Xem mã QR</button>
                            <button type="button" disabled={busyLoanId === loan.loan_id} onClick={() => cancelReservation(loan)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                              {busyLoanId === loan.loan_id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Hủy phiếu
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <CreditCard className="h-4 w-4 text-emerald-700" />
          <h2 className="font-bold text-slate-900">Khoản thu và thanh toán</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><LoaderCircle className="h-5 w-5 animate-spin text-emerald-700" /></div>
        ) : error ? (
          <p className="py-12 text-center text-sm text-slate-500">Chưa thể hiển thị công nợ vì API tải dữ liệu thất bại.</p>
        ) : penalties.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">Không có khoản thu nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Khoản thu</th><th className="px-5 py-3">Ngày trễ</th><th className="px-5 py-3">Số tiền</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Thao tác</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {penalties.map((penalty) => (
                  <tr key={penalty.penalty_id || penalty.id}>
                    <td className="px-5 py-4 font-semibold text-slate-800">{penalty.note || penalty.reason || penalty.description || 'Khoản thu'}</td>
                    <td className="px-5 py-4 text-slate-600">{penalty.penalty_type === 'OVERDUE' ? penalty.overdue_days : '—'}</td>
                    <td className="px-5 py-4 font-bold text-rose-700">{Number(penalty.amount || 0).toLocaleString('vi-VN')} VNĐ</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${penalty.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : penalty.status === 'WAIVED' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-700'}`}>{penalty.status === 'PAID' ? 'Đã thanh toán' : penalty.status === 'WAIVED' ? 'Đã hủy' : 'Chưa thanh toán'}</span></td>
                    <td className="px-5 py-4">{penalty.status === 'UNPAID' && <button type="button" onClick={() => setSelectedPenalty(penalty)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800">Thanh toán</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {selectedPenalty && <PaymentModal penalty={selectedPenalty} onClose={() => setSelectedPenalty(null)} onPaid={loadData} />}
    </div>
  );
}
