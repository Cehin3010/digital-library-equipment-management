import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Copy, QrCode, RefreshCw, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cancelLoan, confirmLoan, getMyLoan } from '../services/api';

function getRemainingSeconds(expiresAt) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export default function HoldConfirmPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(location.state?.loan || null);
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(location.state?.loan?.hold_expires_at));
  const [loading, setLoading] = useState(!location.state?.loan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const expiryRequestStarted = useRef(false);

  const reloadLoan = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyLoan(id);
      setLoan(response.data);
      setRemaining(getRemainingSeconds(response.data?.hold_expires_at));
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải thông tin phiếu mượn.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!location.state?.loan) reloadLoan();
  }, [location.state, reloadLoan]);

  useEffect(() => {
    if (loan?.status !== 'HOLDING' || !loan.hold_expires_at) return undefined;
    expiryRequestStarted.current = false;

    const updateCountdown = () => {
      const seconds = getRemainingSeconds(loan.hold_expires_at);
      setRemaining(seconds);
      if (seconds === 0 && !expiryRequestStarted.current) {
        expiryRequestStarted.current = true;
        confirmLoan(id)
          .catch(() => getMyLoan(id))
          .then((response) => {
            if (response?.data) setLoan(response.data);
          })
          .catch((requestError) => {
            setError(requestError.message || 'Không thể cập nhật trạng thái phiếu đã hết hạn.');
          });
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [id, loan?.hold_expires_at, loan?.status]);

  const confirmReservation = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await confirmLoan(id);
      setLoan(response.data);
      setNotice(response.message || 'Đã xác nhận. Mang mã QR đến quầy thư viện để nhận tài sản.');
    } catch (requestError) {
      if (requestError?.message?.includes('hết hạn') || remaining === 0) {
        setNotice('Thời gian giữ chỗ đã hết. Tài nguyên được trả lại kho.');
        await reloadLoan();
      } else {
        setError(requestError.message || 'Không thể xác nhận phiếu mượn.');
      }
    } finally {
      setBusy(false);
    }
  };

  const cancelReservation = async () => {
    setBusy(true);
    setError('');
    try {
      await cancelLoan(id);
      navigate('/my-loans', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Không thể hủy phiếu mượn.');
    } finally {
      setBusy(false);
    }
  };

  const copyQrToken = async () => {
    try {
      await navigator.clipboard.writeText(loan.qr_token);
      setNotice('Đã sao chép mã phiếu.');
    } catch {
      setError('Không thể sao chép tự động. Bạn có thể chọn và sao chép mã phiếu bên dưới.');
    }
  };

  const isExpired = loan?.status === 'EXPIRED' || (loan?.status === 'HOLDING' && remaining === 0);

  if (loading && !loan) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 px-4 py-24 text-slate-500">
        <RefreshCw className="h-5 w-5 animate-spin" /> Đang tải phiếu mượn...
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-600" />
          <p className="font-semibold text-rose-800">{error || 'Không tìm thấy phiếu mượn.'}</p>
          <button onClick={() => navigate('/')} className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Về tra cứu tài nguyên</button>
        </div>
      </div>
    );
  }

  const isPending = loan.status === 'PENDING';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={() => navigate('/my-loans')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Lịch sử mượn
      </button>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <QrCode className="h-4 w-4" /> Xác nhận giữ chỗ
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">{loan.resource?.title || 'Phiếu mượn tài sản'}</h1>
          <p className="mt-1 text-sm text-slate-500">Phiếu #{loan.loan_id} · {loan.resource?.code}</p>
        </div>

        <div className="space-y-5 p-6">
          {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
          {notice && <div role="status" className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" />{notice}</div>}

          {loan.status === 'HOLDING' && !isExpired && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
              <p className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-900"><Clock3 className="h-4 w-4" /> Thời gian còn lại để xác nhận</p>
              <p className="mt-2 font-mono text-5xl font-black tabular-nums text-amber-950">{formatCountdown(remaining)}</p>
              <p className="mt-2 text-xs text-amber-800">Phiếu giữ tài nguyên trong 10 phút kể từ lúc tạo.</p>
            </div>
          )}

          {isExpired ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <p className="flex items-center gap-2 font-bold"><XCircle className="h-5 w-5" /> Phiếu đã hết thời gian giữ chỗ</p>
              <p className="mt-1">Tài nguyên được trả lại kho. Bạn có thể quay về danh mục để đặt lại.</p>
            </div>
          ) : isPending ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-bold">Phiếu đã được xác nhận, đang chờ quầy thư viện bàn giao.</p>
              <p className="mt-1">Xuất trình mã QR dưới đây khi đến nhận tài sản.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Kiểm tra thông tin phiếu và xác nhận trước khi thời gian giữ chỗ kết thúc.</p>
          )}

          {loan.qr_token && !isExpired && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 p-5">
              <QRCodeSVG value={loan.qr_token} size={180} level="M" includeMargin />
              <p className="text-xs font-semibold text-slate-600">Mã QR nhận tài sản</p>
              <div className="flex w-full gap-2">
                <input readOnly aria-label="Mã phiếu" value={loan.qr_token} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700" />
                <button type="button" onClick={copyQrToken} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Copy className="h-4 w-4" /> Sao chép
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            {loan.status === 'HOLDING' && !isExpired && (
              <>
                <button disabled={busy} onClick={cancelReservation} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Hủy giữ chỗ</button>
                <button disabled={busy || remaining === 0} onClick={confirmReservation} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? 'Đang xác nhận...' : 'Xác nhận đặt mượn'}
                </button>
              </>
            )}
            {isPending && <button onClick={() => navigate('/my-loans')} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">Xem lịch sử mượn</button>}
            {isExpired && <button onClick={() => navigate('/')} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700">Đặt lại tài nguyên</button>}
          </div>
        </div>
      </section>
    </div>
  );
}
