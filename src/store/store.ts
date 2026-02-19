import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/auth/authSlice';
import themeReducer from './slices/theme/themeSlice';
import attendanceReducer from './slices/attendance/attendanceSlice';
import dropdownReducer from './slices/dropdown/dropdownSlice';
import ajaxReducer from './slices/ajax/ajaxSlice';
import pageReducer from './slices/page/pageSlice';
import reloadAppReducer from './slices/reloadApp/reloadAppSlice';

import syncLocationReducer from './slices/location/syncLocationSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: [
  'token',
  'isPinLoaded',
  'isAuthenticated',
  'user', 
  'appDrawerMenuList',
  'appBottomMenuList',
  'appColorCode',
  'accounts',
  'locationLogs'
  ],
};

const themePersistConfig = {
  key: 'theme',
  storage: AsyncStorage,
  whitelist: ['mode', 'langcode'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedThemeReducer = persistReducer(themePersistConfig, themeReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    theme: persistedThemeReducer,
    attendance: attendanceReducer,
    dropdown: dropdownReducer,
    ajax: ajaxReducer,
    page: pageReducer,
    syncLocation: syncLocationReducer,
    reloadApp: reloadAppReducer,

  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
