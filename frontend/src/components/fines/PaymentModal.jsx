import React, { useState } from 'react';
import { AlertCircle, CreditCard, LoaderCircle, X } from 'lucide-react';
import { simulatePenaltyPayment } from '../../services/api';

export default function PaymentModal({ penalty, onClose, onPaid }) {
  const [provider, setProvider] = useState('VNPAY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const completePayment = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const response = await simulatePenaltyPayment(penalty.penalty_id || penalty.id, provider);
      setNotice(response.message || 'Thanh toán thành công.');
      onPaid?.();
    } catch (requestError) {
      setError(requestError.message || 'Không thể hoàn tất thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="payment-title" className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700"><CreditCard className="h-4 w-4" /> Thanh toán công nợ</p>
            <h2 id="payment-title" className="text-xl font-extrabold text-slate-900">Thanh toán khoản thu</h2>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">{penalty.note || penalty.reason || 'Khoản phạt'}</p>
          <p className="mt-1 text-lg font-black text-rose-700">{Number(penalty.amount || 0).toLocaleString('vi-VN')} VNĐ</p>
        </div>
        <p className="text-xs text-slate-500">Giao dịch được xử lý trong hệ thống; không thu tiền thật.</p>
        {error && <p role="alert" className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-slate-700">Thanh toán qua</legend>
          {[['VNPAY', 'VNPay'], ['MOMO', 'MoMo']].map(([value, label]) => (
            <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${provider === value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
              <input type="radio" name="payment-provider" value={value} checked={provider === value} onChange={() => setProvider(value)} />
              <span className="font-semibold text-slate-700">{label}</span>
            </label>
          ))}
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Để sau</button>
          <button type="button" disabled={loading || Boolean(notice)} onClick={completePayment} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
            {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {loading ? 'Đang xử lý...' : notice ? 'Đã thanh toán' : 'Thanh toán'}
          </button>
        </div>
      </section>
    </div>
  );
}
