import React, { useState } from 'react';
import { X, Maximize2, Minimize2, ExternalLink, BookOpen, AlertCircle } from 'lucide-react';
import { getDigitalReadUrl } from '../../services/api';

export default function OnlineReaderModal({ resource, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!resource) return null;

  const readUrl = getDigitalReadUrl(resource.resource_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 animate-fade-in">
      <div
        className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-screen h-screen rounded-none'
            : 'w-full max-w-6xl h-[90vh]'
        }`}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="font-semibold text-lg text-slate-100 truncate">
                {resource.title}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {resource.author_or_brand || 'Tác giả chưa cập nhật'} • Mã: {resource.code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={readUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Mở trong tab mới"
            >
              <ExternalLink className="w-5 h-5" />
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition"
              title="Đóng trình đọc"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nội dung PDF Viewer */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden">
          {hasError ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Không thể tải tệp tài liệu số
              </h4>
              <p className="text-gray-600 max-w-md mb-6">
                Tệp tin PDF chưa được đính kèm hoặc bạn chưa đăng nhập tài khoản trường.
              </p>
              <a
                href={readUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition"
              >
                Mở liên kết trực tiếp
              </a>
            </div>
          ) : (
            <iframe
              src={`${readUrl}#toolbar=1&navpanes=1`}
              className="w-full h-full border-0"
              title={`Online Reader - ${resource.title}`}
              onError={() => setHasError(true)}
            />
          )}
        </div>

        {/* Footer ghi chú bảo mật học liệu */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Hệ thống ghi nhận lượt đọc vào Nhật ký kiểm toán phục vụ báo cáo.</span>
          <span className="font-medium text-emerald-600">Đọc trực tuyến 24/7</span>
        </div>
      </div>
    </div>
  );
}

