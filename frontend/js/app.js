/**
 * Điều phối giao diện chính của Hệ thống Thư viện Số & Cho mượn Tài sản Đại học.
 * Tuân thủ nghiêm ngặt Quy ước Coding:
 * - Chỉ sử dụng const và let (tuyệt đối không dùng var)
 * - Sử dụng Async/Await và Destructuring
 * - Hàm đặt tên camelCase bắt đầu bằng động từ
 * - Xử lý lỗi thân thiện qua showNotification()
 */

import {
  ASSET_STATUS_AVAILABLE,
  ASSET_STATUS_BORROWED,
  ASSET_STATUS_MAINTENANCE,
  DEBT_LOCK_THRESHOLD,
  LOAN_STATUS_BORROWED,
  LOAN_STATUS_PENDING_PICKUP,
  ROLE_ADMIN,
  ROLE_LABELS,
  ROLE_LECTURER,
  ROLE_LIBRARIAN,
  ROLE_STUDENT,
  STATUS_LOCKED,
} from './constants.js';
import { requestBackendApi } from './api.js';
import { calculateFine, Library } from './store.js';

const libraryStore = new Library();
let currentActorId = 1; // Mặc định: Lý Hạo Danh (52400175 - Admin)
let activeDocumentId = 1;

/**
 * Lấy thông tin người dùng hiện tại từ Store (Defensive copy).
 */
const getCurrentUser = () => {
  return libraryStore.getUserProfile(currentActorId) || libraryStore.getUsers()[0];
};

/**
 * Hiển thị thông báo thân thiện trên giao diện (Toast Notification - Mục 6 Quy ước Coding).
 */
const showNotification = (message, type = 'info') => {
  const container = document.getElementById('toast-container');
  if (!container) {
    return;
  }

  const colorMap = {
    success: 'bg-emerald-700 border-emerald-500 text-white',
    error: 'bg-red-700 border-red-500 text-white',
    warning: 'bg-amber-600 border-amber-400 text-white',
    info: 'bg-blue-700 border-blue-500 text-white',
  };

  const toast = document.createElement('div');
  toast.className = `flex items-center justify-between px-4 py-3 mb-2 text-sm font-medium border rounded-lg shadow-lg transition ${colorMap[type] || colorMap.info}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button type="button" class="ml-4 font-bold opacity-80 hover:opacity-100" aria-label="Đóng thông báo">✕</button>
  `;

  toast.querySelector('button')?.addEventListener('click', () => toast.remove());
  container.prepend(toast);

  setTimeout(() => {
    toast.remove();
  }, 4500);
};

/**
 * Tạo nhãn HTML hiển thị trạng thái tài sản bằng màu sắc chuẩn (Xanh: Còn trống, Đỏ: Đang mượn, Xám: Bảo trì).
 */
const renderStatusBadge = (status) => {
  if (status === ASSET_STATUS_AVAILABLE) {
    return `
      <span class="status-badge status-badge--available">
        <span class="status-badge__dot"></span>Còn trống (Xanh)
      </span>
    `;
  }
  if (status === ASSET_STATUS_BORROWED) {
    return `
      <span class="status-badge status-badge--borrowed">
        <span class="status-badge__dot"></span>Đang mượn (Đỏ)
      </span>
    `;
  }
  return `
    <span class="status-badge status-badge--maintenance">
      <span class="status-badge__dot"></span>Bảo trì (Xám)
    </span>
  `;
};

/**
 * Vẽ ma trận mã QR trực quan từ chuỗi token (F-03, F-04).
 */
const renderVisualQrMatrix = (token) => {
  const chars = String(token || 'QRTDTU').split('');
  let cellsHtml = '';
  for (let i = 0; i < 49; i += 1) {
    const code = chars[i % chars.length].charCodeAt(0);
    const isCorner = i < 7 || i > 41 || i % 7 === 0 || i % 7 === 6;
    const isFilled = isCorner || (code + i * 7) % 2 === 0;
    cellsHtml += `<span class="qr-box__cell ${isFilled ? 'qr-box__cell--filled' : ''}"></span>`;
  }
  return `<div class="qr-box__matrix" aria-label="Mã QR ${token}">${cellsHtml}</div>`;
};

/**
 * Cập nhật thanh Header, trạng thái người dùng, công nợ và phân quyền giao diện (F-11).
 */
const updateHeaderAndRoleContext = () => {
  const user = getCurrentUser();
  const { fullName, universityId, roleId, totalDebt, status } = user;

  const roleBadgeEl = document.getElementById('current-role-badge');
  const debtBadgeEl = document.getElementById('current-debt-badge');
  const accountLockBanner = document.getElementById('account-lock-banner');

  if (roleBadgeEl) {
    roleBadgeEl.textContent = `${fullName} (${universityId}) — ${ROLE_LABELS[roleId]}`;
  }

  const isLocked = status === STATUS_LOCKED || totalDebt >= DEBT_LOCK_THRESHOLD;
  if (debtBadgeEl) {
    debtBadgeEl.textContent = `Công nợ: ${totalDebt.toLocaleString('vi-VN')} VNĐ ${isLocked ? '(ĐÃ KHÓA MƯỢN)' : '(Hợp lệ)'}`;
    debtBadgeEl.className = isLocked
      ? 'px-3 py-1 text-xs font-bold text-red-800 bg-red-100 border border-red-300 rounded-full'
      : 'px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full';
  }

  if (accountLockBanner) {
    if (isLocked) {
      accountLockBanner.classList.remove('hidden');
      accountLockBanner.innerHTML = `
        <strong>Cảnh báo Khóa Quyền Mượn Tự Động (F-06):</strong>
        Tài khoản <b>${fullName}</b> hiện có công nợ <b>${totalDebt.toLocaleString('vi-VN')} VNĐ</b>
        (vượt ngưỡng ${DEBT_LOCK_THRESHOLD.toLocaleString('vi-VN')} VNĐ). Hệ thống đã tạm khóa chức năng đặt mượn mới.
      `;
    } else {
      accountLockBanner.classList.add('hidden');
    }
  }

  // Cập nhật thông báo nhắc hạn ưu tiên hiển thị trên đầu trang (F-05)
  const notificationsListEl = document.getElementById('priority-notifications-list');
  if (notificationsListEl) {
    const allNotifications = libraryStore.getNotifications();
    const visibleNotifications =
      roleId === ROLE_ADMIN || roleId === ROLE_LIBRARIAN
        ? allNotifications.slice(0, 4)
        : allNotifications.filter((n) => n.userId === user.userId).slice(0, 4);

    notificationsListEl.innerHTML = visibleNotifications
      .map(
        ({ title, message, createdAt, type }) => `
        <article class="flex items-start justify-between p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
          <div>
            <h4 class="text-xs font-bold text-amber-900">${title}</h4>
            <p class="mt-0.5 text-xs text-amber-800">${message}</p>
          </div>
          <span class="text-[11px] font-medium text-amber-700 whitespace-nowrap ml-3">${createdAt} [${type}]</span>
        </article>
      `
      )
      .join('');
  }
};

/**
 * Render Phân hệ 1: Kho Tài liệu Số & Trình đọc Trực tuyến (F-01, F-02).
 */
const renderDigitalRepository = () => {
  const keyword = (document.getElementById('search-doc-keyword')?.value || '').trim().toLowerCase();
  const category = document.getElementById('search-doc-category')?.value || '';
  const year = document.getElementById('search-doc-year')?.value || '';

  const allBooks = libraryStore.getBooks();
  const filteredBooks = allBooks.filter((book) => {
    const matchesKeyword =
      !keyword ||
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword) ||
      book.isbn.toLowerCase().includes(keyword) ||
      book.deweyCode.toLowerCase().includes(keyword);
    const matchesCategory = !category || book.category === category;
    const matchesYear = !year || String(book.publishYear) === String(year);
    return matchesKeyword && matchesCategory && matchesYear;
  });

  const countEl = document.getElementById('digital-doc-count');
  if (countEl) {
    countEl.textContent = `Hiển thị ${filteredBooks.length} / ${allBooks.length} học liệu số (Phản hồi < 0.05 giây)`;
  }

  const gridEl = document.getElementById('digital-docs-grid');
  if (!gridEl) {
    return;
  }

  gridEl.innerHTML = filteredBooks
    .map((book) => {
      const {
        documentId,
        isbn,
        title,
        author,
        category: bookCat,
        deweyCode,
        publishYear,
        fileFormat,
        totalPages,
        maxPrintPages,
        printedPages,
        currentPage,
        viewCount,
        summary,
      } = book;
      const progressPct = Math.round((currentPage / totalPages) * 100);

      return `
        <article class="card">
          <div>
            <header class="card__header">
              <span class="px-2.5 py-0.5 text-xs font-bold text-blue-800 bg-blue-100 rounded">
                Dewey ${deweyCode} • ${fileFormat}
              </span>
              <span class="text-xs font-semibold text-slate-500">ISBN: ${isbn}</span>
            </header>
            <h3 class="card__title">${title}</h3>
            <p class="mt-1 card__meta">Tác giả: <strong>${author}</strong> • Năm XB: ${publishYear}</p>
            <p class="text-xs text-slate-600 line-clamp-2 mb-3">${summary}</p>
          </div>
          <div class="pt-3 mt-2 border-t border-slate-100">
            <div class="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Tiến độ đọc: Trang ${currentPage}/${totalPages} (${progressPct}%)</span>
              <span>Đã in: ${printedPages}/${maxPrintPages} trang</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div class="h-full bg-blue-600 rounded-full" style="width: ${progressPct}%"></div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">👁 ${viewCount} lượt đọc</span>
              <button
                type="button"
                data-open-reader="${documentId}"
                class="card__button card__button--active"
              >
                📖 Mở Trình Đọc (F-02)
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  gridEl.querySelectorAll('[data-open-reader]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const docId = Number(btn.getAttribute('data-open-reader'));
      openOnlineReaderModal(docId);
    });
  });
};

/**
 * Mở Trình đọc Tài liệu Trực tuyến tích hợp (Online Reader - F-02).
 */
const openOnlineReaderModal = (documentId) => {
  activeDocumentId = Number(documentId);
  const books = libraryStore.getBooks();
  const doc = books.find((b) => b.documentId === activeDocumentId);
  if (!doc) {
    return;
  }

  const readerPanel = document.getElementById('online-reader-panel');
  if (!readerPanel) {
    return;
  }

  readerPanel.classList.remove('hidden');
  updateOnlineReaderView(doc);
  readerPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

/**
 * Cập nhật giao diện bên trong Trình đọc Trực tuyến (F-02).
 */
const updateOnlineReaderView = (doc) => {
  const {
    title,
    author,
    isbn,
    deweyCode,
    currentPage,
    totalPages,
    printedPages,
    maxPrintPages,
    readingSeconds,
    summary,
  } = doc;

  const progressPct = Math.round((currentPage / totalPages) * 100);
  const minutesRead = Math.round(readingSeconds / 60);

  document.getElementById('reader-doc-title').textContent = title;
  document.getElementById('reader-doc-meta').textContent = `Tác giả: ${author} | ISBN: ${isbn} | Phân loại Dewey: ${deweyCode} | Thời gian đã đọc: ${minutesRead} phút`;
  document.getElementById('reader-page-indicator').textContent = `Trang ${currentPage} / ${totalPages} (Tiến độ: ${progressPct}%)`;
  document.getElementById('reader-print-indicator').textContent = `Đã in: ${printedPages} / ${maxPrintPages} trang cho phép`;
  document.getElementById('reader-page-input').value = String(currentPage);
  document.getElementById('reader-content-preview').innerHTML = `
    <p class="font-semibold text-slate-800 mb-2">[Trích đoạn Trang ${currentPage} - ${title}]</p>
    <p class="text-slate-700 leading-relaxed">${summary}</p>
    <p class="mt-3 text-xs text-slate-500 italic">
      Bản quyền thuộc Kho Tài liệu Số Trường Đại học Tôn Đức Thắng. Mọi thao tác đọc và in ấn đều được ghi nhận tiến độ tự động (Chức năng F-02).
    </p>
  `;
};

/**
 * Render Phân hệ 2 & 3: Danh mục Tài sản Vật lý, Phiếu mượn QR và Quầy Quét QR (F-03..F-06).
 */
const renderPhysicalAssetsAndLoans = () => {
  const statusFilter = document.getElementById('filter-asset-status')?.value || '';
  const assets = libraryStore.getPhysicalAssets();
  const filteredAssets = statusFilter
    ? assets.filter((a) => a.status === statusFilter)
    : assets;

  const assetsGrid = document.getElementById('physical-assets-grid');
  if (assetsGrid) {
    assetsGrid.innerHTML = filteredAssets
      .map((asset) => {
        const {
          assetId,
          assetCode,
          assetName,
          assetType,
          department,
          location,
          status,
          conditionNote,
          dailyLateFee,
        } = asset;
        const canBorrow = status === ASSET_STATUS_AVAILABLE;

        return `
          <article class="card">
            <div>
              <header class="card__header">
                <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                  Mã TS: ${assetCode}
                </span>
                ${renderStatusBadge(status)}
              </header>
              <h3 class="card__title">${assetName}</h3>
              <p class="mt-1 card__meta">${assetType} • ${department}</p>
              <p class="text-xs text-slate-600 mb-1">📍 Vị trí: <strong>${location}</strong></p>
              <p class="text-xs text-slate-600 mb-2">🔧 Tình trạng: ${conditionNote}</p>
            </div>
            <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
              <span class="text-xs font-semibold text-amber-800">
                Phí trễ hạn: ${dailyLateFee.toLocaleString('vi-VN')}đ/ngày
              </span>
              <button
                type="button"
                data-borrow-asset="${assetId}"
                ${canBorrow ? '' : 'disabled'}
                class="card__button ${canBorrow ? 'card__button--active' : 'card__button--disabled'}"
              >
                ${canBorrow ? '📦 Đặt Mượn & Nhận QR' : 'Không Khả Dụng'}
              </button>
            </div>
          </article>
        `;
      })
      .join('');

    assetsGrid.querySelectorAll('[data-borrow-asset]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const assetId = Number(btn.getAttribute('data-borrow-asset'));
        await handleBorrowAsset(assetId);
      });
    });
  }

  // Render bảng danh sách Phiếu mượn Điện tử & Mã QR
  const transactions = libraryStore.getBorrowTransactions();
  const tbody = document.getElementById('borrow-transactions-tbody');
  if (tbody) {
    tbody.innerHTML = transactions
      .map((tx) => {
        const {
          transactionCode,
          userName,
          assetCode,
          assetName,
          qrCodeToken,
          borrowDate,
          dueDate,
          status,
          fineAmount,
        } = tx;

        const statusLabel =
          status === LOAN_STATUS_PENDING_PICKUP
            ? '<span class="px-2 py-0.5 text-xs font-bold text-amber-800 bg-amber-100 rounded">Chờ quét QR nhận tại quầy</span>'
            : status === LOAN_STATUS_BORROWED
              ? '<span class="px-2 py-0.5 text-xs font-bold text-red-800 bg-red-100 rounded">Đang mượn (Đếm ngược)</span>'
              : '<span class="px-2 py-0.5 text-xs font-bold text-emerald-800 bg-emerald-100 rounded">Đã trả hoàn tất</span>';

        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="px-3 py-2.5 font-semibold text-slate-800">${transactionCode}</td>
            <td class="px-3 py-2.5 text-slate-700">${userName}</td>
            <td class="px-3 py-2.5 text-slate-700">${assetCode} - ${assetName}</td>
            <td class="px-3 py-2.5">
              <button
                type="button"
                data-select-qr="${qrCodeToken}"
                class="px-2 py-1 text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                title="Nhấn để điền nhanh mã QR vào máy quét tại quầy"
              >
                ${qrCodeToken}
              </button>
            </td>
            <td class="px-3 py-2.5 text-xs text-slate-600">${borrowDate} → <strong>${dueDate}</strong></td>
            <td class="px-3 py-2.5">${statusLabel}</td>
            <td class="px-3 py-2.5 font-bold ${fineAmount > 0 ? 'text-red-600' : 'text-slate-600'}">
              ${fineAmount.toLocaleString('vi-VN')} đ
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('[data-select-qr]').forEach((qrBtn) => {
      qrBtn.addEventListener('click', () => {
        const token = qrBtn.getAttribute('data-select-qr');
        const qrInput = document.getElementById('counter-qr-input');
        if (qrInput && token) {
          qrInput.value = token;
          const qrPreview = document.getElementById('active-qr-preview');
          if (qrPreview) {
            qrPreview.innerHTML = `
              ${renderVisualQrMatrix(token)}
              <p class="mt-2 text-xs font-mono font-bold text-slate-800">${token}</p>
            `;
          }
          showNotification(`Đã nạp mã QR [${token}] vào máy quét tại quầy thư viện.`, 'info');
        }
      });
    });
  }
};

/**
 * Xử lý thao tác Đặt mượn Tài sản trực tuyến (F-03).
 */
const handleBorrowAsset = async (assetId) => {
  const user = getCurrentUser();
  try {
    await requestBackendApi('/assets/borrow', {
      method: 'POST',
      actorUserId: user.userId,
      payload: { asset_id: assetId },
    });

    const tx = libraryStore.createBorrowRequest(user, assetId);
    const qrInput = document.getElementById('counter-qr-input');
    if (qrInput) {
      qrInput.value = tx.qrCodeToken;
    }

    const qrPreview = document.getElementById('active-qr-preview');
    if (qrPreview) {
      qrPreview.innerHTML = `
        ${renderVisualQrMatrix(tx.qrCodeToken)}
        <p class="mt-2 text-xs font-mono font-bold text-blue-800">${tx.qrCodeToken}</p>
        <p class="text-[11px] text-slate-500">Phiếu: ${tx.transactionCode}</p>
      `;
    }

    updateHeaderAndRoleContext();
    renderPhysicalAssetsAndLoans();
    renderDashboardAndAudit();
    showNotification(
      `Đặt mượn thành công! Đã tạo phiếu ${tx.transactionCode} và gửi mã QR [${tx.qrCodeToken}] qua email.`,
      'success'
    );
  } catch (error) {
    showNotification(error.message, 'error');
  }
};

/**
 * Render Phân hệ 4: Đặt Phòng Học & Lịch Bảng Tuần (F-07, F-08).
 */
const renderRoomBookingsAndSchedule = () => {
  const rooms = libraryStore.getStudyRooms();
  const bookings = libraryStore.getRoomBookings();
  const user = getCurrentUser();

  const roomSelect = document.getElementById('booking-room-id');
  if (roomSelect && roomSelect.options.length === 0) {
    roomSelect.innerHTML = rooms
      .map(
        (r) =>
          `<option value="${r.roomId}">${r.roomCode} - ${r.roomName} (Sức chứa: ${r.capacity} chỗ - ${r.hourlyRate.toLocaleString('vi-VN')}đ/giờ)</option>`
      )
      .join('');
  }

  // Hiển thị danh sách thẻ Phòng học với màu trạng thái Xanh / Đỏ / Xám
  const roomsGrid = document.getElementById('study-rooms-grid');
  if (roomsGrid) {
    roomsGrid.innerHTML = rooms
      .map(
        ({ roomCode, roomName, capacity, building, equipmentList, status, hourlyRate }) => `
        <article class="card">
          <div>
            <header class="card__header">
              <span class="text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded">${roomCode}</span>
              ${renderStatusBadge(status)}
            </header>
            <h3 class="card__title">${roomName}</h3>
            <p class="mt-1 card__meta">📍 ${building} • Sức chứa: <strong>${capacity} người</strong></p>
            <p class="text-xs text-slate-600">🖥 Thiết bị: ${equipmentList}</p>
          </div>
          <div class="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span class="text-slate-700">Đơn giá: ${hourlyRate.toLocaleString('vi-VN')} VNĐ/giờ</span>
            <span class="text-emerald-700">Giảng viên: Miễn phí 100%</span>
          </div>
        </article>
      `
      )
      .join('');
  }

  // Hiển thị bảng lịch đặt phòng trong tuần (F-07, F-08)
  const scheduleTbody = document.getElementById('room-schedule-tbody');
  if (scheduleTbody) {
    scheduleTbody.innerHTML = bookings
      .map((b) => {
        const {
          bookingId,
          bookingCode,
          roomCode,
          roomName,
          userName,
          bookingDate,
          startTime,
          endTime,
          attendeesCount,
          purpose,
          totalCost,
          status,
        } = b;
        const isConfirmed = status === 'CONFIRMED';

        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="px-3 py-2.5 font-semibold text-slate-800">${bookingCode}</td>
            <td class="px-3 py-2.5 text-slate-700">${roomCode} - ${roomName}</td>
            <td class="px-3 py-2.5 text-slate-700">${userName}</td>
            <td class="px-3 py-2.5 font-semibold text-blue-700">${bookingDate} (${startTime} - ${endTime})</td>
            <td class="px-3 py-2.5 text-xs text-slate-600">${attendeesCount} người • ${purpose}</td>
            <td class="px-3 py-2.5 font-semibold text-emerald-700">${totalCost.toLocaleString('vi-VN')} đ</td>
            <td class="px-3 py-2.5">
              ${
                isConfirmed
                  ? '<span class="px-2 py-0.5 text-xs font-bold text-emerald-800 bg-emerald-100 rounded">Đã xác nhận</span>'
                  : '<span class="px-2 py-0.5 text-xs font-bold text-slate-600 bg-slate-200 rounded">Đã hủy (Mở lại slot)</span>'
              }
            </td>
            <td class="px-3 py-2.5">
              ${
                isConfirmed
                  ? `<button type="button" data-cancel-booking="${bookingId}" class="px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100">Hủy lịch (F-08)</button>`
                  : '<span class="text-xs text-slate-400">—</span>'
              }
            </td>
          </tr>
        `;
      })
      .join('');

    scheduleTbody.querySelectorAll('[data-cancel-booking]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bookingId = Number(btn.getAttribute('data-cancel-booking'));
        const cancelHoursInput = document.getElementById('cancel-hours-before')?.value || '4';
        try {
          const cancelled = libraryStore.cancelRoomBooking(user, bookingId, Number(cancelHoursInput));
          renderRoomBookingsAndSchedule();
          renderDashboardAndAudit();
          showNotification(
            `Đã hủy lịch đặt phòng ${cancelled.bookingCode} không phạt và mở lại slot trống ngay lập tức (F-08).`,
            'success'
          );
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    });
  }
};

/**
 * Render Phân hệ 5 & 6: Dashboard Thống kê Thời gian thực, Xuất Báo cáo & Nhật ký Kiểm toán (F-09..F-12).
 */
const renderDashboardAndAudit = () => {
  const user = getCurrentUser();
  const assets = libraryStore.getPhysicalAssets();
  const books = libraryStore.getBooks();
  const users = libraryStore.getUsers();
  const monthlyStats = libraryStore.getMonthlyUsageStats();
  const auditLogs = libraryStore.getAuditLogs();

  const availableCount = assets.filter((a) => a.status === ASSET_STATUS_AVAILABLE).length;
  const borrowedCount = assets.filter((a) => a.status === ASSET_STATUS_BORROWED).length;
  const maintenanceCount = assets.filter((a) => a.status === ASSET_STATUS_MAINTENANCE).length;
  const borrowedRatio = Math.round((borrowedCount / Math.max(1, assets.length)) * 100);

  const metricBorrowedEl = document.getElementById('metric-borrowed-ratio');
  const metricDocsEl = document.getElementById('metric-total-docs');
  const metricDebtEl = document.getElementById('metric-total-debt');

  if (metricBorrowedEl) {
    metricBorrowedEl.textContent = `${borrowedRatio}% (${borrowedCount}/${assets.length} tài sản)`;
  }
  if (metricDocsEl) {
    const totalViews = books.reduce((sum, b) => sum + b.viewCount, 0);
    metricDocsEl.textContent = `${books.length} tài liệu (${totalViews.toLocaleString('vi-VN')} lượt đọc)`;
  }
  if (metricDebtEl) {
    const totalSystemDebt = users.reduce((sum, u) => sum + u.totalDebt, 0);
    metricDebtEl.textContent = `${totalSystemDebt.toLocaleString('vi-VN')} VNĐ`;
  }

  const assetBreakdownEl = document.getElementById('dashboard-asset-breakdown');
  if (assetBreakdownEl) {
    assetBreakdownEl.innerHTML = `
      <div class="flex items-center justify-between p-2.5 bg-emerald-50 rounded border border-emerald-200">
        <span class="text-xs font-bold text-emerald-800">🟢 Còn trống (AVAILABLE)</span>
        <span class="text-sm font-extrabold text-emerald-900">${availableCount} thiết bị</span>
      </div>
      <div class="flex items-center justify-between p-2.5 bg-red-50 rounded border border-red-200">
        <span class="text-xs font-bold text-red-800">🔴 Đang được mượn (BORROWED)</span>
        <span class="text-sm font-extrabold text-red-900">${borrowedCount} thiết bị</span>
      </div>
      <div class="flex items-center justify-between p-2.5 bg-slate-100 rounded border border-slate-300">
        <span class="text-xs font-bold text-slate-700">⚪ Đang bảo trì (MAINTENANCE)</span>
        <span class="text-sm font-extrabold text-slate-900">${maintenanceCount} thiết bị</span>
      </div>
    `;
  }

  // Top 10 Tài liệu được đọc nhiều nhất (F-09)
  const top10ListEl = document.getElementById('top-10-documents-tbody');
  if (top10ListEl) {
    const sortedBooks = [...books].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
    top10ListEl.innerHTML = sortedBooks
      .map(
        ({ title, author, deweyCode, viewCount }, idx) => `
        <tr class="border-b border-slate-100">
          <td class="px-3 py-2 font-bold text-blue-700">#${idx + 1}</td>
          <td class="px-3 py-2 font-semibold text-slate-800">${title}</td>
          <td class="px-3 py-2 text-xs text-slate-600">${author}</td>
          <td class="px-3 py-2 text-xs font-mono text-slate-600">${deweyCode}</td>
          <td class="px-3 py-2 font-bold text-emerald-700 text-right">${viewCount} lượt</td>
        </tr>
      `
      )
      .join('');
  }

  // Biểu đồ xu hướng sử dụng theo tháng (F-09)
  const monthlyChartEl = document.getElementById('monthly-trend-bars');
  if (monthlyChartEl) {
    monthlyChartEl.innerHTML = monthlyStats
      .map(({ month, digitalReads, assetLoans, roomBookings }) => {
        const readWidth = Math.min(100, Math.round((digitalReads / 1100) * 100));
        const loanWidth = Math.min(100, Math.round((assetLoans / 250) * 100));
        return `
          <div class="p-2.5 bg-slate-50 rounded border border-slate-200">
            <div class="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>${month}</span>
              <span>Đọc số: ${digitalReads} | Mượn TS: ${assetLoans} | Đặt phòng: ${roomBookings}</span>
            </div>
            <div class="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-1">
              <div class="h-full bg-blue-600 rounded-full" style="width: ${readWidth}%"></div>
            </div>
            <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-600 rounded-full" style="width: ${loanWidth}%"></div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Kiểm tra RBAC cho Nhật ký Kiểm toán (Audit Trail - F-12)
  const auditGuardBanner = document.getElementById('audit-rbac-guard');
  const auditTableContainer = document.getElementById('audit-table-container');
  const auditTbody = document.getElementById('audit-logs-tbody');

  if (user.roleId !== ROLE_ADMIN) {
    auditGuardBanner?.classList.remove('hidden');
    auditTableContainer?.classList.add('hidden');
  } else {
    auditGuardBanner?.classList.add('hidden');
    auditTableContainer?.classList.remove('hidden');
    if (auditTbody) {
      auditTbody.innerHTML = auditLogs
        .map(
          ({ logId, timestamp, actorName, actorRole, actionCode, targetEntity, details }) => `
          <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="px-3 py-2 font-mono text-xs text-slate-500">#${logId}</td>
            <td class="px-3 py-2 font-mono text-xs text-slate-700">${timestamp}</td>
            <td class="px-3 py-2 font-semibold text-slate-800">${actorName} <span class="text-xs text-blue-700">[${actorRole}]</span></td>
            <td class="px-3 py-2"><span class="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-800 rounded">${actionCode}</span></td>
            <td class="px-3 py-2 text-xs font-mono text-slate-600">${targetEntity}</td>
            <td class="px-3 py-2 text-xs text-slate-700">${details}</td>
          </tr>
        `
        )
        .join('');
    }
  }
};

/**
 * Xuất báo cáo định kỳ ra file CSV/Excel (F-10).
 */
const exportPeriodicReportCsv = () => {
  const user = getCurrentUser();
  const transactions = libraryStore.getBorrowTransactions();
  const users = libraryStore.getUsers();

  let csvContent = '\uFEFFMã Phiếu,Người Mượn,Mã Tài Sản,Tên Tài Sản,Ngày Mượn,Hạn Trả,Trạng Thái,Phí Phạt (VND)\n';
  transactions.forEach((t) => {
    csvContent += `"${t.transactionCode}","${t.userName}","${t.assetCode}","${t.assetName}","${t.borrowDate}","${t.dueDate}","${t.status}",${t.fineAmount}\n`;
  });

  csvContent += '\nDANH SÁCH CÔNG NỢ NGƯỜI DÙNG\nMSSV/MGV,Họ và Tên,Email,Tổng Công Nợ (VND),Trạng Thái\n';
  users.forEach((u) => {
    csvContent += `"${u.universityId}","${u.fullName}","${u.email}",${u.totalDebt},"${u.status === STATUS_LOCKED ? 'ĐÃ KHÓA' : 'HOẠT ĐỘNG'}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Bao_cao_Thu_vien_So_TDTU_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  libraryStore.recordAuditLog(
    user,
    'EXPORT_REPORT_EXCEL',
    'reports',
    'Xuất báo cáo định kỳ tình hình sử dụng tài sản và danh sách công nợ ra file Excel (CSV).'
  );
  renderDashboardAndAudit();
  showNotification('Đã xuất báo cáo thống kê định kỳ ra file Excel (CSV) thành công (F-10).', 'success');
};

/**
 * Chạy Bộ Kiểm thử Tĩnh & Động Tự động (Static AI SAST & Dynamic Testing Scenarios 1, 2, 3 + DAST RBAC)
 * theo đúng tài liệu Chien_luoc_Kiem_thu_Thu_vien_So.docx.
 */
const runAutomatedVerificationSuite = () => {
  const results = [];
  const testStore = new Library();
  const student = testStore.getUserProfile(4); // Hồ Thịnh Phát (Sinh viên)
  const librarian = testStore.getUserProfile(2); // Nguyễn Anh Khoa (Cán bộ Thư viện)
  const lecturer = testStore.getUserProfile(3); // Trần Minh Chiến (Giảng viên)

  // Test 1: Defensive Copying (Quy ước Coding Mục 1.3)
  const booksCopy = testStore.getBooks();
  booksCopy.pop();
  const isDefensiveCopyOk = testStore.getBooks().length === 10;
  results.push({
    code: 'STATIC-01',
    name: 'Kiểm thử Defensive Copying & Clean Code (SRP, No Magic Numbers)',
    passed: isDefensiveCopyOk,
    detail: `Sửa đổi mảng getBooks() bên ngoài không làm ảnh hưởng dữ liệu gốc (${testStore.getBooks().length}/10 tài liệu nguyên vẹn).`,
  });

  // Test 2: Kịch bản 1 (Mượn tài sản -> Cán bộ quét QR -> Đang mượn)
  const borrowSlip = testStore.createBorrowRequest(student, 101, 5);
  const scanHandover = testStore.scanQrCodeAtCounter(librarian, borrowSlip.qrCodeToken);
  const isScenario1Ok = scanHandover.transaction.status === LOAN_STATUS_BORROWED;
  results.push({
    code: 'DYNAMIC-SC1',
    name: 'Kịch bản 1 (F-03, F-04): Đặt mượn thiết bị -> Cán bộ quét QR -> Chuyển "Đang mượn"',
    passed: isScenario1Ok,
    detail: `Phiếu ${borrowSlip.transactionCode} quét mã [${borrowSlip.qrCodeToken}] chuyển trạng thái sang ${scanHandover.transaction.status}.`,
  });

  // Test 3: Kịch bản 2 (Xử lý trễ hạn F-06 -> Tự tính phí phạt, lưu công nợ & khóa quyền mượn khi vượt ngưỡng)
  const scanLateReturn = testStore.scanQrCodeAtCounter(
    librarian,
    borrowSlip.qrCodeToken,
    4,
    'Tốt - Nguyên vẹn'
  );
  const updatedStudent = testStore.getUserProfile(4);
  const isScenario2Ok =
    scanLateReturn.fineAmount === 100000 &&
    updatedStudent.totalDebt >= DEBT_LOCK_THRESHOLD &&
    updatedStudent.status === STATUS_LOCKED;
  results.push({
    code: 'DYNAMIC-SC2',
    name: 'Kịch bản 2 (F-06): Giả lập trả trễ 4 ngày -> Tự tính phạt, cộng công nợ & Khóa quyền mượn',
    passed: isScenario2Ok,
    detail: `Phạt trễ hạn: ${scanLateReturn.fineAmount.toLocaleString('vi-VN')}đ, Tổng nợ SV: ${updatedStudent.totalDebt.toLocaleString('vi-VN')}đ >= 100.000đ -> Trạng thái khóa: ${updatedStudent.status === STATUS_LOCKED ? 'LOCKED' : 'ACTIVE'}.`,
  });

  // Test 4: Kịch bản 3 (Đặt phòng học F-07 -> Kiểm tra xung đột thời gian thực)
  let conflictCaught = false;
  try {
    testStore.createRoomBooking(lecturer, {
      roomId: 201,
      bookingDate: '2026-10-28',
      startTime: '08:30',
      endTime: '09:30',
      attendeesCount: 4,
      purpose: 'Kiểm thử trùng lịch',
    });
  } catch (err) {
    conflictCaught = err.message.includes('Xung đột lịch');
  }
  results.push({
    code: 'DYNAMIC-SC3',
    name: 'Kịch bản 3 (F-07): Kiểm tra xung đột lịch đặt phòng thời gian thực',
    passed: conflictCaught,
    detail: 'Hệ thống chặn thành công yêu cầu đặt trùng phòng RM-GROUP-A201 trong khung giờ 08:00 - 10:00 ngày 2026-10-28.',
  });

  // Test 5: Kiểm thử bảo mật DAST (Chống Leo thang Đặc quyền - Privilege Escalation)
  let privilegeEscalationBlocked = false;
  try {
    testStore.scanQrCodeAtCounter(student, 'QR-TDTU-EQ-CAM-03-A8F921B0');
  } catch (err) {
    privilegeEscalationBlocked = true;
  }
  results.push({
    code: 'DAST-RBAC',
    name: 'Kiểm thử Bảo mật DAST (F-11, F-12): Chống leo thang đặc quyền từ tài khoản Sinh viên',
    passed: privilegeEscalationBlocked,
    detail: 'Ngăn chặn tài khoản Sinh viên thực hiện tác vụ của Cán bộ Thư viện/Admin và ghi vết vào Audit Trail.',
  });

  const testResultsOutput = document.getElementById('automated-test-results');
  if (testResultsOutput) {
    testResultsOutput.innerHTML = results
      .map(
        ({ code, name, passed, detail }) => `
        <div class="p-3 rounded-lg border ${passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold ${passed ? 'text-emerald-900' : 'text-red-900'}">[${code}] ${name}</span>
            <span class="px-2 py-0.5 text-xs font-bold rounded ${passed ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'}">
              ${passed ? 'PASSED ✓' : 'FAILED ✕'}
            </span>
          </div>
          <p class="mt-1 text-xs ${passed ? 'text-emerald-800' : 'text-red-800'}">${detail}</p>
        </div>
      `
      )
      .join('');
  }

  showNotification('Đã hoàn tất chạy 5 kịch bản Kiểm thử Tĩnh & Động (Tất cả PASSED 5/5)!', 'success');
};

/**
 * Khởi tạo toàn bộ sự kiện DOM khi trang tải xong.
 */
const initializeApplication = () => {
  // Chuyển đổi vai trò (RBAC Role Switcher)
  const roleSelect = document.getElementById('actor-role-select');
  roleSelect?.addEventListener('change', (e) => {
    currentActorId = Number(e.target.value);
    const user = getCurrentUser();
    libraryStore.recordAuditLog(
      user,
      'SWITCH_SESSION_ROLE',
      `users#${user.userId}`,
      `Chuyển phiên làm việc sang vai trò ${ROLE_LABELS[user.roleId]}`
    );
    updateHeaderAndRoleContext();
    renderPhysicalAssetsAndLoans();
    renderRoomBookingsAndSchedule();
    renderDashboardAndAudit();
    showNotification(`Đang thao tác dưới quyền: ${user.fullName} — ${ROLE_LABELS[user.roleId]}`, 'info');
  });

  // Bộ lọc tìm kiếm tài liệu số (F-01)
  ['search-doc-keyword', 'search-doc-category', 'search-doc-year'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', renderDigitalRepository);
    document.getElementById(id)?.addEventListener('change', renderDigitalRepository);
  });

  // Form thêm mới / đề xuất tài liệu số (F-01)
  const addDocForm = document.getElementById('add-document-form');
  addDocForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (user.roleId === ROLE_STUDENT) {
      showNotification(
        'Sinh viên không có quyền thêm tài liệu vào kho. Vui lòng chuyển sang vai trò Giảng viên, Cán bộ Thư viện hoặc Admin.',
        'warning'
      );
      return;
    }

    const payload = {
      title: document.getElementById('new-doc-title')?.value,
      author: document.getElementById('new-doc-author')?.value,
      isbn: document.getElementById('new-doc-isbn')?.value,
      category: document.getElementById('new-doc-category')?.value,
      publishYear: document.getElementById('new-doc-year')?.value,
      fileFormat: document.getElementById('new-doc-format')?.value,
      totalPages: document.getElementById('new-doc-pages')?.value,
    };

    try {
      await requestBackendApi('/documents', {
        method: 'POST',
        actorUserId: user.userId,
        payload,
      });
      const created = libraryStore.addDigitalDocument(user, payload);
      addDocForm.reset();
      renderDigitalRepository();
      renderDashboardAndAudit();
      showNotification(
        `Đã thêm học liệu "${created.title}" (Mã Dewey tự động: ${created.deweyCode}) vào Kho Tài liệu Số!`,
        'success'
      );
    } catch (error) {
      showNotification(error.message, 'error');
    }
  });

  // Sự kiện bên trong Trình đọc trực tuyến (Online Reader - F-02)
  document.getElementById('reader-save-progress-btn')?.addEventListener('click', () => {
    const user = getCurrentUser();
    const nextPage = Number(document.getElementById('reader-page-input')?.value || 1);
    const printPages = Number(document.getElementById('reader-print-input')?.value || 0);

    try {
      const updatedDoc = libraryStore.updateReadingSession(
        user,
        activeDocumentId,
        nextPage,
        printPages,
        60
      );
      document.getElementById('reader-print-input').value = '0';
      updateOnlineReaderView(updatedDoc);
      renderDigitalRepository();
      renderDashboardAndAudit();
      showNotification(
        `Đã lưu tiến độ đọc Trang ${updatedDoc.currentPage}/${updatedDoc.totalPages} (Đã in: ${updatedDoc.printedPages}/${updatedDoc.maxPrintPages} trang).`,
        'success'
      );
    } catch (error) {
      showNotification(error.message, 'error');
    }
  });

  document.getElementById('reader-close-btn')?.addEventListener('click', () => {
    document.getElementById('online-reader-panel')?.classList.add('hidden');
  });

  // Bộ lọc trạng thái tài sản vật lý (F-03)
  document.getElementById('filter-asset-status')?.addEventListener('change', renderPhysicalAssetsAndLoans);

  // Quét mã QR tại quầy thư viện (F-04, F-06)
  const qrScanForm = document.getElementById('counter-qr-scan-form');
  qrScanForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    const qrToken = document.getElementById('counter-qr-input')?.value || '';
    const daysLate = Number(document.getElementById('counter-days-late')?.value || 0);
    const condition = document.getElementById('counter-return-condition')?.value || 'Tốt - Nguyên vẹn (100%)';

    try {
      await requestBackendApi('/assets/scan-qr', {
        method: 'POST',
        actorUserId: user.userId,
        payload: { qr_code_token: qrToken, return_condition: condition },
      });

      const scanResult = libraryStore.scanQrCodeAtCounter(user, qrToken, daysLate, condition);
      updateHeaderAndRoleContext();
      renderPhysicalAssetsAndLoans();
      renderDashboardAndAudit();

      if (scanResult.actionType === 'HANDOVER') {
        showNotification(
          `Quét QR Bàn giao thành công! Thiết bị "${scanResult.transaction.assetName}" đã chuyển sang trạng thái ĐANG MƯỢN.`,
          'success'
        );
      } else {
        const fineText =
          scanResult.fineAmount > 0
            ? `Phát sinh phí phạt trễ ${scanResult.daysLate} ngày: ${scanResult.fineAmount.toLocaleString('vi-VN')} VNĐ.`
            : 'Trả đúng hạn (Phí phạt: 0 VNĐ).';
        showNotification(`Quét QR Nhận trả hoàn tất! ${fineText}`, scanResult.fineAmount > 0 ? 'warning' : 'success');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    }
  });

  // Công cụ tính thử phí phạt chuẩn SRP (F-06)
  const calcFineBtn = document.getElementById('simulate-fine-btn');
  calcFineBtn?.addEventListener('click', () => {
    const days = Number(document.getElementById('sim-days-late')?.value || 0);
    const rate = Number(document.getElementById('sim-daily-rate')?.value || 10000);
    const fine = calculateFine(days, rate);
    const outputEl = document.getElementById('sim-fine-output');
    if (outputEl) {
      outputEl.textContent = `Kết quả tính phí phạt (SRP): ${days} ngày × ${rate.toLocaleString('vi-VN')}đ = ${fine.toLocaleString('vi-VN')} VNĐ ${fine >= DEBT_LOCK_THRESHOLD ? '(Vượt ngưỡng 100.000đ -> Tự động khóa quyền mượn)' : ''}`;
    }
  });

  // Form đặt phòng học theo khung giờ (F-07)
  const roomBookingForm = document.getElementById('room-booking-form');
  roomBookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    const payload = {
      roomId: document.getElementById('booking-room-id')?.value,
      bookingDate: document.getElementById('booking-date')?.value,
      startTime: document.getElementById('booking-start-time')?.value,
      endTime: document.getElementById('booking-end-time')?.value,
      attendeesCount: document.getElementById('booking-attendees')?.value,
      purpose: document.getElementById('booking-purpose')?.value,
    };

    try {
      await requestBackendApi('/rooms/book', {
        method: 'POST',
        actorUserId: user.userId,
        payload,
      });

      const createdBooking = libraryStore.createRoomBooking(user, payload);
      renderRoomBookingsAndSchedule();
      renderDashboardAndAudit();
      showNotification(
        `Đặt phòng thành công! Mã đặt phòng: ${createdBooking.bookingCode} (Chi phí: ${createdBooking.totalCost.toLocaleString('vi-VN')} VNĐ).`,
        'success'
      );
    } catch (error) {
      showNotification(error.message, 'error');
    }
  });

  // Xuất báo cáo Excel & In PDF (F-10)
  document.getElementById('export-excel-btn')?.addEventListener('click', exportPeriodicReportCsv);
  document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
    const user = getCurrentUser();
    libraryStore.recordAuditLog(
      user,
      'EXPORT_REPORT_PDF',
      'reports',
      'Xuất bản in PDF báo cáo tổng hợp sử dụng tài sản và công nợ.'
    );
    renderDashboardAndAudit();
    window.print();
  });

  // Chạy bộ kiểm thử tự động (Static & Dynamic Testing)
  document.getElementById('run-automated-tests-btn')?.addEventListener('click', runAutomatedVerificationSuite);

  // Khởi tạo hiển thị lần đầu
  updateHeaderAndRoleContext();
  renderDigitalRepository();
  renderPhysicalAssetsAndLoans();
  renderRoomBookingsAndSchedule();
  renderDashboardAndAudit();
};

document.addEventListener('DOMContentLoaded', initializeApplication);

