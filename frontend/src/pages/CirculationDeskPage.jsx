import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, Check, ClipboardCheck, RefreshCw, Search, Undo2, X } from 'lucide-react';
import { approveLoan, findLoanByQr, getCirculationLoans, rejectLoan, returnLoan } from '../services/api';

const getErrorMessage = (error) => error?.message || 'Yêu cầu thất bại. Vui lòng thử lại.';

export default function CirculationDeskPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('PENDING');
  const [qrToken, setQrToken] = useState('');
  const [message, setMessage] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [action, setAction] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [returnCondition, setReturnCondition] = useState('GOOD');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorBusy = useRef(false);

  const loadLoans = useCallback(() => {
    setLoading(true);
    getCirculationLoans(filter ? { status: filter } : {})
      .then((response) => setLoans(response.data?.data || []))
      .catch((error) => setMessage({ type: 'error', text: getErrorMessage(error) }))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { loadLoans(); }, [loadLoans]);

  const searchByToken = useCallback(async (token) => {
    setMessage(null);
    try {
      const response = await findLoanByQr(token.trim());
      const found = response.data;
      setScanResult(found);
      setMessage({ type: 'success', text: `Tìm thấy phiếu #${found.loan_id}.` });
      setFilter(found.status === 'BORROWING' ? 'BORROWING' : 'PENDING');
      setQrToken('');
      setScannerOpen(false);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    if (!scannerOpen) return undefined;
    let active = true;
    let scanTimer;

    const startScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerError('Trình duyệt này không hỗ trợ truy cập camera. Bạn vẫn có thể nhập mã phiếu thủ công.');
        return;
      }
      if (!('BarcodeDetector' in window)) {
        setScannerError('Trình duyệt chưa hỗ trợ nhận diện QR bằng camera. Hãy dùng Chrome/Edge mới hoặc nhập mã thủ công.');
        return;
      }

      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanTimer = window.setInterval(async () => {
          if (detectorBusy.current || videoRef.current?.readyState < 2) return;
          detectorBusy.current = true;
          try {
            const codes = await detector.detect(videoRef.current);
            if (active && codes[0]?.rawValue) {
              await searchByToken(codes[0].rawValue);
            }
          } catch {
            setScannerError('Không đọc được mã QR này. Hãy giữ mã trong khung hình hoặc nhập mã thủ công.');
          } finally {
            detectorBusy.current = false;
          }
        }, 300);
      } catch {
        setScannerError('Không mở được camera. Hãy cấp quyền camera cho trang hoặc nhập mã phiếu thủ công.');
      }
    };

    setScannerError('');
    startScanner();
    return () => {
      active = false;
      window.clearInterval(scanTimer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      detectorBusy.current = false;
    };
  }, [scannerOpen, searchByToken]);

  const runAction = async (loan, action) => {
    if (action !== 'approve') {
      setAction({ loan, type: action });
      setRejectReason('');
      setReturnCondition('GOOD');
      return;
    }

    setBusyId(loan.loan_id);
    setMessage(null);
    try {
      await approveLoan(loan.loan_id);
      setMessage({ type: 'success', text: `Đã bàn giao phiếu #${loan.loan_id}.` });
      loadLoans();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  };

  const submitAction = async (event) => {
    event.preventDefault();
    if (!action) return;
    if (action.type === 'reject' && !rejectReason.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập lý do từ chối phiếu.' });
      return;
    }

    setBusyId(action.loan.loan_id);
    setMessage(null);
    try {
      if (action.type === 'reject') {
        await rejectLoan(action.loan.loan_id, rejectReason.trim());
        setMessage({ type: 'success', text: `Đã từ chối phiếu #${action.loan.loan_id}.` });
      } else {
        const response = await returnLoan(action.loan.loan_id, returnCondition);
        setMessage({
          type: 'success',
          text: response.data?.penalty_required
            ? `Đã ghi nhận trả phiếu #${action.loan.loan_id}. Các khoản phí phát sinh đã được đưa vào công nợ người mượn.`
            : `Đã ghi nhận trả phiếu #${action.loan.loan_id}.`,
        });
      }
      setAction(null);
      setScanResult(null);
      loadLoans();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setBusyId(null);
    }
  };

  const searchQr = async (event) => {
    event.preventDefault();
    await searchByToken(qrToken);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-700"><ClipboardCheck className="h-4 w-4" /> Nghiệp vụ quầy</div>
          <h1 className="text-3xl font-extrabold text-slate-900">Mượn – Trả tài sản</h1>
          <p className="mt-1 text-sm text-slate-500">Tra cứu mã phiếu, duyệt bàn giao và ghi nhận tài sản trả về.</p>
        </div>
        <button onClick={loadLoans} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      <form onSubmit={searchQr} className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input required value={qrToken} onChange={(event) => setQrToken(event.target.value)} placeholder="Quét hoặc nhập mã QR / mã phiếu" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"><Search className="h-4 w-4" /> Tra cứu</button>
        <button type="button" onClick={() => setScannerOpen((open) => !open)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
          <Camera className="h-4 w-4" /> {scannerOpen ? 'Tắt camera' : 'Quét bằng camera'}
        </button>
      </form>

      {scannerOpen && (
        <div className="mb-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,20rem),1fr]">
          <video ref={videoRef} muted playsInline className="aspect-video w-full rounded-xl bg-slate-950 object-cover" />
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold text-slate-800">Đưa mã QR vào khung hình</p>
            <p className="mt-1 text-xs text-slate-500">Camera chỉ hoạt động khi bạn cấp quyền truy cập.</p>
            {scannerError && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{scannerError}</p>}
          </div>
        </div>
      )}

      {scanResult && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Thông tin phiếu #{scanResult.loan_id}</p>
              <p className="mt-1 font-bold text-slate-900">{scanResult.resource?.title}</p>
              <p className="mt-1 text-xs text-slate-600">{scanResult.user?.full_name} · {scanResult.user?.user_code} · {scanResult.status}</p>
            </div>
            <button type="button" onClick={() => setScanResult(null)} aria-label="Đóng kết quả quét" className="rounded-lg p-2 text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 flex gap-2">
            {scanResult.status === 'PENDING' && <button type="button" onClick={() => runAction(scanResult, 'approve')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Xác nhận giao đồ</button>}
            {scanResult.status === 'BORROWING' && <button type="button" onClick={() => runAction(scanResult, 'return')} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">Ghi nhận trả</button>}
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-5 flex items-center gap-2 rounded-xl border p-3 text-sm ${message.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {message.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <Check className="h-5 w-5" />} {message.text}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {[['PENDING', 'Chờ bàn giao'], ['BORROWING', 'Đang mượn'], ['', 'Tất cả']].map(([value, label]) => (
          <button key={label} onClick={() => setFilter(value)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${filter === value ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{label}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16 text-slate-500"><RefreshCw className="h-5 w-5 animate-spin" /></div>
        ) : loans.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">Không có phiếu nào trong trạng thái này.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Phiếu</th><th className="px-5 py-3">Người mượn</th><th className="px-5 py-3">Tài nguyên</th><th className="px-5 py-3">Thời hạn</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Thao tác</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => (
                  <tr key={loan.loan_id}>
                    <td className="px-5 py-4 font-mono font-semibold text-slate-700">#{loan.loan_id}</td>
                    <td className="px-5 py-4"><p className="font-semibold text-slate-800">{loan.user?.full_name || loan.user?.user_code || `User ${loan.user_id}`}</p><p className="text-xs text-slate-500">{loan.user?.user_code || loan.user?.email}</p></td>
                    <td className="px-5 py-4"><p className="font-semibold text-slate-800">{loan.resource?.title}</p><p className="text-xs text-slate-500">{loan.resource?.code}</p></td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      Dự kiến: {new Date(loan.borrow_from).toLocaleString('vi-VN')} – {new Date(loan.due_date).toLocaleString('vi-VN')}
                      {loan.approved_at && <><br />Đã giao: {new Date(loan.approved_at).toLocaleString('vi-VN')}</>}
                      {loan.returned_at && <><br />Đã nhận trả: {new Date(loan.returned_at).toLocaleString('vi-VN')}</>}
                    </td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${loan.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{loan.status === 'PENDING' ? 'Chờ bàn giao' : 'Đang mượn'}</span></td>
                    <td className="px-5 py-4">
                      {loan.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button disabled={busyId === loan.loan_id} onClick={() => runAction(loan, 'approve')} title="Duyệt bàn giao" className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-50"><Check className="h-4 w-4" /></button>
                          <button disabled={busyId === loan.loan_id} onClick={() => runAction(loan, 'reject')} title="Từ chối" className="rounded-lg bg-rose-50 p-2 text-rose-700 hover:bg-rose-100 disabled:opacity-50"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <button disabled={busyId === loan.loan_id} onClick={() => runAction(loan, 'return')} className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"><Undo2 className="h-4 w-4" /> Ghi nhận trả</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {action && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          <form onSubmit={submitAction} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{action.type === 'reject' ? 'Từ chối phiếu mượn' : 'Ghi nhận trả tài sản'}</h2>
                <p className="mt-1 text-sm text-slate-500">Phiếu #{action.loan.loan_id} · {action.loan.resource?.title}</p>
              </div>
              <button type="button" onClick={() => setAction(null)} aria-label="Đóng biểu mẫu" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            {action.type === 'reject' ? (
              <label className="block text-sm font-semibold text-slate-700">
                Lý do từ chối
                <textarea required maxLength={1000} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={4} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" />
              </label>
            ) : (
              <>
                <label className="block text-sm font-semibold text-slate-700">
                  Tình trạng tài sản
                  <select value={returnCondition} onChange={(event) => setReturnCondition(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal">
                    <option value="GOOD">Tốt</option>
                    <option value="DAMAGED">Hư hỏng</option>
                    <option value="LOST">Làm mất</option>
                  </select>
                </label>
                {returnCondition !== 'GOOD' && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    Khi xác nhận trả, hệ thống sẽ tự tạo khoản bồi thường theo mức phí trong tham số hệ thống và ghi nhận vào công nợ của người mượn.
                  </p>
                )}
              </>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setAction(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Hủy</button>
              <button disabled={busyId === action.loan.loan_id} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                {busyId === action.loan.loan_id ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
