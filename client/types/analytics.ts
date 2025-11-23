// Analytics Dashboard Types
// Using Reown/AppKit for wallet integration

export enum UserRole {
  ADMIN = 'admin',
  OPERATIONS = 'operations',
  GROWTH = 'growth',
  MERCHANT = 'merchant',
  USER = 'user',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  CONVERSION = 'conversion',
  PAYMENT = 'payment',
  TRANSFER = 'transfer',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface User {
  id: string;
  walletAddress: string;
  email?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    socialProvider?: string;
    kycStatus?: 'pending' | 'approved' | 'rejected';
    region?: string;
    merchantId?: string;
  };
}

export interface TokenInfo {
  symbol: string;
  address: string;
  amount: string;
  decimals: number;
}

export interface FiatInfo {
  currency: string;
  amount: number;
  exchangeRate: number;
}

export interface GasFee {
  amount: string;
  token: string;
}

export interface Transaction {
  id: string;
  userId: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;

  type: TransactionType;
  status: TransactionStatus;

  fromToken: TokenInfo;
  toFiat?: FiatInfo;

  network: string;
  chainId: number;
  fromAddress: string;
  toAddress: string;

  merchantId?: string;
  merchantName?: string;
  merchantCategory?: string;

  gasFee: GasFee;
  platformFee?: number;

  metadata: {
    userAgent?: string;
    ipAddress?: string;
    location?: {
      country: string;
      city?: string;
    };
    notes?: string;
    failureReason?: string;
  };
}

export interface NetworkDistribution {
  [network: string]: {
    transactions: number;
    volume: number;
  };
}

export interface VolumeData {
  [token: string]: {
    amount: string;
    usdValue: number;
  };
}

export interface AnalyticsMetrics {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';

  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;

  totalVolume: VolumeData;
  conversionVolume: {
    [fiatCurrency: string]: number;
  };

  activeUsers: number;
  newUsers: number;
  returningUsers: number;

  activeMerchants: number;
  merchantPayments: number;
  merchantVolume: number;

  networkDistribution: NetworkDistribution;

  averageConfirmationTime: number;
  successRate: number;
  averageGasFee: number;

  totalPlatformFees: number;
  totalGasFees: number;
  netRevenue: number;
}

export interface AnalyticsSummary {
  totalTransactions: number;
  totalVolumeUSD: number;
  activeUsers: number;
  successRate: number;
  growthRate?: number;
  volumeGrowth?: number;
  userGrowth?: number;
}

export interface NetworkStats {
  network: string;
  transactionCount: number;
  totalVolumeUSD: number;
  uniqueUsers?: number;
  avgGasFeeUSD: number;
}

export interface TokenStats {
  symbol: string;
  transactionCount: number;
  totalVolumeUSD: number;
  avgTransactionSize: number;
}

export interface DashboardData {
  metrics: AnalyticsMetrics[];
  summary: AnalyticsSummary;
  networkDistribution: NetworkDistribution;
  networkStats: NetworkStats[];
  tokenStats: TokenStats[];
  transactions: Transaction[];
}

export interface FilterConfig {
  dateRange: {
    startDate: Date;
    endDate: Date;
    preset?: '24h' | '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';
  };

  transaction?: {
    types?: TransactionType[];
    statuses?: TransactionStatus[];
    networks?: string[];
    tokens?: string[];
    amountRange?: {
      min?: number;
      max?: number;
      currency?: string;
    };
  };

  user?: {
    roles?: UserRole[];
    regions?: string[];
  };

  merchant?: {
    categories?: string[];
    ids?: string[];
  };

  segmentBy?: 'network' | 'token' | 'userRole' | 'merchantCategory' | 'region';
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: PaginationConfig;
}

export interface UserAnalytics {
  total: number;
  new: number;
  active: number;
  byRole: { [role: string]: number };
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
}

export interface ConversionAnalytics {
  total: number;
  volume: { [currency: string]: number };
  averageSize: number;
  byToken: {
    [token: string]: {
      count: number;
      volume: number;
    };
  };
}

export interface MerchantAnalytics {
  total: number;
  active: number;
  topByVolume: Array<{
    merchantId: string;
    merchantName: string;
    volume: number;
    transactions: number;
  }>;
  byCategory: {
    [category: string]: {
      merchants: number;
      volume: number;
    };
  };
}

export interface ChartDataPoint {
  timestamp: number;
  date: string;
  value: number;
  label?: string;
}

export interface RealtimeUpdate {
  type: 'transaction' | 'user_activity' | 'metric_update';
  data: any;
  timestamp: Date;
}

export interface ExportConfig {
  reportType: 'transactions' | 'users' | 'conversions' | 'merchants';
  format: 'csv' | 'xlsx' | 'pdf';
  filters: FilterConfig;
  filename?: string;
}
