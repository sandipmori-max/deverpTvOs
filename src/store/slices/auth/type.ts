export interface User {
  id: string;
  name: string;
  company_code: string;
  avatar?: string;
  accountType?: string;
  token?: string;
  tokenValidTill?: string;
}

export interface Account {
  id: string;
  user: User;
  isActive: boolean;
  lastLoginAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  url?: string;
  icon?: string;
  children?: MenuItem[];
  title?: string;
  isReport?: any;
}

export interface DashboardItem {
  id: string;
  name: string;
  data: string;
  url?: string;
  title: string;
  isReport: any;
}

export interface AuthState {
  user: User | null;
  accounts: Account[];
  activeAccountId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  menu: MenuItem[];
  isMenuLoading: boolean;
  dashboard: DashboardItem[];
  isDashboardLoading: boolean;
  activeToken: string | null;
  isPinLoaded: boolean;
  dashboardFromDate: string,
  dashboardToDate: string,
  dashboardBranch: string,
  dashboardType: string,
  dashboardBranchId: string,
  dashboardTypeId: string,
  appDrawerMenuList: [],
  appBottomMenuList: [],
  appColorCode: string,
  isPinVerifyLoaded: boolean,
  attendanceDone: boolean,
  locationLogs: []
}
