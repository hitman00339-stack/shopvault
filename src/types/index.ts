// ─── All TypeScript Interfaces & Types ───
// Single source of truth for all data shapes across the app

// ─── Auth Types ───
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserPublic;
}

// ─── User Types ───
export interface UserPublic {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "MEMBER" | "ADMIN";
  upiId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UserDetail extends UserPublic {
  totalOrders: number;
  totalSpent: number;
  totalCashback: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
}

export interface UserProfileUpdate {
  name?: string;
  phone?: string;
  upiId?: string;
  bankDetails?: string;
}

// ─── Deal Types ───
export interface Deal {
  id: string;
  title: string;
  description: string | null;
  brandName: string;
  platform: Platform;
  productUrl: string;
  imageUrl: string | null;
  productPrice: number;
  cashbackAmount: number;
  searchKeyword: string | null;
  sellerName: string | null;
  totalSlots: number;
  usedSlots: number;
  instructions: string | null;
  status: DealStatus;
  isVisible: boolean;
  form1: FormTemplate | null;
  form2: FormTemplate | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealCreate {
  title: string;
  description?: string;
  brandName: string;
  platform: Platform;
  productUrl: string;
  imageUrl?: string;
  productPrice: number;
  cashbackAmount?: number;
  searchKeyword?: string;
  sellerName?: string;
  totalSlots?: number;
  instructions?: string;
  form1Id?: string;
  form2Id?: string;
}

export interface DealUpdate extends Partial<DealCreate> {
  status?: DealStatus;
  isVisible?: boolean;
}

export type Platform =
  | "AMAZON"
  | "FLIPKART"
  | "MYNTRA"
  | "MEESHO"
  | "NYKAA"
  | "AJIO"
  | "OTHER";

export type DealStatus = "ACTIVE" | "PAUSED" | "EXPIRED" | "COMPLETED";

// ─── Form Types (Custom Form Builder) ───
export interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  label: string;
  fieldType: FieldType;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  options: string | null; // JSON stringified array for dropdowns
  sortOrder: number;
}

export interface FormFieldInput {
  label: string;
  fieldType: FieldType;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  options?: string[];
  sortOrder: number;
}

export type FieldType =
  | "SHORT_ANSWER"
  | "LONG_ANSWER"
  | "NUMBER"
  | "DATE"
  | "FILE_UPLOAD"
  | "DROPDOWN"
  | "EMAIL"
  | "PHONE"
  | "URL";

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  SHORT_ANSWER: "Short Answer",
  LONG_ANSWER: "Long Answer (Paragraph)",
  NUMBER: "Number",
  DATE: "Date Picker",
  FILE_UPLOAD: "File / Screenshot Upload",
  DROPDOWN: "Dropdown Select",
  EMAIL: "Email Address",
  PHONE: "Phone Number",
  URL: "URL / Link",
};

// ─── Submission Types ───
export interface Submission {
  id: string;
  userId: string;
  user: UserPublic;
  dealId: string;
  deal: Pick<Deal, "id" | "title" | "brandName" | "platform">;
  formType: "FORM1" | "FORM2";
  status: SubmissionStatus;
  adminNotes: string | null;
  formData: FormSubmissionData[];
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmissionData {
  id: string;
  fieldLabel: string;
  fieldType: FieldType;
  value: string;
}

export interface SubmissionCreate {
  dealId: string;
  formType: "FORM1" | "FORM2";
  formData: {
    fieldLabel: string;
    fieldType: FieldType;
    value: string;
  }[];
}

export type SubmissionStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

// ─── Support Types ───
export interface SupportTicket {
  id: string;
  userId: string;
  user: UserPublic;
  queryType: QueryType;
  subject: string;
  description: string;
  screenshotUrl: string | null;
  status: TicketStatus;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketCreate {
  queryType: QueryType;
  subject: string;
  description: string;
  screenshotUrl?: string;
}

export type QueryType =
  | "DELIVERY"
  | "RETURN"
  | "REFUND"
  | "PRODUCT_QUESTION"
  | "PAYMENT"
  | "OTHER";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

// ─── Admin Dashboard Types ───
export interface DashboardStats {
  totalUsers: number;
  activeDeals: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  totalReportedSpend: number;
  totalCashbackDue: number;
  recentSubmissions: Submission[];
}

// ─── Export Types ───
export interface ExportRequest {
  type: "FULL" | "SELLER_WISE" | "DATE_WISE" | "SELLER_DATE";
  sellerId?: string;
  dateFrom?: string;
  dateTo?: string;
  format: "CSV" | "EXCEL";
}

// ─── API Response Wrapper ───
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Filter Types ───
export interface DealFilters {
  platform?: Platform;
  status?: DealStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SubmissionFilters {
  dealId?: string;
  userId?: string;
  formType?: "FORM1" | "FORM2";
  status?: SubmissionStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface UserFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}