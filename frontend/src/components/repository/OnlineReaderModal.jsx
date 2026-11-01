import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, ExternalLink, BookOpen, AlertCircle } from 'lucide-react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getDigitalReadFile } from '../../services/api';

function PdfPage({ document, pageNumber, viewerRef }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageSize, setPageSize] = useState(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [renderError, setRenderError] = useState('');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const root = viewerRef.current;
    if (!root || !('IntersectionObserver' in window)) {
      setIsNearViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsNearViewport(true);
        observer.disconnect();
      }
    }, { root, rootMargin: '800px 0px' });
    observer.observe(container);
    return () => observer.disconnect();
  }, [viewerRef]);

  useEffect(() => {
    let isActive = true;
    document.getPage(pageNumber).then((page) => {
      if (isActive) {
        const viewport = page.getViewport({ scale: 1 });
        setPageSize({ width: viewport.width, height: viewport.height });
      }
    }).catch(() => {
      if (isActive) setRenderError('Không thể hiển thị trang PDF này.');
    });

    return () => {
      isActive = false;
    };
  }, [document, pageNumber]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!document || !containerWidth || !pageSize || !isNearViewport || !canvasRef.current) return undefined;

    let isActive = true;
    let renderTask;
    setRenderError('');

    document.getPage(pageNumber)
      .then((page) => {
        if (!isActive) return;

        const scale = Math.min((containerWidth - 32) / pageSize.width, 1.5);
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
        });
        return renderTask.promise;
      })
      .catch((error) => {
        if (isActive && error.name !== 'RenderingCancelledException') {
          setRenderError('Không thể hiển thị trang PDF này.');
        }
      });

    return () => {
      isActive = false;
      renderTask?.cancel();
    };
  }, [document, pageNumber, containerWidth, pageSize, isNearViewport]);

  return (
    <div
      ref={containerRef}
      data-pdf-page={pageNumber}
      className="flex justify-center p-4"
      style={pageSize && containerWidth ? {
        minHeight: `${Math.min(containerWidth - 32, pageSize.width * 1.5) * pageSize.height / pageSize.width + 32}px`,
      } : undefined}
    >
      {renderError ? (
        <p className="self-center text-rose-700">{renderError}</p>
      ) : (
        <canvas
          ref={canvasRef}
          aria-label={`Trang ${pageNumber}`}
          className="max-w-full self-start bg-white shadow-lg"
        />
      )}
    </div>
  );
}

export default function OnlineReaderModal({ resource, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const viewerRef = useRef(null);
  const pageRefs = useRef([]);
  const [progress, setProgress] = useState(() => {
    try {
      return Number(localStorage.getItem(`digital-library-reading-progress-${resource?.resource_id}`)) || 0;
    } catch {
      return 0;
    }
  });
  const [progressSaveError, setProgressSaveError] = useState('');

  useEffect(() => {
    if (!resource) return undefined;

    let objectUrl;
    let loadingTask;
    let isActive = true;
    setPdfUrl('');
    setPdfDocument(null);
    setPageNumber(1);
    setLoadError('');
    setIsLoading(true);

    getDigitalReadFile(resource.resource_id)
      .then(async (pdf) => {
        if (!isActive) return;
        objectUrl = URL.createObjectURL(pdf);
        setPdfUrl(objectUrl);
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        loadingTask = pdfjsLib.getDocument({ data: await pdf.arrayBuffer() });
        const document = await loadingTask.promise;
        if (isActive) setPdfDocument(document);
      })
      .catch((error) => {
        if (!isActive) return;
        setLoadError(
          error.status === 401
            ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đọc tài liệu.'
            : 'Không thể tải hoặc đọc tệp PDF. Vui lòng thử lại.'
        );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
      loadingTask?.destroy();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resource?.resource_id, loadAttempt]);

  useEffect(() => {
    if (!resource) return;
    try {
      localStorage.setItem(`digital-library-reading-progress-${resource.resource_id}`, String(progress));
      setProgressSaveError('');
    } catch {
      setProgressSaveError('Không thể lưu tiến độ đọc trên trình duyệt này.');
    }
  }, [progress, resource]);

  const handleViewerScroll = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const maxScroll = viewer.scrollHeight - viewer.clientHeight;
    setProgress(maxScroll > 0 ? Math.round((viewer.scrollTop / maxScroll) * 100) : 100);

    const viewerMiddle = viewer.getBoundingClientRect().top + viewer.clientHeight / 2;
    const visiblePage = pageRefs.current.findIndex((page) => {
      if (!page) return false;
      const bounds = page.getBoundingClientRect();
      return bounds.top <= viewerMiddle && bounds.bottom >= viewerMiddle;
    });
    if (visiblePage >= 0) setPageNumber(visiblePage + 1);
  };

  const scrollToPage = (page) => {
    const viewer = viewerRef.current;
    const target = pageRefs.current[page - 1];
    if (!viewer || !target) return;

    viewer.scrollTo({
      top: target.getBoundingClientRect().top - viewer.getBoundingClientRect().top + viewer.scrollTop,
      behavior: 'smooth',
    });
  };

  if (!resource) return null;

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
              href={pdfUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!pdfUrl}
              className={`p-2 rounded-lg transition ${pdfUrl ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'}`}
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
        <div ref={viewerRef} onScroll={handleViewerScroll} className="flex-1 bg-slate-100 relative overflow-auto">
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                Không thể tải tệp tài liệu số
              </h4>
              <p className="text-gray-600 max-w-md mb-6">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition"
              >
                Thử tải lại
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex h-full items-center justify-center text-slate-600">
              Đang tải tài liệu...
            </div>
          ) : !pdfDocument ? (
            <div className="flex h-full items-center justify-center text-slate-600">
              Không tìm thấy trang PDF để hiển thị.
            </div>
          ) : (
            <div className="flex flex-col">
              {Array.from({ length: pdfDocument.numPages }, (_, index) => (
                <div
                  key={index + 1}
                  ref={(element) => { pageRefs.current[index] = element; }}
                >
                  <PdfPage document={pdfDocument} pageNumber={index + 1} viewerRef={viewerRef} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          {pdfDocument && (
            <div className="mb-3 flex items-center justify-center gap-4 text-sm">
              <button
                type="button"
                onClick={() => scrollToPage(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trang trước
              </button>
              <span className="tabular-nums text-slate-600">
                Trang {pageNumber} / {pdfDocument.numPages}
              </span>
              <button
                type="button"
                onClick={() => scrollToPage(Math.min(pdfDocument.numPages, pageNumber + 1))}
                disabled={pageNumber >= pdfDocument.numPages}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          )}
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <label htmlFor="reading-progress" className="font-semibold text-slate-700">Tiến độ đọc (tự cập nhật khi cuộn)</label>
            <span className="font-bold tabular-nums text-emerald-700">{progress}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setProgress((value) => Math.max(0, value - 5))}
              disabled={progress <= 0}
              aria-label="Giảm tiến độ đọc 5%"
              className="h-9 w-9 shrink-0 rounded-lg border border-slate-300 text-lg font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              −
            </button>
            <input
              id="reading-progress"
              type="range"
              min="0"
              max="100"
              step="1"
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
              aria-label="Tiến độ đọc"
              aria-valuetext={`${progress}% đã đọc`}
              className="h-8 min-w-0 flex-1 cursor-pointer touch-pan-y accent-emerald-600"
            />
            <button
              type="button"
              onClick={() => setProgress((value) => Math.min(100, value + 5))}
              disabled={progress >= 100}
              aria-label="Tăng tiến độ đọc 5%"
              className="h-9 w-9 shrink-0 rounded-lg border border-slate-300 text-lg font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-slate-500">
            <span>Tiến độ được lưu trong trình duyệt này.</span>
            {progressSaveError ? <span className="text-rose-700">{progressSaveError}</span> : <span>Đọc trực tuyến</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
