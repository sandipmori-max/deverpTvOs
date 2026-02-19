import { createSlice } from '@reduxjs/toolkit';

const initialState: any = {
  reLoading: false,
};

const reloadAppSlice = createSlice({
  name: 'reloadApp',
  initialState,
  reducers: {
     setReloadApp  : state => {
      state.reLoading = !state.reLoading;
    },
  }, 
});

export const { setReloadApp } = reloadAppSlice.actions;
export default reloadAppSlice.reducer;
