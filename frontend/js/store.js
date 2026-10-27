/**
 * Kho lưu trữ dữ liệu & Nghiệp vụ lõi trên Frontend (DigitalLibraryStore).
 * Tuân thủ 3 nguyên lý Clean Code cốt lõi trong Quy ước Viết mã:
 * 1. Single Responsibility Principle (SRP)
 * 2. No Magic Numbers (Dùng hằng số từ constants.js)
 * 3. Defensive Copying (Luôn trả về bản sao [...array] và {...object})
 */

import {
  ASSET_STATUS_AVAILABLE,
  ASSET_STATUS_BORROWED,
  ASSET_STATUS_MAINTENANCE,
  BOOKING_STATUS_CANCELLED,
  BOOKING_STATUS_CONFIRMED,
  DEBT_LOCK_THRESHOLD,
  DEFAULT_LATE_FEE,
  DEFAULT_ROOM_HOURLY_RATE,
  DEWEY_CLASSIFICATION_MAP,
  EQUIPMENT_LATE_FEE,
  LOAN_STATUS_BORROWED,
  LOAN_STATUS_PENDING_PICKUP,
  LOAN_STATUS_RETURNED,
  MAX_BORROW_DAYS,
  MAX_PRINT_PAGES_DEFAULT,
  MILLISECONDS_PER_DAY,
  MILLISECONDS_PER_HOUR,
  MIN_CANCEL_HOURS_BEFORE,
  REMINDER_DAYS_FINAL,
  REMINDER_DAYS_FIRST,
  ROLE_ADMIN,
  ROLE_LECTURER,
  ROLE_LIBRARIAN,
  ROLE_STUDENT,
  STATUS_ACTIVE,
  STATUS_LOCKED,
} from './constants.js';

/**
 * Tính số tiền phạt dựa trên số ngày trễ và đơn giá phạt (Chuẩn SRP: chỉ tính toán, không làm I/O).
 *
 * @param {number} daysLate Số ngày trả trễ
 * @param {number} dailyRate Đơn giá phạt mỗi ngày
 * @returns {number} Số tiền phạt (VND)
 */
export const calculateFine = (daysLate, dailyRate = DEFAULT_LATE_FEE) => {
  if (daysLate <= 0 || dailyRate <= 0) {
    return 0;
  }
  return daysLate * dailyRate;
};

/**
 * Tạo nội dung thông báo phạt cho người dùng (Tách biệt khỏi calculateFine theo chuẩn SRP).
 *
 * @param {string} userName Họ tên người mượn
 * @param {number} fineAmount Số tiền bị phạt
 * @param {number} daysLate Số ngày trả trễ
 * @returns {string} Nội dung thông báo
 */
export const formatFineNotificationMessage = (userName, fineAmount, daysLate) => {
  const formattedAmount = fineAmount.toLocaleString('vi-VN');
  return `Thông báo tới ${userName}: Bạn bị phạt ${formattedAmount} VND do trả tài sản trễ ${daysLate} ngày.`;
};

/**
 * Lớp quản lý kho dữ liệu Thư viện Số & Tài sản Đại học.
 * Áp dụng nghiêm ngặt nguyên lý Defensive Copying khi trả về bất kỳ danh sách/đối tượng nào.
 */
export class Library {
  constructor() {
    this.users = [
      {
        userId: 1,
        universityId: '52400175',
        fullName: 'Lý Hạo Danh',
        email: '52400175@student.tdtu.edu.vn',
        roleId: ROLE_ADMIN,
        department: 'Ban Quản lý Hệ thống CNTT',
        status: STATUS_ACTIVE,
        totalDebt: 0,
      },
      {
        userId: 2,
        universityId: '52400051',
        fullName: 'Nguyễn Anh Khoa',
        email: '52400051@student.tdtu.edu.vn',
        roleId: ROLE_LIBRARIAN,
        department: 'Phòng Thư viện Trung tâm TDTU',
        status: STATUS_ACTIVE,
        totalDebt: 0,
      },
      {
        userId: 3,
        universityId: '52400103',
        fullName: 'TS. Trần Minh Chiến',
        email: '52400103@lecturer.tdtu.edu.vn',
        roleId: ROLE_LECTURER,
        department: 'Khoa Công nghệ Thông tin',
        status: STATUS_ACTIVE,
        totalDebt: 0,
      },
      {
        userId: 4,
        universityId: '51900821',
        fullName: 'Hồ Thịnh Phát',
        email: '51900821@student.tdtu.edu.vn',
        roleId: ROLE_STUDENT,
        department: 'Khoa Công nghệ Thông tin',
        status: STATUS_ACTIVE,
        totalDebt: 20000,
      },
    ];

    this.books = [
      {
        documentId: 1,
        isbn: '978-0132350884',
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        category: 'Lập trình & Kỹ thuật Phần mềm',
        deweyCode: '005.1',
        publishYear: 2021,
        fileFormat: 'PDF',
        totalPages: 464,
        maxPrintPages: 15,
        printedPages: 3,
        currentPage: 120,
        readingSeconds: 5420,
        viewCount: 342,
        summary: 'Giáo trình kinh điển về nguyên lý Clean Code, SRP, đặt tên định danh rõ nghĩa và phòng vệ tham chiếu.',
      },
      {
        documentId: 2,
        isbn: '978-0135974445',
        title: 'Software Engineering (10th Edition) - Ian Sommerville',
        author: 'Ian Sommerville',
        category: 'Lập trình & Kỹ thuật Phần mềm',
        deweyCode: '005.1',
        publishYear: 2022,
        fileFormat: 'PDF',
        totalPages: 810,
        maxPrintPages: 20,
        printedPages: 5,
        currentPage: 215,
        readingSeconds: 7890,
        viewCount: 289,
        summary: 'Tài liệu nền tảng về quy trình phát triển phần mềm, phân tích yêu cầu, kiến trúc phân tầng và kiểm thử.',
      },
      {
        documentId: 3,
        isbn: '978-1492052203',
        title: 'Fundamentals of Software Architecture',
        author: 'Mark Richards & Neal Ford',
        category: 'CNTT & Khoa học Máy tính',
        deweyCode: '004.6',
        publishYear: 2023,
        fileFormat: 'EPUB',
        totalPages: 432,
        maxPrintPages: 15,
        printedPages: 0,
        currentPage: 45,
        readingSeconds: 2100,
        viewCount: 256,
        summary: 'Phân tích chuyên sâu về kiến trúc phân tầng, microservices, bảo mật RBAC và đánh đổi kiến trúc.',
      },
      {
        documentId: 4,
        isbn: '978-0262035613',
        title: 'Deep Learning & Transformer Architectures in NLP',
        author: 'Ian Goodfellow, Yoshua Bengio',
        category: 'Trí tuệ Nhân tạo & Dữ liệu',
        deweyCode: '006.3',
        publishYear: 2024,
        fileFormat: 'PDF',
        totalPages: 775,
        maxPrintPages: 15,
        printedPages: 2,
        currentPage: 88,
        readingSeconds: 4320,
        viewCount: 231,
        summary: 'Tài liệu chuyên khảo về mạng nơ-ron hồi quy (RNN, LSTM), cơ chế Attention và mô hình ngôn ngữ lớn.',
      },
      {
        documentId: 5,
        isbn: '978-1098125974',
        title: 'Web Application Security: SAST, DAST & Zero Trust',
        author: 'Andrew Hoffman',
        category: 'CNTT & Khoa học Máy tính',
        deweyCode: '004.6',
        publishYear: 2024,
        fileFormat: 'PDF',
        totalPages: 390,
        maxPrintPages: 15,
        printedPages: 4,
        currentPage: 160,
        readingSeconds: 3650,
        viewCount: 198,
        summary: 'Hướng dẫn phòng chống SQL Injection, XSS, CSRF và áp dụng AI SAST/DAST trong kiểm thử bảo mật.',
      },
      {
        documentId: 6,
        isbn: '978-0134685991',
        title: 'Effective Java & Object-Oriented Design Patterns',
        author: 'Joshua Bloch',
        category: 'Lập trình & Kỹ thuật Phần mềm',
        deweyCode: '005.1',
        publishYear: 2020,
        fileFormat: 'PDF',
        totalPages: 416,
        maxPrintPages: 15,
        printedPages: 0,
        currentPage: 30,
        readingSeconds: 1800,
        viewCount: 175,
        summary: '90 quy tắc thực hành tốt nhất về thiết kế hướng đối tượng, Defensive Copying và quản lý bộ nhớ.',
      },
      {
        documentId: 7,
        isbn: '978-1119800361',
        title: 'Project Management Body of Knowledge (PMBOK Guide 7th)',
        author: 'Project Management Institute',
        category: 'Kinh tế & Quản trị Dự án',
        deweyCode: '658.4',
        publishYear: 2023,
        fileFormat: 'PDF',
        totalPages: 370,
        maxPrintPages: 15,
        printedPages: 1,
        currentPage: 55,
        readingSeconds: 1950,
        viewCount: 162,
        summary: 'Chuẩn mực quản lý dự án CNTT hiện đại theo mô hình Agile/Scrum và quản trị rủi ro.',
      },
      {
        documentId: 8,
        isbn: '978-0321125217',
        title: 'Domain-Driven Design: Tackling Complexity in Software',
        author: 'Eric Evans',
        category: 'Lập trình & Kỹ thuật Phần mềm',
        deweyCode: '005.1',
        publishYear: 2021,
        fileFormat: 'PDF',
        totalPages: 560,
        maxPrintPages: 15,
        printedPages: 0,
        currentPage: 15,
        readingSeconds: 1200,
        viewCount: 149,
        summary: 'Phương pháp thiết kế hướng miền nghiệp vụ cho các hệ thống thông tin đại học và doanh nghiệp.',
      },
      {
        documentId: 9,
        isbn: '978-1491950357',
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        category: 'Trí tuệ Nhân tạo & Dữ liệu',
        deweyCode: '006.3',
        publishYear: 2022,
        fileFormat: 'PDF',
        totalPages: 616,
        maxPrintPages: 15,
        printedPages: 0,
        currentPage: 92,
        readingSeconds: 2900,
        viewCount: 141,
        summary: 'Toàn vẹn dữ liệu, khóa ngoại, kiểm soát đồng thời (Concurrency Control) tránh đặt trùng tài sản.',
      },
      {
        documentId: 10,
        isbn: '978-0262046305',
        title: 'Introduction to Algorithms (CLRS 4th Edition)',
        author: 'Thomas H. Cormen et al.',
        category: 'Toán học & Thống kê',
        deweyCode: '510.1',
        publishYear: 2023,
        fileFormat: 'PDF',
        totalPages: 1312,
        maxPrintPages: 20,
        printedPages: 6,
        currentPage: 310,
        readingSeconds: 6100,
        viewCount: 134,
        summary: 'Giáo trình cấu trúc dữ liệu và giải thuật chuẩn quốc tế dùng cho sinh viên Khoa CNTT.',
      },
    ];

    this.physicalAssets = [
      {
        assetId: 101,
        assetCode: 'EQ-IPAD-01',
        assetName: 'Máy tính bảng iPad Pro M2 12.9" + Apple Pencil',
        assetType: 'Thiết bị số',
        department: 'Bộ phận Quản lý Tài sản',
        location: 'Tầng 2 - Quầy Thiết bị Số (Khu A)',
        status: ASSET_STATUS_AVAILABLE,
        conditionNote: 'Tốt - Pin 98%, kèm bút cảm ứng',
        dailyLateFee: EQUIPMENT_LATE_FEE,
      },
      {
        assetId: 102,
        assetCode: 'EQ-PROJ-02',
        assetName: 'Máy chiếu Laser Epson EB-L200F FullHD Wireless',
        assetType: 'Thiết bị trình chiếu',
        department: 'Bộ phận Quản lý Tài sản',
        location: 'Tầng 1 - Quầy Mượn Thiết bị (Khu B)',
        status: ASSET_STATUS_AVAILABLE,
        conditionNote: 'Tốt - Kèm cáp HDMI & điều khiển từ xa',
        dailyLateFee: EQUIPMENT_LATE_FEE,
      },
      {
        assetId: 103,
        assetCode: 'EQ-CAM-03',
        assetName: 'Máy ảnh Sony Alpha A6400 + Gimbal chống rung RS3',
        assetType: 'Thiết bị truyền thông',
        department: 'Bộ phận Quản lý Tài sản',
        location: 'Tầng 2 - Phòng Studio Đa phương tiện',
        status: ASSET_STATUS_BORROWED,
        conditionNote: 'Đang cho mượn phục vụ quay đồ án môn học',
        dailyLateFee: EQUIPMENT_LATE_FEE,
      },
      {
        assetId: 104,
        assetCode: 'LAB-IOT-04',
        assetName: 'Bộ Kit Thực hành IoT Raspberry Pi 5 & Cảm biến Công nghiệp',
        assetType: 'Dụng cụ thí nghiệm',
        department: 'Phòng Quản lý Cơ sở vật chất & Lab',
        location: 'Tầng 4 - Phòng Lab Nhúng & IoT (C402)',
        status: ASSET_STATUS_AVAILABLE,
        conditionNote: 'Đầy đủ 24 module cảm biến & nguồn 5V',
        dailyLateFee: DEFAULT_LATE_FEE,
      },
      {
        assetId: 105,
        assetCode: 'BK-PRINT-05',
        assetName: 'Sách in: Phân tích & Thiết kế Hệ thống Thông tin Hiện đại',
        assetType: 'Sách in (Bản cứng)',
        department: 'Phòng Thư viện',
        location: 'Tầng 3 - Kệ CNTT-A12',
        status: ASSET_STATUS_AVAILABLE,
        conditionNote: 'Bìa cứng nguyên vẹn (100%)',
        dailyLateFee: DEFAULT_LATE_FEE,
      },
      {
        assetId: 106,
        assetCode: 'LAB-VR-06',
        assetName: 'Kính thực tế ảo Meta Quest 3 128GB (Phòng Lab AI/VR)',
        assetType: 'Dụng cụ thí nghiệm',
        department: 'Bộ phận Quản lý Tài sản',
        location: 'Tầng 5 - Trung tâm Sáng tạo Số',
        status: ASSET_STATUS_MAINTENANCE,
        conditionNote: 'Đang bảo trì định kỳ cảm biến tay cầm phải',
        dailyLateFee: EQUIPMENT_LATE_FEE,
      },
    ];

    this.borrowTransactions = [
      {
        transactionId: 501,
        transactionCode: 'LOAN-20261021-4-103',
        userId: 4,
        userName: 'Hồ Thịnh Phát (51900821)',
        assetId: 103,
        assetCode: 'EQ-CAM-03',
        assetName: 'Máy ảnh Sony Alpha A6400 + Gimbal chống rung RS3',
        qrCodeToken: 'QR-TDTU-EQ-CAM-03-A8F921B0',
        borrowDate: '2026-10-21 09:00',
        dueDate: '2026-10-28 09:00',
        receivedAt: '2026-10-21 09:30',
        returnedAt: null,
        status: LOAN_STATUS_BORROWED,
        returnCondition: null,
        fineAmount: 0,
        dailyLateFee: EQUIPMENT_LATE_FEE,
      },
      {
        transactionId: 502,
        transactionCode: 'LOAN-20261023-3-105',
        userId: 3,
        userName: 'TS. Trần Minh Chiến (52400103)',
        assetId: 105,
        assetCode: 'BK-PRINT-05',
        assetName: 'Sách in: Phân tích & Thiết kế Hệ thống Thông tin Hiện đại',
        qrCodeToken: 'QR-TDTU-BK-PRINT-05-C77E1209',
        borrowDate: '2026-10-23 14:00',
        dueDate: '2026-10-30 14:00',
        receivedAt: '2026-10-23 14:20',
        returnedAt: null,
        status: LOAN_STATUS_BORROWED,
        returnCondition: null,
        fineAmount: 0,
        dailyLateFee: DEFAULT_LATE_FEE,
      },
    ];

    this.studyRooms = [
      {
        roomId: 201,
        roomCode: 'RM-GROUP-A201',
        roomName: 'Phòng Học Nhóm Sáng Tạo A201',
        capacity: 8,
        building: 'Tòa nhà Thư viện Inspire - Tầng 2',
        equipmentList: 'Màn hình tương tác 65", Bảng kính, Wifi 6',
        status: ASSET_STATUS_AVAILABLE,
        hourlyRate: DEFAULT_ROOM_HOURLY_RATE,
      },
      {
        roomId: 202,
        roomCode: 'RM-CONF-B305',
        roomName: 'Phòng Thảo Luận & Seminar B305',
        capacity: 16,
        building: 'Tòa nhà Thư viện Inspire - Tầng 3',
        equipmentList: 'Máy chiếu Laser, Hệ thống âm thanh hội nghị, Webcam 4K',
        status: ASSET_STATUS_AVAILABLE,
        hourlyRate: 30000,
      },
      {
        roomId: 203,
        roomCode: 'RM-LAB-C401',
        roomName: 'Phòng Thực Hành Đồ Án CNTT C401',
        capacity: 24,
        building: 'Khu Công nghệ Cao - Tầng 4',
        equipmentList: '12 Máy trạm GPU, Bảng thông minh, Cổng mạng LAN 10Gbps',
        status: ASSET_STATUS_AVAILABLE,
        hourlyRate: 40000,
      },
      {
        roomId: 204,
        roomCode: 'RM-STUDIO-D102',
        roomName: 'Phòng Studio Quay Dựng Học Liệu Số D102',
        capacity: 6,
        building: 'Tòa nhà Thư viện Inspire - Tầng 1',
        equipmentList: 'Phông xanh, Đèn Softbox, Micro thu âm chuyên dụng',
        status: ASSET_STATUS_MAINTENANCE,
        hourlyRate: 50000,
      },
    ];

    this.roomBookings = [
      {
        bookingId: 701,
        bookingCode: 'ROOM-20261028-201-4',
        roomId: 201,
        roomCode: 'RM-GROUP-A201',
        roomName: 'Phòng Học Nhóm Sáng Tạo A201',
        userId: 4,
        userName: 'Hồ Thịnh Phát (51900821)',
        bookingDate: '2026-10-28',
        startTime: '08:00',
        endTime: '10:00',
        attendeesCount: 5,
        purpose: 'Họp nhóm Làng Xi Mi hoàn thiện Đồ án Thư viện Số',
        totalCost: 40000,
        status: BOOKING_STATUS_CONFIRMED,
      },
      {
        bookingId: 702,
        bookingCode: 'ROOM-20261028-202-3',
        roomId: 202,
        roomCode: 'RM-CONF-B305',
        roomName: 'Phòng Thảo Luận & Seminar B305',
        userId: 3,
        userName: 'TS. Trần Minh Chiến (52400103)',
        bookingDate: '2026-10-28',
        startTime: '13:00',
        endTime: '15:00',
        attendeesCount: 12,
        purpose: 'Hướng dẫn nghiên cứu khoa học sinh viên CNTT',
        totalCost: 0,
        status: BOOKING_STATUS_CONFIRMED,
      },
    ];

    this.notifications = [
      {
        notificationId: 901,
        userId: 4,
        title: 'Nhắc hạn trả tài sản (Còn 1 ngày)',
        message: 'Thiết bị "Máy ảnh Sony Alpha A6400 + Gimbal RS3" (Mã phiếu: LOAN-20261021-4-103) sẽ đến hạn vào 2026-10-28 09:00.',
        type: 'REMINDER_1_DAY',
        createdAt: '2026-10-27 08:00:00',
      },
      {
        notificationId: 902,
        userId: 3,
        title: 'Nhắc hạn trả tài sản (Còn 3 ngày)',
        message: 'Tài sản "Sách in: Phân tích & Thiết kế HTTT Hiện đại" (Mã phiếu: LOAN-20261023-3-105) sẽ đến hạn vào 2026-10-30 14:00.',
        type: 'REMINDER_3_DAYS',
        createdAt: '2026-10-27 08:05:00',
      },
    ];

    this.auditLogs = [
      {
        logId: 1001,
        timestamp: '2026-10-27 08:00:12',
        actorName: 'Hệ thống Tự động (Cron)',
        actorRole: 'SYSTEM',
        actionCode: 'AUTO_REMINDER_DISPATCH',
        targetEntity: 'borrow_transactions',
        details: 'Quét định kỳ F-05: Đã gửi 2 thông báo nhắc hạn trả (mốc còn 3 ngày và còn 1 ngày).',
      },
      {
        logId: 1002,
        timestamp: '2026-10-27 09:15:40',
        actorName: 'Nguyễn Anh Khoa (52400051)',
        actorRole: 'LIBRARIAN',
        actionCode: 'QR_SCAN_HANDOVER',
        targetEntity: 'borrow_transactions#501',
        details: 'Quét mã QR [QR-TDTU-EQ-CAM-03-A8F921B0] bàn giao Máy ảnh Sony A6400 cho SV Hồ Thịnh Phát.',
      },
      {
        logId: 1003,
        timestamp: '2026-10-27 09:42:18',
        actorName: 'TS. Trần Minh Chiến (52400103)',
        actorRole: 'LECTURER',
        actionCode: 'BOOK_STUDY_ROOM',
        targetEntity: 'room_bookings#702',
        details: 'Đặt phòng RM-CONF-B305 ngày 2026-10-28 (13:00-15:00). Miễn phí 100% theo chính sách Giảng viên.',
      },
      {
        logId: 1004,
        timestamp: '2026-10-27 10:05:00',
        actorName: 'Lý Hạo Danh (52400175)',
        actorRole: 'ADMIN',
        actionCode: 'SECURITY_POLICY_CHECK',
        targetEntity: 'system_config',
        details: 'Kiểm tra cấu hình ngưỡng khóa công nợ (100.000 VNĐ) và mã hóa mật khẩu chuẩn bcrypt.',
      },
    ];

    this.monthlyUsageStats = [
      { month: 'Tháng 05', digitalReads: 420, assetLoans: 85, roomBookings: 64 },
      { month: 'Tháng 06', digitalReads: 510, assetLoans: 92, roomBookings: 78 },
      { month: 'Tháng 07', digitalReads: 390, assetLoans: 60, roomBookings: 45 },
      { month: 'Tháng 08', digitalReads: 680, assetLoans: 134, roomBookings: 112 },
      { month: 'Tháng 09', digitalReads: 890, assetLoans: 178, roomBookings: 156 },
      { month: 'Tháng 10', digitalReads: 1045, assetLoans: 215, roomBookings: 189 },
    ];
  }

  /**
   * Trả về bản sao danh sách tài liệu số (Defensive Copying theo Mục 1.3 Quy ước Coding).
   *
   * @returns {Array<Object>}
   */
  getBooks() {
    return [...this.books.map((book) => ({ ...book }))];
  }

  /**
   * Trả về bản sao danh sách người dùng.
   *
   * @returns {Array<Object>}
   */
  getUsers() {
    return [...this.users.map((user) => ({ ...user }))];
  }

  /**
   * Trả về bản sao thông tin một người dùng theo ID.
   *
   * @param {number} userId
   * @returns {Object|null}
   */
  getUserProfile(userId) {
    const found = this.users.find((u) => u.userId === Number(userId));
    return found ? { ...found } : null;
  }

  /**
   * Trả về bản sao danh sách tài sản vật lý.
   *
   * @returns {Array<Object>}
   */
  getPhysicalAssets() {
    return [...this.physicalAssets.map((asset) => ({ ...asset }))];
  }

  /**
   * Trả về bản sao danh sách giao dịch mượn trả.
   *
   * @returns {Array<Object>}
   */
  getBorrowTransactions() {
    return [...this.borrowTransactions.map((tx) => ({ ...tx }))];
  }

  /**
   * Trả về bản sao danh sách phòng học.
   *
   * @returns {Array<Object>}
   */
  getStudyRooms() {
    return [...this.studyRooms.map((room) => ({ ...room }))];
  }

  /**
   * Trả về bản sao danh sách lịch đặt phòng.
   *
   * @returns {Array<Object>}
   */
  getRoomBookings() {
    return [...this.roomBookings.map((booking) => ({ ...booking }))];
  }

  /**
   * Trả về bản sao danh sách thông báo.
   *
   * @returns {Array<Object>}
   */
  getNotifications() {
    return [...this.notifications.map((n) => ({ ...n }))];
  }

  /**
   * Trả về bản sao danh sách Nhật ký Kiểm toán (Audit Trail - F-12).
   *
   * @returns {Array<Object>}
   */
  getAuditLogs() {
    return [...this.auditLogs.map((log) => ({ ...log }))];
  }

  /**
   * Trả về bản sao dữ liệu xu hướng sử dụng theo tháng (F-09).
   *
   * @returns {Array<Object>}
   */
  getMonthlyUsageStats() {
    return [...this.monthlyUsageStats.map((stat) => ({ ...stat }))];
  }

  /**
   * Ghi nhận một dòng nhật ký lưu vết mới vào Audit Trail (F-12).
   */
  recordAuditLog(actorUser, actionCode, targetEntity, details) {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      logId: this.auditLogs.length + 1001,
      timestamp: nowStr,
      actorName: `${actorUser.fullName} (${actorUser.universityId})`,
      actorRole: actorUser.roleId === ROLE_ADMIN
        ? 'ADMIN'
        : actorUser.roleId === ROLE_LIBRARIAN
          ? 'LIBRARIAN'
          : actorUser.roleId === ROLE_LECTURER
            ? 'LECTURER'
            : 'STUDENT',
      actionCode,
      targetEntity,
      details,
    };
    this.auditLogs = [newLog, ...this.auditLogs];
    return { ...newLog };
  }

  /**
   * Thêm mới tài liệu số có kiểm tra trùng ISBN và tự động phân loại Dewey (F-01).
   */
  addDigitalDocument(actorUser, payload) {
    const { isbn, title, author, category, publishYear, fileFormat, totalPages } = payload;
    const cleanIsbn = String(isbn || '').trim();
    const cleanTitle = String(title || '').trim();
    const cleanAuthor = String(author || '').trim();

    if (!cleanIsbn || !cleanTitle || !cleanAuthor) {
      throw new Error('Vui lòng nhập đầy đủ Tên tài liệu, Tác giả và Mã ISBN.');
    }

    const isDuplicateIsbn = this.books.some(
      (b) => b.isbn.toLowerCase() === cleanIsbn.toLowerCase()
    );
    if (isDuplicateIsbn) {
      throw new Error(`Mã ISBN "${cleanIsbn}" đã tồn tại trong hệ thống (Vi phạm kiểm tra trùng F-01).`);
    }

    const deweyCode = DEWEY_CLASSIFICATION_MAP[category] || '000.0';
    const newDoc = {
      documentId: this.books.length + 1,
      isbn: cleanIsbn,
      title: cleanTitle,
      author: cleanAuthor,
      category: category || 'CNTT & Khoa học Máy tính',
      deweyCode,
      publishYear: Number(publishYear) || 2026,
      fileFormat: fileFormat || 'PDF',
      totalPages: Math.max(10, Number(totalPages) || 120),
      maxPrintPages: MAX_PRINT_PAGES_DEFAULT,
      printedPages: 0,
      currentPage: 1,
      readingSeconds: 0,
      viewCount: 1,
      summary: `Học liệu số chuyên ngành ${category}, phân loại tự động theo khung Dewey ${deweyCode}.`,
    };

    this.books = [newDoc, ...this.books];
    this.recordAuditLog(
      actorUser,
      'CREATE_DIGITAL_DOCUMENT',
      `digital_documents#${newDoc.documentId}`,
      `Thêm học liệu số "${cleanTitle}" (ISBN: ${cleanIsbn}, Dewey: ${deweyCode})`
    );

    return { ...newDoc };
  }

  /**
   * Cập nhật tiến độ đọc trực tuyến và kiểm tra giới hạn trang in (F-02).
   */
  updateReadingSession(actorUser, documentId, nextPage, printPagesRequested = 0, addedSeconds = 45) {
    const docIndex = this.books.findIndex((b) => b.documentId === Number(documentId));
    if (docIndex === -1) {
      throw new Error('Không tìm thấy tài liệu số.');
    }

    const doc = { ...this.books[docIndex] };
    const requestedPrint = Math.max(0, Number(printPagesRequested));

    if (doc.printedPages + requestedPrint > doc.maxPrintPages) {
      throw new Error(
        `Vượt giới hạn bản quyền in ấn! Bạn chỉ được in tối đa ${doc.maxPrintPages} trang (Đã in: ${doc.printedPages} trang).`
      );
    }

    doc.currentPage = Math.max(1, Math.min(Number(nextPage), doc.totalPages));
    doc.printedPages += requestedPrint;
    doc.readingSeconds += Math.max(0, Number(addedSeconds));
    doc.viewCount += requestedPrint === 0 ? 1 : 0;

    this.books[docIndex] = doc;

    if (requestedPrint > 0) {
      this.recordAuditLog(
        actorUser,
        'ONLINE_READER_PRINT',
        `digital_documents#${doc.documentId}`,
        `In ${requestedPrint} trang từ học liệu "${doc.title}" (Tổng đã in: ${doc.printedPages}/${doc.maxPrintPages} trang)`
      );
    }

    return { ...doc };
  }

  /**
   * Đặt mượn tài sản vật lý trực tuyến, sinh phiếu mượn điện tử và mã QR (F-03).
   */
  createBorrowRequest(actorUser, assetId, borrowDays = MAX_BORROW_DAYS) {
    const user = this.users.find((u) => u.userId === actorUser.userId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng.');
    }

    if (user.status === STATUS_LOCKED || user.totalDebt >= DEBT_LOCK_THRESHOLD) {
      throw new Error(
        `Tài khoản của bạn đang bị khóa quyền mượn do tổng công nợ (${user.totalDebt.toLocaleString('vi-VN')} VNĐ) vượt ngưỡng ${DEBT_LOCK_THRESHOLD.toLocaleString('vi-VN')} VNĐ.`
      );
    }

    const assetIndex = this.physicalAssets.findIndex((a) => a.assetId === Number(assetId));
    if (assetIndex === -1) {
      throw new Error('Không tìm thấy thiết bị/tài sản.');
    }

    const asset = { ...this.physicalAssets[assetIndex] };
    if (asset.status !== ASSET_STATUS_AVAILABLE) {
      throw new Error(
        `Tài sản "${asset.assetName}" hiện không còn trống (Trạng thái: ${asset.status}).`
      );
    }

    const safeDays = Math.min(Math.max(1, Number(borrowDays) || MAX_BORROW_DAYS), MAX_BORROW_DAYS);
    const now = new Date();
    const due = new Date(now.getTime() + safeDays * MILLISECONDS_PER_DAY);
    const formatDateTime = (d) => d.toISOString().replace('T', ' ').substring(0, 16);

    const randomSuffix = Math.random().toString(16).substring(2, 8).toUpperCase();
    const qrCodeToken = `QR-TDTU-${asset.assetCode}-${randomSuffix}`;
    const transactionCode = `LOAN-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${user.userId}-${asset.assetId}`;

    const newTransaction = {
      transactionId: this.borrowTransactions.length + 501,
      transactionCode,
      userId: user.userId,
      userName: `${user.fullName} (${user.universityId})`,
      assetId: asset.assetId,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      qrCodeToken,
      borrowDate: formatDateTime(now),
      dueDate: formatDateTime(due),
      receivedAt: null,
      returnedAt: null,
      status: LOAN_STATUS_PENDING_PICKUP,
      returnCondition: null,
      fineAmount: 0,
      dailyLateFee: asset.dailyLateFee,
    };

    // Cập nhật ngay trạng thái thiết bị sang BORROWED (Đỏ) để ngăn 2 người đặt trùng cùng lúc (NFR #1)
    asset.status = ASSET_STATUS_BORROWED;
    this.physicalAssets[assetIndex] = asset;
    this.borrowTransactions = [newTransaction, ...this.borrowTransactions];

    this.notifications = [
      {
        notificationId: this.notifications.length + 901,
        userId: user.userId,
        title: 'Phiếu Mượn Điện Tử & Mã QR Nhận Tài Sản',
        message: `Đã tạo phiếu ${transactionCode} cho "${asset.assetName}". Mã QR nhận tại quầy: ${qrCodeToken}.`,
        type: 'BORROW_QR',
        createdAt: formatDateTime(now),
      },
      ...this.notifications,
    ];

    this.recordAuditLog(
      user,
      'BORROW_REQUEST_ONLINE',
      `borrow_transactions#${newTransaction.transactionId}`,
      `Đặt mượn trực tuyến "${asset.assetName}", sinh mã QR [${qrCodeToken}]`
    );

    return { ...newTransaction };
  }

  /**
   * Quét mã QR tại quầy thư viện để xác nhận Nhận hoặc Trả tài sản & tự động tính phí phạt (F-04, F-06).
   */
  scanQrCodeAtCounter(actorUser, qrCodeToken, daysLateSimulated = 0, returnCondition = 'Tốt - Nguyên vẹn (100%)') {
    if (actorUser.roleId !== ROLE_LIBRARIAN && actorUser.roleId !== ROLE_ADMIN) {
      this.recordAuditLog(
        actorUser,
        'UNAUTHORIZED_QR_SCAN_BLOCKED',
        'borrow_transactions',
        `Chặn người dùng không phải Cán bộ Thư viện/Admin quét mã QR [${qrCodeToken}]`
      );
      throw new Error('Chỉ Cán bộ Thư viện hoặc Quản trị viên mới có quyền quét mã QR xác nhận tại quầy.');
    }

    const cleanToken = String(qrCodeToken || '').trim();
    const txIndex = this.borrowTransactions.findIndex(
      (t) => t.qrCodeToken.toLowerCase() === cleanToken.toLowerCase()
    );

    if (txIndex === -1) {
      throw new Error(`Không tìm thấy phiếu mượn nào khớp với mã QR "${cleanToken}".`);
    }

    const tx = { ...this.borrowTransactions[txIndex] };
    const assetIndex = this.physicalAssets.findIndex((a) => a.assetId === tx.assetId);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Bước 03 Workflow: Nếu phiếu đang chờ nhận tại quầy -> Chuyển thành Đang mượn (BORROWED)
    if (tx.status === LOAN_STATUS_PENDING_PICKUP) {
      tx.status = LOAN_STATUS_BORROWED;
      tx.receivedAt = nowStr;
      this.borrowTransactions[txIndex] = tx;

      if (assetIndex !== -1) {
        this.physicalAssets[assetIndex] = {
          ...this.physicalAssets[assetIndex],
          status: ASSET_STATUS_BORROWED,
        };
      }

      this.recordAuditLog(
        actorUser,
        'QR_COUNTER_HANDOVER',
        `borrow_transactions#${tx.transactionId}`,
        `Cán bộ quét QR [${tx.qrCodeToken}] bàn giao "${tx.assetName}" cho ${tx.userName}. Trạng thái -> Đang mượn.`
      );

      return {
        actionType: 'HANDOVER',
        transaction: { ...tx },
      };
    }

    // Bước 05 Workflow: Nếu phiếu đang mượn -> Quét QR trả tài sản & tự động tính phí phạt nếu trễ hạn
    if (tx.status === LOAN_STATUS_BORROWED) {
      const safeDaysLate = Math.max(0, Number(daysLateSimulated) || 0);
      const fineAmount = calculateFine(safeDaysLate, tx.dailyLateFee);

      tx.status = LOAN_STATUS_RETURNED;
      tx.returnedAt = nowStr;
      tx.returnCondition = returnCondition;
      tx.fineAmount = fineAmount;
      this.borrowTransactions[txIndex] = tx;

      const needsMaintenance =
        returnCondition.toLowerCase().includes('hỏng') ||
        returnCondition.toLowerCase().includes('bảo trì');

      const nextAssetStatus = needsMaintenance
        ? ASSET_STATUS_MAINTENANCE
        : ASSET_STATUS_AVAILABLE;

      if (assetIndex !== -1) {
        this.physicalAssets[assetIndex] = {
          ...this.physicalAssets[assetIndex],
          status: nextAssetStatus,
          conditionNote: returnCondition,
        };
      }

      const borrowerIndex = this.users.findIndex((u) => u.userId === tx.userId);
      let updatedBorrower = null;

      if (borrowerIndex !== -1 && fineAmount > 0) {
        const borrower = { ...this.users[borrowerIndex] };
        borrower.totalDebt += fineAmount;
        if (borrower.totalDebt >= DEBT_LOCK_THRESHOLD) {
          borrower.status = STATUS_LOCKED;
        }
        this.users[borrowerIndex] = borrower;
        updatedBorrower = { ...borrower };

        const fineMsg = formatFineNotificationMessage(borrower.fullName, fineAmount, safeDaysLate);
        this.notifications = [
          {
            notificationId: this.notifications.length + 901,
            userId: borrower.userId,
            title: borrower.status === STATUS_LOCKED
              ? 'Cảnh báo Phí Phạt & Khóa Quyền Mượn Tự Động (F-06)'
              : 'Thông báo Phí Phạt Trễ Hạn (F-06)',
            message:
              borrower.status === STATUS_LOCKED
                ? `${fineMsg} Tổng nợ hiện tại: ${borrower.totalDebt.toLocaleString('vi-VN')} VNĐ (Đã tự động khóa quyền mượn).`
                : fineMsg,
            type: 'FINE_ALERT',
            createdAt: nowStr,
          },
          ...this.notifications,
        ];
      }

      this.recordAuditLog(
        actorUser,
        'QR_COUNTER_RETURN',
        `borrow_transactions#${tx.transactionId}`,
        `Nhận trả "${tx.assetName}" qua QR [${tx.qrCodeToken}]. Trễ: ${safeDaysLate} ngày, Phạt: ${fineAmount.toLocaleString('vi-VN')} VNĐ, Trạng thái thiết bị -> ${nextAssetStatus}.`
      );

      return {
        actionType: 'RETURN',
        transaction: { ...tx },
        daysLate: safeDaysLate,
        fineAmount,
        updatedBorrower,
      };
    }

    throw new Error('Phiếu mượn này đã được hoàn tất trả tài sản trước đó.');
  }

  /**
   * Tính toán chi phí đặt phòng học (Giảng viên được miễn phí hoàn toàn theo Docblock Mục 5).
   */
  calculateBookingCost(userId, roomId, hours) {
    const user = this.users.find((u) => u.userId === Number(userId));
    if (!user || hours <= 0) {
      return 0;
    }

    if (user.roleId === ROLE_LECTURER || user.roleId === ROLE_ADMIN) {
      return 0;
    }

    const room = this.studyRooms.find((r) => r.roomId === Number(roomId));
    const rate = room ? room.hourlyRate : DEFAULT_ROOM_HOURLY_RATE;
    return rate * hours;
  }

  /**
   * Đặt phòng học theo khung giờ với kiểm tra xung đột thời gian thực (F-07).
   */
  createRoomBooking(actorUser, payload) {
    const { roomId, bookingDate, startTime, endTime, attendeesCount, purpose } = payload;
    const room = this.studyRooms.find((r) => r.roomId === Number(roomId));

    if (!room) {
      throw new Error('Không tìm thấy phòng học.');
    }

    if (room.status === ASSET_STATUS_MAINTENANCE) {
      throw new Error(`Phòng "${room.roomName}" đang bảo trì (Màu xám), không thể đặt lịch.`);
    }

    if (!bookingDate || !startTime || !endTime || startTime >= endTime) {
      throw new Error('Khung giờ đặt phòng không hợp lệ (Giờ kết thúc phải sau giờ bắt đầu).');
    }

    const count = Number(attendeesCount) || 1;
    if (count > room.capacity) {
      throw new Error(
        `Số lượng người (${count}) vượt quá sức chứa tối đa của ${room.roomName} (${room.capacity} người).`
      );
    }

    // Kiểm tra xung đột thời gian thực: startA < endB && endA > startB
    const conflictingBooking = this.roomBookings.find(
      (b) =>
        b.roomId === room.roomId &&
        b.bookingDate === bookingDate &&
        b.status === BOOKING_STATUS_CONFIRMED &&
        startTime < b.endTime &&
        endTime > b.startTime
    );

    if (conflictingBooking) {
      throw new Error(
        `Xung đột lịch thời gian thực (F-07)! Phòng "${room.roomCode}" đã được đặt trong khung giờ ${conflictingBooking.startTime} - ${conflictingBooking.endTime} ngày ${bookingDate} (Mã: ${conflictingBooking.bookingCode}).`
      );
    }

    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    const durationHours = Math.max(1, endHour - startHour);
    const totalCost = this.calculateBookingCost(actorUser.userId, room.roomId, durationHours);
    const bookingCode = `ROOM-${bookingDate.replace(/-/g, '')}-${room.roomId}-${this.roomBookings.length + 1}`;

    const newBooking = {
      bookingId: this.roomBookings.length + 701,
      bookingCode,
      roomId: room.roomId,
      roomCode: room.roomCode,
      roomName: room.roomName,
      userId: actorUser.userId,
      userName: `${actorUser.fullName} (${actorUser.universityId})`,
      bookingDate,
      startTime,
      endTime,
      attendeesCount: count,
      purpose: purpose || 'Học nhóm & Thảo luận chuyên đề',
      totalCost,
      status: BOOKING_STATUS_CONFIRMED,
    };

    this.roomBookings = [newBooking, ...this.roomBookings];

    this.recordAuditLog(
      actorUser,
      'BOOK_STUDY_ROOM',
      `room_bookings#${newBooking.bookingId}`,
      `Đặt phòng ${room.roomCode} ngày ${bookingDate} (${startTime}-${endTime}), chi phí: ${totalCost.toLocaleString('vi-VN')} VNĐ.`
    );

    return { ...newBooking };
  }

  /**
   * Hủy lịch đặt phòng học trước tối thiểu 2 giờ không phạt & tự động mở lại slot trống (F-08).
   */
  cancelRoomBooking(actorUser, bookingId, hoursBeforeStartSimulated = 4) {
    const idx = this.roomBookings.findIndex((b) => b.bookingId === Number(bookingId));
    if (idx === -1) {
      throw new Error('Không tìm thấy lịch đặt phòng.');
    }

    const booking = { ...this.roomBookings[idx] };
    if (booking.status === BOOKING_STATUS_CANCELLED) {
      throw new Error('Lịch đặt phòng này đã được hủy trước đó.');
    }

    if (Number(hoursBeforeStartSimulated) < MIN_CANCEL_HOURS_BEFORE) {
      throw new Error(
        `Vi phạm quy tắc hủy lịch (F-08): Chỉ cho phép hủy không phạt trước giờ bắt đầu tối thiểu ${MIN_CANCEL_HOURS_BEFORE} giờ.`
      );
    }

    booking.status = BOOKING_STATUS_CANCELLED;
    this.roomBookings[idx] = booking;

    this.recordAuditLog(
      actorUser,
      'CANCEL_ROOM_BOOKING',
      `room_bookings#${booking.bookingId}`,
      `Hủy lịch đặt phòng ${booking.bookingCode} (${booking.roomCode}) trước ${hoursBeforeStartSimulated} giờ. Đã mở lại slot trống.`
    );

    return { ...booking };
  }
}

