import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Clock3, Copy, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cancelLoan, getMyLoans } from '../services/api';

const statusLabels = {
  HOLDING: 'Đang giữ chỗ',
  PENDING: 'Chờ quầy duyệt',
  BORROWING: 'Đang mượn',
  RETURNED: 'Đã trả',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn giữ chỗ',
};

export default function MyLoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadLoans = useCallback(() => {
    setLoading(true);
    setError('');
    getMyLoans()
      .then((response) => setLoans(response.data?.data || []))
      .catch((requestError) => setError(requestError.message || 'Không thể tải lịch sử mượn.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadLoans(); }, [loadLoans]);

  const handleCancel = async (loan) => {
    try {
      await cancelLoan(loan.loan_id);
      setNotice(`Đã hủy phiếu #${loan.loan_id}.`);
      loadLoans();
    } catch (requestError) {
      setError(requestError.message || 'Không thể hủy phiếu mượn.');
    }
  };

  const copyToken = async (token) => {
    try {
      await navigator.clipboard.writeText(token);
      setNotice('Đã sao chép mã phiếu.');
    } catch {
      setError('Không thể sao chép tự động. Hãy chọn và sao chép mã phiếu.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-700"><Clock3 className="h-4 w-4" /> Tài khoản của tôi</div>
          <h1 className="text-3xl font-extrabold text-slate-900">Lịch sử mượn tài sản</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi mã phiếu và trạng thái xử lý tại quầy.</p>
        </div>
        <button onClick={loadLoans} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới</button>
      </div>

      {(error || notice) && (
        <div className={`mb-5 flex items-center gap-2 rounded-xl border p-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {error && <AlertCircle className="h-5 w-5 shrink-0" />}{error || notice}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-500"><RefreshCw className="h-5 w-5 animate-spin" /></div>
        ) : loans.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">Bạn chưa có phiếu mượn nào.</div>
        ) : loans.map((loan) => (
          <article key={loan.loan_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{loan.resource?.title || `Tài nguyên #${loan.resource_id}`}</p>
                <p className="mt-1 text-xs text-slate-500">Phiếu #{loan.loan_id} · {loan.resource?.code}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${loan.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : loan.status === 'BORROWING' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                {statusLabels[loan.status] || loan.status}
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>Dự kiến nhận: {new Date(loan.borrow_from).toLocaleString('vi-VN')}</p>
              <p>Thực tế nhận: {loan.approved_at ? new Date(loan.approved_at).toLocaleString('vi-VN') : '—'}</p>
              <p>Trả dự kiến: {new Date(loan.due_date).toLocaleString('vi-VN')}</p>
              <p>Thực tế trả: {loan.returned_at ? new Date(loan.returned_at).toLocaleString('vi-VN') : '—'}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <QRCodeSVG value={loan.qr_token} size={88} level="M" includeMargin />
                <button onClick={() => copyToken(loan.qr_token)} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 hover:bg-slate-100">
                  <Copy className="h-4 w-4" /> Sao chép mã phiếu
                </button>
              </div>
              {['HOLDING', 'PENDING'].includes(loan.status) && (
                <button onClick={() => handleCancel(loan)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Hủy phiếu</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
