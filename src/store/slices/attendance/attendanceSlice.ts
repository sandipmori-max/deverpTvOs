import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AttendanceResponse } from '../../../services/api';
import { AttendanceState } from './type';
import { getLastPunchInThunk, markAttendanceThunk } from './thunk';

const initialState: AttendanceState = {
  loading: false,
  error: null,
  response: null,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    resetAttendanceState: state => {
      state.loading = false;
      state.error = null;
      state.response = null;
    },
    setResponse : (state, action: any) => {
      state.response = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(markAttendanceThunk.pending, state => {
        state.loading = true;
        state.error = null;
        state.response = null;
      })
      .addCase(
        markAttendanceThunk.fulfilled,
        (state, action: PayloadAction<AttendanceResponse>) => {
          state.loading = false;
          state.response = action.payload;
        },
      )
      .addCase(markAttendanceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getLastPunchInThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLastPunchInThunk.fulfilled, (state, action: PayloadAction<AttendanceResponse>) => {
        state.loading = false;
        state.response = action.payload;
      })
      .addCase(getLastPunchInThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetAttendanceState , setResponse} = attendanceSlice.actions;
export default attendanceSlice.reducer;
