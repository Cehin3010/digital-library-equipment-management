import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, LoaderCircle, RotateCcw } from 'lucide-react';
import { getPaymentStatus } from '../services/api';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const transactionRef = searchParams.get('txn_ref') || searchParams.get('txnRef') || '';
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!transactionRef) {
      setError('Đường dẫn chưa có mã giao dịch để tra cứu.');
      setLoading(false);
      return () => { active = false; };
    }
    getPaymentStatus(transactionRef)
      .then((response) => {
        if (active) setStatus(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Không thể kiểm tra kết quả thanh toán.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [transactionRef]);

  const isPaid = status?.status === 'SUCCESS' || status?.status === 'PAID';

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {loading ? (
          <>
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-emerald-700" />
            <h1 className="mt-4 text-xl font-bold text-slate-900">Đang kiểm tra giao dịch</h1>
          </>
        ) : error ? (
          <>
            <AlertCircle className="mx-auto h-10 w-10 text-rose-600" />
            <h1 className="mt-4 text-xl font-bold text-slate-900">Chưa thể xác nhận thanh toán</h1>
            <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>
          </>
        ) : isPaid ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Thanh toán thành công</h1>
            <p className="mt-2 text-sm text-slate-600">Giao dịch {status.txn_ref || transactionRef} đã được xác nhận.</p>
            <p className="mt-1 text-sm text-emerald-800">Trạng thái công nợ sẽ được cập nhật theo kết quả từ hệ thống.</p>
          </>
        ) : (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-amber-600" />
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Thanh toán chưa hoàn tất</h1>
            <p className="mt-2 text-sm text-slate-600">Trạng thái giao dịch: {status?.status || 'Không xác định'}.</p>
          </>
        )}
        {!loading && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/my-history" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Về lịch sử và công nợ</Link>
            {!isPaid && <Link to="/my-history" className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw className="h-4 w-4" /> Thử thanh toán lại</Link>}
          </div>
        )}
      </section>
    </main>
  );
}
