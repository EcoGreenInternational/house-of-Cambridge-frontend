import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../api/axiosInstance.js'; 

const API_URL = '/admin/invoices';

export const fetchInvoices = createAsyncThunk('invoice/fetchInvoices', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch invoices');
  }
});

export const createNewInvoice = createAsyncThunk('invoice/createNewInvoice', async (invoiceData, { rejectWithValue }) => {
  try {
    const response = await axios.post(API_URL, invoiceData);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create invoice');
  }
});

export const updateInvoice = createAsyncThunk('invoice/updateInvoice', async ({ id, invoiceData }, { rejectWithValue }) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, invoiceData);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update invoice');
  }
});

export const deleteInvoice = createAsyncThunk('invoice/deleteInvoice', async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete invoice');
  }
});

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState: { invoices: [], total: 0, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => { state.loading = true; })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewInvoice.pending, (state) => { state.loading = true; })
      .addCase(createNewInvoice.fulfilled, (state) => { state.loading = false; })
      .addCase(createNewInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateInvoice.pending, (state) => { state.loading = true; })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.invoices.findIndex((inv) => inv._id === action.payload.invoice._id);
        if (index !== -1) {
          state.invoices[index] = action.payload.invoice;
        }
      })
      .addCase(updateInvoice.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.invoices = state.invoices.filter((inv) => inv._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export default invoiceSlice.reducer;