export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DevERPRequest {
  code: string;
}

export interface DevERPResponse {
  success: number;
  name?: string;
  link?: string;
  message?: string;
}

export interface LoginRequest {
  user: string;
  pass: string;
  appid: string;
  firebaseid: string;
  device: string;
}

export interface LoginResponse {
  success: number;
  message?: string;
  data?: any;
}

export interface TokenRequest {
  appid: string;
  device: string;
}

export interface TokenResponse {
  success: number;
  token?: string;
  validTill?: string;
  message?: string;
}

export interface MenuRequest {
  token: string;
}

export interface MenuResponse {
  success: number;
  menu?: string;
  message?: string;
}

export interface DashboardRequest {
  token: string;
}

export interface DashboardResponse {
  success: number;
  data?: {
    d: string;
  };
  message?: string;
}

export interface PageRequest {
  token: string;
  page: string;
  id: string;
}

export interface PageResponse {
  success: number;
  data?: string;
  message?: string;
}

export interface ListDataRequest {
  token: string;
  page: string;
  fd: string;
  td: string;
  param?: string;
}

export interface ListDataResponse {
  success: number;
  data?: string;
  message?: string;
}

export interface AuthRequest {
  company_code: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    company_code: string;
    avatar: string;
    accountType: string;
    email?: string;
    phone?: string;
  };
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  company_code: string;
  accountType: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
  code: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface CheckInRequest {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface CheckOutRequest {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface AttendanceReport {
  userId: string;
  month: number;
  year: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  averageHours: number;
}

export interface AppSettings {
  notifications: {
    attendance: boolean;
    reports: boolean;
    updates: boolean;
  };
  privacy: {
    locationSharing: boolean;
    dataCollection: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface ApiErrorResponse {
  success: 0;
  message: string;
  error?: string;
  statusCode: number;
  data?: any;
}

export interface ApiSuccessResponse<T> {
  success: 1;
  data: T;
  message?: string;
  statusCode: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AttendanceRequest {
  token: string;
  page: string;
  data: string;
}

export interface AttendanceResponse {
  success: number;
  message?: string;
  data?: any;
}

