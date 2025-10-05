/**
 * TypeScript interfaces and types for the new Admin Management System
 */

// ===== COMMON TYPES =====
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== DASHBOARD TYPES =====
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalMenuItems: number;
  revenueChange: number;
  ordersChange: number;
  usersChange: number;
  menuItemsChange: number;
}

export interface ChartData {
  labels: string[];
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
}

export interface RevenueData {
  daily: ChartData;
  weekly: ChartData;
  monthly: ChartData;
}

// ===== USER MANAGEMENT TYPES =====
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export type UserRole = "admin" | "customer" | "cook" | "delivery_agent";
export type UserStatus = "active" | "inactive" | "suspended" | "pending";

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// ===== FOOD MENU MANAGEMENT TYPES =====
export interface FoodItem extends BaseEntity {
  name: string;
  description: string;
  price: number;
  category: FoodCategory;
  cuisine?: string;
  image?: string;
  ingredients: string[];
  allergens: string[];
  nutritionalInfo?: NutritionalInfo;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  spicyLevel: 1 | 2 | 3 | 4 | 5;
}

export interface FoodCategory extends BaseEntity {
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

// ===== FEEDBACK MANAGEMENT TYPES =====
export interface Feedback extends BaseEntity {
  type: FeedbackType;
  subject: string;
  message: string;
  rating?: number; // 1-5 stars
  status: FeedbackStatus;
  priority: FeedbackPriority;
  category: string;
  user: User;
  assignedTo?: User;
  responses: FeedbackResponse[];
  tags: string[];
  attachments?: string[];
}

export type FeedbackType =
  | "complaint"
  | "suggestion"
  | "compliment"
  | "bug_report"
  | "feature_request";
export type FeedbackStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "escalated";
export type FeedbackPriority = "low" | "medium" | "high" | "urgent";

export interface FeedbackResponse extends BaseEntity {
  message: string;
  author: User;
  isPublic: boolean;
  attachments?: string[];
}

// ===== COMMUNICATION TYPES =====
export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  targetUsers?: string[]; // user IDs
  targetRoles?: UserRole[];
  scheduledAt?: Date;
  sentAt?: Date;
  readBy: string[]; // user IDs who read it
  clickedBy: string[]; // user IDs who clicked it
  template?: string;
  metadata?: Record<string, any>;
}

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "promotion"
  | "system";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";
export type NotificationStatus =
  | "draft"
  | "scheduled"
  | "sent"
  | "failed"
  | "cancelled";

export interface EmailCampaign extends BaseEntity {
  name: string;
  subject: string;
  content: string;
  template?: string;
  targetUsers?: string[];
  targetRoles?: UserRole[];
  scheduledAt?: Date;
  sentAt?: Date;
  status: EmailCampaignStatus;
  stats: EmailCampaignStats;
}

export type EmailCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled";

export interface EmailCampaignStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

// ===== ANALYTICS TYPES =====
export interface AnalyticsData {
  revenue: RevenueAnalytics;
  orders: OrderAnalytics;
  users: UserAnalytics;
  menu: MenuAnalytics;
  trends: TrendAnalytics;
}

export interface RevenueAnalytics {
  total: number;
  growth: number;
  breakdown: {
    byCategory: Array<{ name: string; value: number; percentage: number }>;
    byTimeOfDay: Array<{ hour: number; value: number }>;
    byDayOfWeek: Array<{ day: string; value: number }>;
  };
}

export interface OrderAnalytics {
  total: number;
  growth: number;
  averageOrderValue: number;
  topItems: Array<{ name: string; count: number; revenue: number }>;
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
}

export interface UserAnalytics {
  total: number;
  growth: number;
  newUsers: number;
  activeUsers: number;
  userRetention: number;
  roleDistribution: Array<{
    role: UserRole;
    count: number;
    percentage: number;
  }>;
}

export interface MenuAnalytics {
  totalItems: number;
  topPerforming: Array<{ name: string; sales: number; revenue: number }>;
  underPerforming: Array<{ name: string; sales: number; revenue: number }>;
  categoryPerformance: Array<{
    category: string;
    sales: number;
    revenue: number;
  }>;
}

export interface TrendAnalytics {
  predictions: Array<{ date: string; predicted: number; actual?: number }>;
  seasonality: Array<{ period: string; factor: number }>;
  recommendations: string[];
}

// ===== REPORTS TYPES =====
export interface Report extends BaseEntity {
  name: string;
  description?: string;
  type: ReportType;
  config: ReportConfig;
  schedule?: ReportSchedule;
  status: ReportStatus;
  generatedBy: User;
  lastGenerated?: Date;
  fileUrl?: string;
  recipients?: string[];
}

export type ReportType =
  | "sales"
  | "users"
  | "menu"
  | "feedback"
  | "system"
  | "custom";
export type ReportStatus = "active" | "inactive" | "generating" | "failed";

export interface ReportConfig {
  dateRange: {
    from: Date;
    to: Date;
    type: "custom" | "last_week" | "last_month" | "last_quarter" | "last_year";
  };
  filters: Record<string, any>;
  columns: string[];
  format: "pdf" | "excel" | "csv";
  groupBy?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ReportSchedule {
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  time: string; // HH:mm format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  isActive: boolean;
}

// ===== SETTINGS TYPES =====
export interface SystemSettings {
  general: GeneralSettings;
  payment: PaymentSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  integrations: IntegrationSettings;
  maintenance: MaintenanceSettings;
}

export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
}

export interface PaymentSettings {
  providers: PaymentProvider[];
  defaultProvider: string;
  currencies: string[];
  minimumOrderAmount: number;
  deliveryFee: number;
  taxRate: number;
}

export interface PaymentProvider {
  id: string;
  name: string;
  isActive: boolean;
  config: Record<string, any>;
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    smtpConfig: SMTPConfig;
  };
  sms: {
    enabled: boolean;
    provider: string;
    config: Record<string, any>;
  };
  push: {
    enabled: boolean;
    config: Record<string, any>;
  };
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  twoFactorAuth: {
    enabled: boolean;
    required: boolean;
  };
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays?: number;
}

export interface IntegrationSettings {
  apis: APIIntegration[];
  webhooks: WebhookIntegration[];
}

export interface APIIntegration {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  isActive: boolean;
  config: Record<string, any>;
}

export interface WebhookIntegration {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
}

export interface MaintenanceSettings {
  backupSchedule: {
    frequency: "daily" | "weekly" | "monthly";
    time: string;
    retention: number; // days
  };
  maintenanceMode: {
    enabled: boolean;
    message: string;
    allowedIPs?: string[];
  };
  logging: {
    level: "error" | "warn" | "info" | "debug";
    retention: number; // days
  };
}

// ===== COMPONENT PROPS TYPES =====
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface ChartProps {
  data: ChartData;
  type: "line" | "bar" | "pie" | "area" | "doughnut";
  height?: number;
  options?: any;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  value?: any;
  onChange?: (value: any) => void;
}

// ===== UTILITY TYPES =====
export type SortDirection = "asc" | "desc";
export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "in"
  | "nin";

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface SortCondition {
  field: string;
  direction: SortDirection;
}

export interface SearchParams {
  query?: string;
  filters?: FilterCondition[];
  sort?: SortCondition[];
  pagination?: PaginationParams;
}
