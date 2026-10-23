/**
 * Centralized Frontend Validation Library
 * Strictly mirrors FluentValidation rules defined in TrustSimBackend.Application.Features.*.Validators:
 * - Ai/Validators
 * - Auction/Validators
 * - Dispute/Validators
 * - Financial/Validators
 * - Identity/Validators
 * - Sim/Validators
 * - System/Validators
 * - Trade/Validators
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ==========================================
// 1. Dispute Validators (Features/Dispute/Validators)
// ==========================================
export const disputeValidators = {
  /**
   * ResolveDisputeCommandValidator
   * - ResolutionStatus: RESOLVED_FAVOR_SELLER or RESOLVED_FAVOR_BUYER
   * - ResolutionNotes: 10 - 2000 chars
   */
  validateResolution(status: string, notes: string): ValidationResult {
    if (status !== "RESOLVED_FAVOR_SELLER" && status !== "RESOLVED_FAVOR_BUYER") {
      return {
        isValid: false,
        error: "Trạng thái phán quyết chỉ chấp nhận Xử bên mua thắng (RESOLVED_FAVOR_BUYER) hoặc Xử bên bán thắng (RESOLVED_FAVOR_SELLER).",
      };
    }
    const cleanNotes = notes?.trim() || "";
    if (!cleanNotes) {
      return { isValid: false, error: "Ghi chú căn cứ phán quyết không được để trống." };
    }
    if (cleanNotes.length < 10) {
      return {
        isValid: false,
        error: `Ghi chú phán quyết phải có ít nhất 10 ký tự (hiện có ${cleanNotes.length} ký tự).`,
      };
    }
    if (cleanNotes.length > 2000) {
      return { isValid: false, error: "Ghi chú phán quyết không được vượt quá 2000 ký tự." };
    }
    return { isValid: true };
  },

  /**
   * CreateDisputeCommandValidator
   * - TradeTransactionId: required
   * - Reason: 10 - 1000 chars
   */
  validateCreation(tradeTransactionId: string, reason: string): ValidationResult {
    if (!tradeTransactionId?.trim()) {
      return { isValid: false, error: "Mã giao dịch ký quỹ (TradeTransactionId) không được để trống." };
    }
    const cleanReason = reason?.trim() || "";
    if (!cleanReason) {
      return { isValid: false, error: "Lý do khiếu nại không được để trống." };
    }
    if (cleanReason.length < 10) {
      return {
        isValid: false,
        error: `Lý do khiếu nại phải có ít nhất 10 ký tự (hiện có ${cleanReason.length} ký tự).`,
      };
    }
    if (cleanReason.length > 1000) {
      return { isValid: false, error: "Lý do khiếu nại không được vượt quá 1000 ký tự." };
    }
    return { isValid: true };
  },
};

// ==========================================
// 2. Financial Validators (Features/Financial/Validators)
// ==========================================
export const financialValidators = {
  /**
   * CreateWithdrawCommandValidator
   * - Amount: 50,000 <= Amount <= 100,000,000, integer
   * - DestinationBankCode: 2 - 20 chars, ^[A-Za-z0-9_-]{2,20}$
   * - DestinationBankName: max 150 chars
   * - DestinationAccountNumber: 6 - 30 chars, ^[0-9A-Za-z]+$
   * - DestinationAccountHolderName: max 150 chars, letters & spaces only
   * - Note: max 255 chars
   */
  validateWithdraw(payload: {
    amount: number;
    destinationBankCode: string;
    destinationBankName: string;
    destinationAccountNumber: string;
    destinationAccountHolderName: string;
    note?: string;
    availableBalance?: number;
  }): ValidationResult {
    const { amount, destinationBankCode, destinationBankName, destinationAccountNumber, destinationAccountHolderName, note, availableBalance } = payload;

    if (amount === undefined || amount === null || isNaN(amount)) {
      return { isValid: false, error: "Vui lòng nhập số tiền rút hợp lệ." };
    }
    if (amount < 50_000) {
      return { isValid: false, error: "Số tiền rút tối thiểu là 50,000 VNĐ." };
    }
    if (amount > 100_000_000) {
      return { isValid: false, error: "Số tiền rút tối đa mỗi lần là 100,000,000 VNĐ." };
    }
    if (amount !== Math.floor(amount)) {
      return { isValid: false, error: "Số tiền rút phải là số nguyên VNĐ (không có phần thập phân)." };
    }
    if (availableBalance !== undefined && amount > availableBalance) {
      return {
        isValid: false,
        error: `Số dư khả dụng không đủ để rút (khả dụng: ${availableBalance.toLocaleString("vi-VN")} ₫).`,
      };
    }

    if (!destinationBankCode?.trim()) {
      return { isValid: false, error: "Mã ngân hàng nhận không được để trống." };
    }
    if (!/^[A-Za-z0-9_-]{2,20}$/.test(destinationBankCode.trim())) {
      return { isValid: false, error: "Mã ngân hàng phải từ 2 đến 20 ký tự chữ hoặc số." };
    }

    if (!destinationBankName?.trim()) {
      return { isValid: false, error: "Tên ngân hàng nhận không được để trống." };
    }
    if (destinationBankName.trim().length > 150) {
      return { isValid: false, error: "Tên ngân hàng nhận không vượt quá 150 ký tự." };
    }

    const cleanAccNum = destinationAccountNumber?.trim() || "";
    if (!cleanAccNum) {
      return { isValid: false, error: "Số tài khoản nhận không được để trống." };
    }
    if (!/^[0-9A-Za-z]+$/.test(cleanAccNum)) {
      return { isValid: false, error: "Số tài khoản chỉ được chứa chữ cái và số." };
    }
    if (cleanAccNum.length < 6 || cleanAccNum.length > 30) {
      return { isValid: false, error: "Số tài khoản phải từ 6 đến 30 ký tự." };
    }

    const cleanHolder = destinationAccountHolderName?.trim() || "";
    if (!cleanHolder) {
      return { isValid: false, error: "Tên chủ tài khoản không được để trống." };
    }
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(cleanHolder)) {
      return { isValid: false, error: "Tên chủ tài khoản chỉ được chứa chữ cái và khoảng trắng (không chứa số hoặc ký tự đặc biệt)." };
    }
    if (cleanHolder.length > 150) {
      return { isValid: false, error: "Tên chủ tài khoản không vượt quá 150 ký tự." };
    }

    if (note && note.length > 255) {
      return { isValid: false, error: "Ghi chú rút tiền không vượt quá 255 ký tự." };
    }

    return { isValid: true };
  },

  /**
   * CreateDepositIntentCommandValidator
   * - Amount: 10,000 <= Amount <= 500,000,000, integer
   */
  validateDeposit(amount: number): ValidationResult {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return { isValid: false, error: "Vui lòng nhập số tiền nạp hợp lệ." };
    }
    if (amount < 10_000) {
      return { isValid: false, error: "Số tiền nạp tối thiểu là 10,000 VNĐ." };
    }
    if (amount > 500_000_000) {
      return { isValid: false, error: "Số tiền nạp tối đa mỗi lần là 500,000,000 VNĐ." };
    }
    if (amount !== Math.floor(amount)) {
      return { isValid: false, error: "Số tiền nạp phải là số nguyên VNĐ." };
    }
    return { isValid: true };
  },

  /**
   * AdminAdjustBalanceCommandValidator
   * - Amount: != 0, abs <= 1,000,000,000
   * - Reason: 5 - 500 chars
   */
  validateAdminAdjustBalance(amount: number, reason: string): ValidationResult {
    if (amount === 0) {
      return { isValid: false, error: "Số tiền điều chỉnh phải khác 0." };
    }
    if (Math.abs(amount) > 1_000_000_000) {
      return { isValid: false, error: "Số tiền điều chỉnh tối đa 1,000,000,000 VNĐ." };
    }
    const cleanReason = reason?.trim() || "";
    if (cleanReason.length < 5 || cleanReason.length > 500) {
      return { isValid: false, error: "Lý do điều chỉnh số dư phải từ 5 đến 500 ký tự." };
    }
    return { isValid: true };
  },

  /**
   * AdminFreezeWallet / RejectWithdraw: Reason 5 - 500 chars
   */
  validateReason(reason: string, fieldName = "Lý do"): ValidationResult {
    const clean = reason?.trim() || "";
    if (clean.length < 5 || clean.length > 500) {
      return { isValid: false, error: `${fieldName} phải từ 5 đến 500 ký tự.` };
    }
    return { isValid: true };
  },
};

// ==========================================
// 3. Identity Validators (Features/Identity/Validators)
// ==========================================
export const identityValidators = {
  /**
   * RegisterUserCommandValidator
   * - UserName: 3 - 50 ký tự, hỗ trợ Unicode, chữ số, dấu chấm, gạch dưới và khoảng trắng
   * - Email: valid email, max 255 chars
   * - Password: min 8 chars, uppercase, lowercase, digit, special char [!?*@#$%^&+=]
   */
  validateRegister(payload: { userName: string; email: string; password?: string }): ValidationResult {
    const { userName, email, password } = payload;
    const cleanUser = userName?.trim() || "";
    if (!cleanUser) {
      return { isValid: false, error: "Tên đăng nhập không được để trống." };
    }
    if (cleanUser.length < 3 || cleanUser.length > 50) {
      return { isValid: false, error: "Tên đăng nhập phải từ 3 đến 50 ký tự." };
    }
    if (!/^[\p{L}0-9_.\s]+$/u.test(cleanUser)) {
      return { isValid: false, error: "Tên đăng nhập chỉ chứa chữ cái, chữ số, khoảng trắng, dấu gạch dưới và dấu chấm." };
    }

    const cleanEmail = email?.trim() || "";
    if (!cleanEmail) {
      return { isValid: false, error: "Email không được để trống." };
    }
    if (cleanEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { isValid: false, error: "Định dạng Email không hợp lệ." };
    }

    if (password !== undefined) {
      const pwdRes = identityValidators.validatePassword(password);
      if (!pwdRes.isValid) return pwdRes;
    }

    return { isValid: true };
  },

  validatePassword(password: string): ValidationResult {
    if (!password) {
      return { isValid: false, error: "Mật khẩu không được để trống." };
    }
    if (password.length < 8) {
      return { isValid: false, error: "Mật khẩu phải có ít nhất 8 ký tự." };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: "Mật khẩu phải chứa ít nhất 1 chữ hoa." };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: "Mật khẩu phải chứa ít nhất 1 chữ thường." };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, error: "Mật khẩu phải chứa ít nhất 1 chữ số." };
    }
    if (!/[!?*@#$%^&+=]/.test(password)) {
      return { isValid: false, error: "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!?*@#$%^&+=)." };
    }
    return { isValid: true };
  },

  /**
   * UpdateProfileCommandValidator
   * - FullName: not empty, max 150
   * - PhoneNumber: ^(0|\+84)(3|5|7|8|9)[0-9]{8}$
   * - IdentityNumber: ^([0-9]{9}|[0-9]{12})$
   */
  validateProfileUpdate(payload: {
    fullName: string;
    phoneNumber: string;
    identityNumber: string;
  }): ValidationResult {
    const cleanName = payload.fullName?.trim() || "";
    if (!cleanName) {
      return { isValid: false, error: "Họ và tên không được để trống." };
    }
    if (cleanName.length > 150) {
      return { isValid: false, error: "Họ và tên không vượt quá 150 ký tự." };
    }

    const cleanPhone = payload.phoneNumber?.trim() || "";
    if (!cleanPhone) {
      return { isValid: false, error: "Số điện thoại không được để trống." };
    }
    if (!/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(cleanPhone)) {
      return { isValid: false, error: "Số điện thoại không đúng định dạng di động Việt Nam (VD: 0981234567)." };
    }

    const cleanId = payload.identityNumber?.trim() || "";
    if (!cleanId) {
      return { isValid: false, error: "Số CCCD/CMND không được để trống." };
    }
    if (!/^([0-9]{9}|[0-9]{12})$/.test(cleanId)) {
      return { isValid: false, error: "Số CCCD/CMND phải gồm đúng 9 hoặc 12 chữ số." };
    }

    return { isValid: true };
  },

  /**
   * SubmitEkycCommandValidator
   * - File size <= 5MB
   * - Formats: .jpg, .jpeg, .png, .webp
   */
  validateEkycFile(file: File | null, label = "Tệp tin hình ảnh"): ValidationResult {
    if (!file) {
      return { isValid: false, error: `${label} là bắt buộc.` };
    }
    if (file.size <= 0) {
      return { isValid: false, error: `${label} không được rỗng.` };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { isValid: false, error: `Kích thước ${label} tối đa là 5MB.` };
    }
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return { isValid: false, error: `Định dạng ${label} không hợp lệ (chỉ chấp nhận JPG, JPEG, PNG, WEBP).` };
    }
    return { isValid: true };
  },
};

// ==========================================
// 4. Auction Validators (Features/Auction/Validators)
// ==========================================
export const auctionValidators = {
  /**
   * CreateAuctionCommandValidator
   * - SimNumberId: not empty
   * - StartingPrice: > 0
   * - ReservePrice: >= StartingPrice
   * - RegistrationStartAt > now
   * - RegistrationEndAt > RegistrationStartAt
   * - StartAt >= RegistrationEndAt
   * - EndAt > StartAt
   */
  validateCreateAuction(payload: {
    simNumberId: string;
    startingPrice: number;
    reservePrice?: number;
    auctionType?: number;
    registrationStartAt: Date | string;
    registrationEndAt: Date | string;
    startAt: Date | string;
    endAt: Date | string;
  }): ValidationResult {
    if (!payload.simNumberId?.trim()) {
      return { isValid: false, error: "Vui lòng chọn số SIM cần đấu giá." };
    }
    if (payload.startingPrice <= 0) {
      return { isValid: false, error: "Giá khởi điểm phải lớn hơn 0 ₫." };
    }

    // Dutch Auction: ReservePrice is floor price and must be <= startingPrice
    if (payload.auctionType === 1) {
      if (!payload.reservePrice || payload.reservePrice <= 0) {
        return { isValid: false, error: "Đấu giá kiểu Hà Lan bắt buộc phải có giá sàn (Reserve Price) lớn hơn 0 ₫." };
      }
      if (payload.reservePrice > payload.startingPrice) {
        return { isValid: false, error: "Trong đấu giá kiểu Hà Lan, giá sàn dừng giảm phải nhỏ hơn hoặc bằng giá khởi điểm." };
      }
    } else {
      // English Auction: Reserve price (if specified) should be >= startingPrice
      if (payload.reservePrice !== undefined && payload.reservePrice > 0 && payload.reservePrice < payload.startingPrice) {
        return { isValid: false, error: "Trong đấu giá kiểu Anh, giá kỳ vọng bảo lưu phải lớn hơn hoặc bằng giá khởi điểm." };
      }
    }

    const regStart = new Date(payload.registrationStartAt).getTime();
    const regEnd = new Date(payload.registrationEndAt).getTime();
    const start = new Date(payload.startAt).getTime();
    const end = new Date(payload.endAt).getTime();
    const now = Date.now() - 5 * 60 * 1000; // Allow 5 mins grace for network latency matching backend

    if (regStart < now) {
      return { isValid: false, error: "Thời gian bắt đầu đăng ký không được ở quá khứ." };
    }
    if (regEnd <= regStart) {
      return { isValid: false, error: "Thời gian kết thúc đăng ký phải sau thời gian bắt đầu đăng ký." };
    }
    if (start < regEnd) {
      return { isValid: false, error: "Thời gian bắt đầu đấu giá phải sau hoặc bằng thời gian kết thúc đăng ký." };
    }
    if (end <= start) {
      return { isValid: false, error: "Thời gian kết thúc đấu giá phải sau thời gian bắt đầu." };
    }

    return { isValid: true };
  },

  /**
   * PlaceBidCommandValidator
   */
  validatePlaceBid(bidAmount: number, currentPrice = 0, minIncrement = 0): ValidationResult {
    if (bidAmount <= 0) {
      return { isValid: false, error: "Số tiền đặt giá phải lớn hơn 0 ₫." };
    }
    if (currentPrice > 0 && bidAmount <= currentPrice) {
      return {
        isValid: false,
        error: `Số tiền đặt giá phải lớn hơn giá hiện tại (${currentPrice.toLocaleString("vi-VN")} ₫).`,
      };
    }
    if (minIncrement > 0 && bidAmount < currentPrice + minIncrement) {
      return {
        isValid: false,
        error: `Giá đặt tối thiểu tiếp theo là ${(currentPrice + minIncrement).toLocaleString("vi-VN")} ₫ (bước giá: ${minIncrement.toLocaleString("vi-VN")} ₫).`,
      };
    }
    return { isValid: true };
  },
};

// ==========================================
// 5. Sim Validators (Features/Sim/Validators)
// ==========================================
export const simValidators = {
  /**
   * RegisterSimCommandValidator:
   * - PhoneNumber: ^0\d{9}$
   * - FormatRhythmId: not empty
   */
  validateRegisterSim(phoneNumber: string, formatRhythmId?: string): ValidationResult {
    const clean = phoneNumber?.trim().replace(/\D/g, "") || "";
    if (!clean) {
      return { isValid: false, error: "Số điện thoại không được để trống." };
    }
    if (!/^0\d{9}$/.test(clean)) {
      return { isValid: false, error: "Số điện thoại phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (VD: 0909123456)." };
    }
    if (formatRhythmId !== undefined && !formatRhythmId?.trim()) {
      return { isValid: false, error: "Vui lòng chọn kiểu nhịp định dạng số SIM." };
    }
    return { isValid: true };
  },

  /**
   * CreateCarrierCommandValidator
   */
  validateCarrier(carrierName: string, carrierCode: string, logoImg?: string): ValidationResult {
    const cleanName = carrierName?.trim() || "";
    if (!cleanName) {
      return { isValid: false, error: "Tên nhà mạng không được để trống." };
    }
    if (cleanName.length > 100) {
      return { isValid: false, error: "Tên nhà mạng không vượt quá 100 ký tự." };
    }
    const cleanCode = carrierCode?.trim() || "";
    if (!cleanCode) {
      return { isValid: false, error: "Mã nhà mạng không được để trống." };
    }
    if (cleanCode.length > 20) {
      return { isValid: false, error: "Mã nhà mạng không vượt quá 20 ký tự." };
    }
    if (!/^[A-Z0-9_]+$/.test(cleanCode)) {
      return { isValid: false, error: "Mã nhà mạng chỉ chứa chữ in hoa, chữ số và dấu gạch dưới (VD: VTT, MOBI)." };
    }
    if (logoImg && logoImg.length > 500) {
      return { isValid: false, error: "Đường dẫn logo không vượt quá 500 ký tự." };
    }
    return { isValid: true };
  },

  /**
   * CreateCategoryCommandValidator
   */
  validateCategory(categoryName: string, categoryCode: string): ValidationResult {
    const cleanName = categoryName?.trim() || "";
    if (!cleanName) {
      return { isValid: false, error: "Tên danh mục không được để trống." };
    }
    if (cleanName.length > 100) {
      return { isValid: false, error: "Tên danh mục không vượt quá 100 ký tự." };
    }
    const cleanCode = categoryCode?.trim() || "";
    if (!cleanCode) {
      return { isValid: false, error: "Mã danh mục không được để trống." };
    }
    if (cleanCode.length > 50) {
      return { isValid: false, error: "Mã danh mục không vượt quá 50 ký tự." };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanCode)) {
      return { isValid: false, error: "Mã danh mục chỉ chứa chữ cái, chữ số, gạch ngang và gạch dưới." };
    }
    return { isValid: true };
  },
};

// ==========================================
// 6. Ai Validators (Features/Ai/Validators)
// ==========================================
export const aiValidators = {
  /**
   * SendConsultationMessageCommandValidator:
   * - Message: not empty, max 2000 chars
   */
  validateConsultationMessage(message: string): ValidationResult {
    const clean = message?.trim() || "";
    if (!clean) {
      return { isValid: false, error: "Nội dung tin nhắn không được để trống." };
    }
    if (clean.length > 2000) {
      return { isValid: false, error: "Nội dung tin nhắn tối đa 2000 ký tự." };
    }
    return { isValid: true };
  },

  /**
   * UploadDocumentCommandValidator
   * - File length <= 50MB
   */
  validateUploadDocument(file: File | null): ValidationResult {
    if (!file) {
      return { isValid: false, error: "Vui lòng đính kèm tệp tin tài liệu." };
    }
    if (file.size <= 0) {
      return { isValid: false, error: "Tệp tin không được rỗng." };
    }
    if (file.size > 50 * 1024 * 1024) {
      return { isValid: false, error: "Kích thước tệp không được vượt quá 50MB." };
    }
    return { isValid: true };
  },
};

// ==========================================
// 7. System Validators (Features/System/Validators)
// ==========================================
export const systemValidators = {
  validateDocument(title: string, content: string, category: string): ValidationResult {
    const cleanTitle = title?.trim() || "";
    if (!cleanTitle) {
      return { isValid: false, error: "Tiêu đề tài liệu không được để trống." };
    }
    if (cleanTitle.length > 200) {
      return { isValid: false, error: "Tiêu đề tài liệu không vượt quá 200 ký tự." };
    }
    if (!content?.trim()) {
      return { isValid: false, error: "Nội dung tài liệu không được để trống." };
    }
    const cleanCat = category?.trim() || "";
    if (!cleanCat) {
      return { isValid: false, error: "Danh mục tài liệu không được để trống." };
    }
    if (cleanCat.length > 50) {
      return { isValid: false, error: "Danh mục tài liệu không vượt quá 50 ký tự." };
    }
    return { isValid: true };
  },
};

// ==========================================
// 8. Trade Validators (Features/Trade/Validators)
// ==========================================
export const tradeValidators = {
  validateCreateTrade(payload: {
    buyerId: string;
    sellerId: string;
    simNumberId: string;
    escrowAmount: number;
  }): ValidationResult {
    if (!payload.buyerId?.trim()) {
      return { isValid: false, error: "BuyerId không được để trống." };
    }
    if (!payload.sellerId?.trim()) {
      return { isValid: false, error: "SellerId không được để trống." };
    }
    if (payload.buyerId.trim() === payload.sellerId.trim()) {
      return { isValid: false, error: "Người mua và người bán không được là cùng một người." };
    }
    if (!payload.simNumberId?.trim()) {
      return { isValid: false, error: "SimNumberId không được để trống." };
    }
    if (payload.escrowAmount <= 0) {
      return { isValid: false, error: "Số tiền ký quỹ phải lớn hơn 0 ₫." };
    }
    return { isValid: true };
  },
};
