import { createSlice } from '@reduxjs/toolkit';
import { Appearance } from 'react-native';

interface ThemeState {
  mode: 'light' | 'dark';
  langcode: 'en' | 'hi' | 'gu'
}

const initialState: ThemeState = {
  mode: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  langcode: 'en'
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
    },
    setLang: (state, action) => {
      state.langcode = action.payload;
    },
  },
});

export const { toggleTheme, setTheme, setLang } = themeSlice.actions;
export default themeSlice.reducer;
