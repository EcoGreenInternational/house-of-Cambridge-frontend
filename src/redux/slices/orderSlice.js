import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';

const apiErr = (err) => err.response?.data?.message || err.message || 'Something went wrong';

export const createOrder = createAsyncThunk('orders/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/orders', data);
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

export const fetchMyOrders = createAsyncThunk(
  'orders/myOrders',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/orders/my-orders');
      return res.data; 
    } catch (err) {
      return rejectWithValue(apiErr(err));
    }
  }
);

export const fetchOrder = createAsyncThunk('orders/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

// Re-fetch without the page spinner, used while waiting for a payment callback
export const refreshOrder = createAsyncThunk('orders/refreshOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: { 
    orders: [], 
    order: null, 
    loading: false, 
    error: null 
  },
  reducers: {
    clearOrderError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
     
      .addCase(fetchMyOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = Array.isArray(action.payload.orders) ? action.payload.orders : [];
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.orders = [];
      })

  
      .addCase(fetchOrder.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload.order || action.payload;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(refreshOrder.fulfilled, (state, action) => {
        state.order = action.payload.order || action.payload;
      });
  },
});

export const { clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;