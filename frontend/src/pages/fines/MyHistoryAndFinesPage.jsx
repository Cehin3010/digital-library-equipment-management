import React, { useState, useEffect } from 'react';
import { getMyLoans, getMyPenalties } from '../../services/paymentApi';
import PaymentModal from '../../components/fines/PaymentModal';
import NotificationBell from '../../components/common/NotificationBell';

export default function MyHistoryAndFinesPage() {
  const [loans, setLoans] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [selectedPenalty, setSelectedPenalty] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [loansRes, penaltiesRes] = await Promise.all([getMyLoans(), getMyPenalties()]);
      if (loansRes.data.success) setLoans(loansRes.data.data);
      if (penaltiesRes.data.success) setPenalties(penaltiesRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const totalDebt = penalties
    .filter((p) => p.status === 'UNPAID')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lịch sử mượn & Công nợ cá nhân</h1>
          <p className="text-sm text-gray-500">Quản lý các phiếu mượn tài sản và phí phạt</p>
        </div>
        <NotificationBell />
      </div>

      {/* Thống kê công nợ */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
        <div>
          <span className="text-xs text-red-600 font-semibold uppercase">Tổng công nợ hiện tại</span>
          <p className="text-2xl font-bold text-red-700">{totalDebt.toLocaleString('vi-VN')} VND</p>
        </div>
      </div>

      {/* Bảng Phí phạt */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <h2 className="p-4 font-bold border-b text-gray-700 bg-gray-50">Danh sách khoản phạt</h2>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3">Lý do</th>
              <th className="p-3">Số ngày trễ</th>
              <th className="p-3">Số tiền</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {penalties.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{item.reason}</td>
                <td className="p-3">{item.overdue_days} ngày</td>
                <td className="p-3 font-bold text-red-600">
                  {Number(item.amount).toLocaleString('vi-VN')} VND
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-xs rounded font-semibold ${
                      item.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </td>
                <td className="p-3">
                  {item.status === 'UNPAID' && (
                    <button
                      onClick={() => setSelectedPenalty(item)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                    >
                      Thanh toán
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPenalty && (
        <PaymentModal penalty={selectedPenalty} onClose={() => setSelectedPenalty(null)} />
      )}
    </div>
  );
}