import React, { useState } from 'react';
import { initiatePayment } from '../../services/paymentApi';

export default function PaymentModal({ penalty, onClose }) {
  const [provider, setProvider] = useState('VNPAY');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await initiatePayment(penalty.id, provider);
      if (res.data.success) {
        window.location.href = res.data.data.payment_url;
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Thanh toán phí phạt</h3>
        <p className="text-sm text-gray-600 mb-2">Lý do: {penalty.reason}</p>
        <p className="text-lg font-bold text-red-600 mb-4">
          Số tiền: {Number(penalty.amount).toLocaleString('vi-VN')} VND
        </p>

        <div className="space-y-2 mb-6">
          <label className="flex items-center space-x-2 border p-3 rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="provider"
              value="VNPAY"
              checked={provider === 'VNPAY'}
              onChange={(e) => setProvider(e.target.value)}
            />
            <span className="font-medium text-sm">Cổng VNPay (Thẻ / QR)</span>
          </label>
          <label className="flex items-center space-x-2 border p-3 rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="provider"
              value="MOMO"
              checked={provider === 'MOMO'}
              onChange={(e) => setProvider(e.target.value)}
            />
            <span className="font-medium text-sm">Ví điện tử MoMo</span>
          </label>
        </div>

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">
            Hủy
          </button>
          <button
            onClick={handlePay}
            disabled={loading}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {loading ? 'Đang chuyển hướng...' : 'Thanh toán ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}