import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, MenuItem, DashboardItem } from './type';
import {
  checkAuthStateThunk,
  loginUserThunk,
  removeAccountThunk,
  switchAccountThunk,
  logoutUserThunk,
  getERPMenuThunk,
  getERPDashboardThunk,
  getERPAppConfigMenuThunk,
} from './thunk';

const initialState: AuthState = {
  user: null,
  accounts: [],
  activeAccountId: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  menu: [],
  isMenuLoading: false,
  dashboard: [],
  isDashboardLoading: false,
  activeToken: null,
  isPinLoaded: false,
  dashboardFromDate: '',
  dashboardToDate: '',
  dashboardBranch: '',
  dashboardType: '',
  dashboardBranchId: '',
  dashboardTypeId: '',
  appDrawerMenuList: [],
  appBottomMenuList: [],
  appColorCode: '',
  isPinVerifyLoaded: false,
  attendanceDone: false,
  locationLogs: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
     addLocation: (state, action) => {
      state.locationLogs.unshift(action.payload);
    },
    updatePinVerifyLoadedState: (state, action: PayloadAction<boolean>) => {
      state.isPinVerifyLoaded = action.payload;
    },
    updateAttendanceState: (state, action: PayloadAction<boolean>) => {
      state.attendanceDone = action.payload;
    },
    setIsPinLoaded: state => {
      state.isPinLoaded = true;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearAuthState: state => {
      
      state.dashboardBranch = '';
      state.dashboardBranchId = '',
      state.dashboardFromDate = '',
      state.dashboardToDate = '',
      state.dashboardType = '',
      state.dashboardTypeId = ''
    },
    logout: state => {
      state.user = null;
      state.accounts = [];
      state.activeAccountId = null;
      state.isAuthenticated = false;
      state.error = null;
      state.menu = [];
      state.dashboard = [];
    },
    setMenu: (state, action: PayloadAction<MenuItem[]>) => {
      state.menu = action?.payload;
    },
    setEmptyMenu: (state, action: PayloadAction<MenuItem[]>) => {
      state.menu = [];
    },
    setMenuLoading: (state, action: PayloadAction<boolean>) => {
      state.isMenuLoading = action?.payload;
    },
    setDashboard: (state, action: PayloadAction<DashboardItem[]>) => {
      state.dashboard = action?.payload;
    },
    setDashboardLoading: (state, action: PayloadAction<boolean>) => {
      state.isDashboardLoading = action?.payload;
    },
    setActiveToken: (state, action: PayloadAction<string | null>) => {
      state.activeToken = action?.payload;
    },
    setActiveDashboardBranchId: (state, action: PayloadAction<string | null>) => {
      state.dashboardBranchId = action?.payload;
    },
    setActiveDashboardTypeId: (state, action: PayloadAction<string | null>) => {
      state.dashboardTypeId = action?.payload;
    },
    setActiveDashboardFromDate: (state, action: PayloadAction<string | null>) => {
      state.dashboardFromDate = action?.payload;
    },
    setActiveDashboardToDate: (state, action: PayloadAction<string | null>) => {
      state.dashboardToDate = action?.payload;
    },
    setActiveDashboardBranch: (state, action: PayloadAction<string | null>) => {
      state.dashboardBranch = action?.payload;
    },
    setActiveDashboardType: (state, action: PayloadAction<string | null>) => {
      state.dashboardType = action?.payload;
    },
    
  },
  extraReducers: builder => {
    builder

      .addCase(checkAuthStateThunk.pending, state => {
        state.isLoading = true;
      })
      .addCase(checkAuthStateThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          if (action?.payload?.accounts) {
            state.accounts = action?.payload?.accounts;
          } else {
            state.accounts = state?.accounts.map(acc => ({
              ...acc,
              isActive: acc?.id === action?.payload?.accountId,
            }));
          }
          state.activeAccountId = action?.payload?.activeAccountId;
          state.user = action?.payload?.user;
          state.activeToken = action?.payload?.user?.token || null;
          state.isAuthenticated = !!action?.payload?.user;
        }
        state.error = null;
      })
      .addCase(checkAuthStateThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action?.payload as string;
      })

      .addCase(loginUserThunk.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action?.payload?.user;
        state.activeAccountId = action?.payload?.accountId;
        if (action?.payload?.accounts) {
          state.accounts = action?.payload?.accounts;
        } else {
          state.accounts = state?.accounts.map(acc => ({
            ...acc,
            isActive: acc?.id === action?.payload?.accountId,
          }));
        }
        state.isAuthenticated = true;
        state.activeToken = action?.payload?.user?.token || null;

        state.error = null;
      })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      .addCase(switchAccountThunk.pending, state => {
        state.isLoading = true;
      })
      .addCase(switchAccountThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action?.payload?.user;
        state.activeAccountId = action?.payload?.accountId;
        if (action?.payload?.accounts) {
          state.accounts = action?.payload?.accounts;
        } else {
          state.accounts = state?.accounts.map(acc => ({
            ...acc,
            isActive: acc?.id === action?.payload?.accountId,
          }));
        }
        state.activeToken = action?.payload?.user?.token || null;

        state.error = null;
      })
      .addCase(switchAccountThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action?.payload as string;
      })

      .addCase(removeAccountThunk.pending, state => {
        state.isLoading = true;
      })
      .addCase(removeAccountThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action?.payload?.accounts) {
          state.accounts = action?.payload?.accounts;
        } else {
          state.accounts = state?.accounts.map(acc => ({
            ...acc,
            isActive: acc?.id === action?.payload?.accountId,
          }));
        }
        state.user = action?.payload?.user;
        state.activeAccountId = action?.payload?.activeAccountId;
        state.isAuthenticated = !!action?.payload?.user;
        state.activeToken = action?.payload?.user?.token || null;
        state.error = null;
      })
      .addCase(removeAccountThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action?.payload as string;
      })

      .addCase(logoutUserThunk.fulfilled, state => {
        state.isLoading = false;
        state.user = null;
        state.accounts = [];
        state.activeAccountId = null;
        state.isAuthenticated = false;
        state.error = null;
        state.menu = [];
        state.dashboard = [];
        state.activeToken = null;
      })
      .addCase(logoutUserThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action?.payload as string;
      })

      .addCase(getERPMenuThunk.pending, state => {
        state.isMenuLoading = true;
        state.menu = [];
      })
      .addCase(getERPMenuThunk.fulfilled, (state, action) => {
        state.menu = [];
        try {
          let menuData;
          if (typeof action.payload === 'string') {
            menuData = JSON.parse(action.payload);
          } else {
            menuData = action.payload;
          }

          let menus = [];
          if (menuData) {
            if (menuData.success === 1 && menuData.menus) {
              menus = menuData.menus;
            } else if (menuData.d) {
              try {
                const innerData = JSON.parse(menuData.d);
                if (innerData?.success === 1 && innerData?.menus) {
                  menus = innerData.menus;
                }
              } catch (innerParseError) {
              }
            }
          }

          state.menu = menus.map((menu: any, index: number) => ({
            id: `menu_${index}`,
            name: menu?.Name || '',
            url: menu?.Link || '',
            icon: menu?.Image || '',
            children: menu?.Datas || [],
            title: menu?.Title || '',
            isReport: menu?.IsReport,
          }));
          state.error = null;
          // state.isMenuLoading = false;
        } catch (error) {
          state.menu = [];
          // state.isMenuLoading = false;
        }
      })
      .addCase(getERPMenuThunk.rejected, (state, action) => {
        // state.isMenuLoading = false;
        state.error = action.payload as string;
      })

      .addCase(getERPAppConfigMenuThunk.pending, state => {
        state.isMenuLoading = true;
        state.menu = [];
      })
      .addCase(getERPAppConfigMenuThunk.fulfilled, (state, action) => {
         try {
          let menuData;
          if (typeof action.payload === 'string') {
            menuData = JSON.parse(action.payload);
          } else {
            menuData = action.payload;
          }

          state.appBottomMenuList = menuData?.bottom
          state.appDrawerMenuList = menuData?.drawer
          state.appColorCode = menuData?.hexacolor
  
          state.error = null;
          state.isMenuLoading = false;
        } catch (error) {
          state.menu = [];
          state.isMenuLoading = false;
        }
      })
      .addCase(getERPAppConfigMenuThunk.rejected, (state, action) => {
        // state.isMenuLoading = false;
        state.error = action.payload as string;
      })


      .addCase(getERPDashboardThunk.pending, state => {
        state.isDashboardLoading = true;
      })
      .addCase(getERPDashboardThunk.fulfilled, (state, action) => {
        try {
          let dashboardData;
          if (typeof action?.payload === 'string') {
            dashboardData = JSON.parse(action?.payload);
          } else {
            dashboardData = action?.payload;
          }
          let dashboardItems = [];

          if (dashboardData?.data && dashboardData?.data?.d) {
            try {
              const innerData = JSON.parse(dashboardData?.data?.d);
              if (innerData?.success === 1 && innerData?.dbs) {
                dashboardItems = innerData.dbs;
              }
            } catch (innerParseError) {
            }
          } else if (dashboardData?.success === 1 && dashboardData?.dbs) {
            dashboardItems = dashboardData?.dbs;
          } else if (dashboardData.d) {
            try {
              const innerData = JSON.parse(dashboardData?.d);
              if (innerData?.success === 1 && innerData?.dbs) {
                dashboardItems = innerData.dbs;
              }
            } catch (innerParseError) {
            }
          }
          state.dashboard = dashboardItems.length > 0 ? dashboardItems?.map((item: any, index: number) => ({
            id: item?.Link || `dashboard_${index}`,
            name: item?.Name || '',
            data: item?.Data || '',
            url: item?.Link || '',
            title: item?.Title || '',
            isReport: item.IsReport || '',
            footer: item?.footer || '',
          })): [];
          state.error = null;
          
        } catch (error) {
          state.dashboard = [];
        }
        
      })
      .addCase(getERPDashboardThunk.rejected, (state, action) => {
         
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setLoading,
  logout,
  setMenu,
  setEmptyMenu,
  setMenuLoading,
  setDashboard,
  setDashboardLoading,
  setActiveToken,
  setIsPinLoaded,
  setActiveDashboardBranchId,
  setActiveDashboardBranch,
  setActiveDashboardFromDate,
  setActiveDashboardToDate,
  setActiveDashboardType,
  setActiveDashboardTypeId,
  clearAuthState,
  updatePinVerifyLoadedState,
  updateAttendanceState,
  addLocation
} = authSlice.actions;
export default authSlice.reducer;
