import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';

const apiErr = (err) => err.response?.data?.message || err.message;

export const createPayPalOrder = createAsyncThunk(
  'payment/paypalCreate',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/payments/paypal/create', data);
      return res.data;
    } catch (err) { return rejectWithValue(apiErr(err)); }
  }
);

export const capturePayPalOrder = createAsyncThunk(
  'payment/paypalCapture',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/payments/paypal/capture', data);
      return res.data;
    } catch (err) { return rejectWithValue(apiErr(err)); }
  }
);

export const initiateKoko = createAsyncThunk(
  'payment/kokoInitiate',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/payments/koko/initiate', data);
      return res.data;
    } catch (err) { return rejectWithValue(apiErr(err)); }
  }
);

const pending  = (state)         => { state.loading = true;  state.error = null; };
const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

const paymentSlice = createSlice({
  name: 'payment',
  initialState: { loading: false, error: null },
  reducers: {
    clearPaymentError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    [createPayPalOrder, capturePayPalOrder, initiateKoko].forEach((thunk) => {
      builder
        .addCase(thunk.pending,    pending)
        .addCase(thunk.fulfilled,  (state) => { state.loading = false; })
        .addCase(thunk.rejected,   rejected);
    });
  },
});

export const { clearPaymentError } = paymentSlice.actions;
export default paymentSlice.reducer;