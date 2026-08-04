import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';

const handle = (err) =>
  (typeof err.response?.data?.message === 'string'
    ? err.response.data.message
    : typeof err.message === 'string'
      ? err.message
      : 'Something went wrong'
  ).replace(/[<>]/g, '').slice(0, 500);



export const fetchDashboardStats = createAsyncThunk('admin/dashboardStats', async (_, { rejectWithValue }) => {
  try { return (await api.get('/admin/dashboard')).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminUsers = createAsyncThunk('admin/fetchUsers', async (params, { rejectWithValue }) => {
  try { return (await api.get('/admin/users', { params })).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminUser = createAsyncThunk('admin/fetchUser', async (id, { rejectWithValue }) => {
  try { return (await api.get(`/admin/users/${encodeURIComponent(id)}`)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const updateAdminUser = createAsyncThunk('admin/updateUser', async ({ id, data }, { rejectWithValue }) => {
  try { return (await api.put(`/admin/users/${encodeURIComponent(id)}`, data)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const deleteAdminUser = createAsyncThunk('admin/deleteUser', async (id, { rejectWithValue }) => {
  try { await api.delete(`/admin/users/${encodeURIComponent(id)}`); return id; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const createAdmin = createAsyncThunk('admin/createAdmin', async (data, { rejectWithValue }) => {
  try { return (await api.post('/admin/users/create-admin', data)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminOrders = createAsyncThunk('admin/fetchOrders', async (params = {}, { rejectWithValue }) => {
  try { return (await api.get('/admin/orders', { params })).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminOrder = createAsyncThunk('admin/fetchOrder', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/admin/orders/${encodeURIComponent(id)}`);
    return res.data.order ?? res.data;
  }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const updateAdminOrderStatus = createAsyncThunk('admin/updateOrderStatus', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/admin/orders/${encodeURIComponent(id)}/status`, data);
    return res.data.order ?? res.data;
  }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminProducts = createAsyncThunk('admin/fetchProducts', async (params, { rejectWithValue }) => {
  try { return (await api.get('/admin/products', { params })).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const createAdminProduct = createAsyncThunk('admin/createProduct', async (formData, { rejectWithValue }) => {
  try { return (await api.post('/admin/products', formData)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const updateAdminProduct = createAsyncThunk('admin/updateProduct', async ({ id, formData }, { rejectWithValue }) => {
  try { return (await api.put(`/admin/products/${encodeURIComponent(id)}`, formData)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const deleteAdminProduct = createAsyncThunk('admin/deleteProduct', async (id, { rejectWithValue }) => {
  try { await api.delete(`/admin/products/${encodeURIComponent(id)}`); return id; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminFlashSales = createAsyncThunk('admin/fetchFlashSales', async (_, { rejectWithValue }) => {
  try { return (await api.get('/admin/products', { params: { isFlashSale: true, limit: 200 } })).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const updateFlashSale = createAsyncThunk('admin/updateFlashSale', async ({ id, data }, { rejectWithValue }) => {
  try { return (await api.patch(`/admin/products/${encodeURIComponent(id)}/flash-sale`, data)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminCategories = createAsyncThunk('admin/fetchCategories', async (_, { rejectWithValue }) => {
  try { return (await api.get('/admin/categories')).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminCategory = createAsyncThunk('admin/fetchCategory', async (id, { rejectWithValue }) => {
  try { return (await api.get(`/admin/categories/${encodeURIComponent(id)}`)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const createAdminCategory = createAsyncThunk('admin/createCategory', async (formData, { rejectWithValue }) => {
  try { return (await api.post('/admin/categories', formData)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const updateAdminCategory = createAsyncThunk('admin/updateCategory', async ({ id, formData }, { rejectWithValue }) => {
  try { return (await api.put(`/admin/categories/${encodeURIComponent(id)}`, formData)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const deleteAdminCategory = createAsyncThunk('admin/deleteCategory', async (id, { rejectWithValue }) => {
  try { await api.delete(`/admin/categories/${encodeURIComponent(id)}`); return id; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminBrands = createAsyncThunk('admin/fetchBrands', async (_, { rejectWithValue }) => {
  try { return (await api.get('/admin/brands')).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const createAdminBrand = createAsyncThunk('admin/createBrand', async (formData, { rejectWithValue }) => {
  try { return (await api.post('/admin/brands', formData)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const updateAdminBrand = createAsyncThunk('admin/updateBrand', async ({ id, formData }, { rejectWithValue }) => {
  try { return (await api.put(`/admin/brands/${encodeURIComponent(id)}`, formData)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const deleteAdminBrand = createAsyncThunk('admin/deleteBrand', async (id, { rejectWithValue }) => {
  try { await api.delete(`/admin/brands/${encodeURIComponent(id)}`); return id; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminCoupons = createAsyncThunk('admin/fetchCoupons', async (params, { rejectWithValue }) => {
  try { return (await api.get('/admin/coupons', { params })).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const createAdminCoupon = createAsyncThunk('admin/createCoupon', async (data, { rejectWithValue }) => {
  try { return (await api.post('/admin/coupons', data)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const updateAdminCoupon = createAsyncThunk('admin/updateCoupon', async ({ id, data }, { rejectWithValue }) => {
  try { return (await api.put(`/admin/coupons/${encodeURIComponent(id)}`, data)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const deleteAdminCoupon = createAsyncThunk('admin/deleteCoupon', async (id, { rejectWithValue }) => {
  try { await api.delete(`/admin/coupons/${encodeURIComponent(id)}`); return id; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminReviews = createAsyncThunk('admin/fetchReviews', async (params, { rejectWithValue }) => {
  try { return (await api.get('/admin/reviews', { params })).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const approveReview = createAsyncThunk('admin/approveReview', async ({ id, adminNote }, { rejectWithValue }) => {
  try {
    const safeNote = typeof adminNote === 'string' ? adminNote.slice(0, 1000) : undefined;
    return (await api.put(`/admin/reviews/${encodeURIComponent(id)}/approve`, { adminNote: safeNote })).data;
  }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const rejectReview = createAsyncThunk('admin/rejectReview', async ({ id, adminNote }, { rejectWithValue }) => {
  try {
    const safeNote = typeof adminNote === 'string' ? adminNote.slice(0, 1000) : undefined;
    return (await api.put(`/admin/reviews/${encodeURIComponent(id)}/reject`, { adminNote: safeNote })).data;
  }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const deleteAdminReview = createAsyncThunk('admin/deleteReview', async (id, { rejectWithValue }) => {
  try { await api.delete(`/admin/reviews/${encodeURIComponent(id)}`); return id; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminReturns = createAsyncThunk('admin/fetchReturns', async (params, { rejectWithValue }) => {
  try { return (await api.get('/admin/returns', { params })).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const fetchAdminReturn = createAsyncThunk('admin/fetchReturn', async (id, { rejectWithValue }) => {
  try { return (await api.get(`/admin/returns/${encodeURIComponent(id)}`)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const updateAdminReturnStatus = createAsyncThunk('admin/updateReturnStatus', async ({ id, data }, { rejectWithValue }) => {
  try { return (await api.put(`/admin/returns/${encodeURIComponent(id)}/status`, data)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});

export const broadcastNotification = createAsyncThunk('admin/broadcast', async (data, { rejectWithValue }) => {
  try { return (await api.post('/admin/notifications/broadcast', data)).data; }
  catch (err) { return rejectWithValue(handle(err)); }
});



const pending  = (state) => { state.loading = true;  state.error = null; };
const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    loading: false,
    error: null,
    stats: null,
    recentOrders: [],
    topProducts: [],
    users: [],
    usersTotal: 0,
    selectedUser: null,
    orders: [],
    ordersTotal: 0,
    selectedOrder: null,
    products: [],
    productsTotal: 0,
    flashSales: [],
    categories: [],
    brands: [],
    brandsTotal: 0,
    coupons: [],
    couponsTotal: 0,
    reviews: [],
    reviewsTotal: 0,
    returns: [],
    returnsTotal: 0,
    selectedReturn: null,
  },
  reducers: {
    clearAdminError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, pending)
      .addCase(fetchDashboardStats.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.stats = payload.stats ?? payload ?? null;
        state.recentOrders = Array.isArray(payload.recentOrders) ? payload.recentOrders : [];
        state.topProducts = Array.isArray(payload.topProducts) ? payload.topProducts : [];
      })
      .addCase(fetchDashboardStats.rejected, rejected)

      .addCase(fetchAdminUsers.pending, pending)
      .addCase(fetchAdminUsers.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.users = Array.isArray(payload.users) ? payload.users : [];
        state.usersTotal = Number.isFinite(payload.total) ? payload.total : 0;
      })
      .addCase(fetchAdminUsers.rejected, rejected)
      .addCase(fetchAdminUser.fulfilled, (state, { payload }) => {
        state.selectedUser = payload ?? null;
      })
      .addCase(updateAdminUser.pending, pending)
      .addCase(updateAdminUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.users.findIndex((u) => u._id === payload.user?._id);
        if (idx !== -1 && payload.user) state.users[idx] = payload.user;
      })
      .addCase(updateAdminUser.rejected, rejected)
      .addCase(deleteAdminUser.pending, pending)
      .addCase(deleteAdminUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.users = state.users.filter((u) => u._id !== payload);
        state.usersTotal = Math.max(0, state.usersTotal - 1);
      })
      .addCase(deleteAdminUser.rejected, rejected)
      .addCase(createAdmin.pending, pending)
      .addCase(createAdmin.fulfilled, (state) => { state.loading = false; })
      .addCase(createAdmin.rejected, rejected)

      .addCase(fetchAdminOrders.pending, pending)
      .addCase(fetchAdminOrders.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.orders = Array.isArray(payload.orders) ? payload.orders : [];
        state.ordersTotal = Number.isFinite(payload.total) ? payload.total : (payload.count ?? 0);
      })
      .addCase(fetchAdminOrders.rejected, rejected)
      .addCase(fetchAdminOrder.pending, pending)
      .addCase(fetchAdminOrder.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.selectedOrder = payload ?? null;
      })
      .addCase(fetchAdminOrder.rejected, rejected)
      .addCase(updateAdminOrderStatus.pending, pending)
      .addCase(updateAdminOrderStatus.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.orders.findIndex((o) => o._id === payload?._id);
        if (idx !== -1 && payload) state.orders[idx] = payload;
        state.selectedOrder = payload ?? null;
      })
      .addCase(updateAdminOrderStatus.rejected, rejected)

      .addCase(fetchAdminProducts.pending, pending)
      .addCase(fetchAdminProducts.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.products = Array.isArray(payload.products) ? payload.products : [];
        state.productsTotal = Number.isFinite(payload.total) ? payload.total : 0;
      })
      .addCase(fetchAdminProducts.rejected, rejected)
      .addCase(createAdminProduct.pending, pending)
      .addCase(createAdminProduct.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.product) {
          state.products.unshift(payload.product);
          state.productsTotal += 1;
        }
      })
      .addCase(createAdminProduct.rejected, rejected)
      .addCase(updateAdminProduct.pending, pending)
      .addCase(updateAdminProduct.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.products.findIndex((p) => p._id === payload.product?._id);
        if (idx !== -1 && payload.product) state.products[idx] = payload.product;
      })
      .addCase(updateAdminProduct.rejected, rejected)
      .addCase(deleteAdminProduct.pending, pending)
      .addCase(deleteAdminProduct.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.products = state.products.filter((p) => p._id !== payload);
        state.productsTotal = Math.max(0, state.productsTotal - 1);
      })
      .addCase(deleteAdminProduct.rejected, rejected)

      .addCase(fetchAdminFlashSales.pending, pending)
      .addCase(fetchAdminFlashSales.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.flashSales = Array.isArray(payload.products) ? payload.products : [];
      })
      .addCase(fetchAdminFlashSales.rejected, rejected)
      .addCase(updateFlashSale.pending, pending)
      .addCase(updateFlashSale.fulfilled, (state, { payload }) => {
        state.loading = false;
        const product = payload.product;
        if (!product) return;
        const idx = state.flashSales.findIndex((p) => p._id === product._id);
        if (product.isFlashSale) {
          if (idx !== -1) state.flashSales[idx] = product;
          else state.flashSales.unshift(product);
        } else {
          state.flashSales = state.flashSales.filter((p) => p._id !== product._id);
        }
        const pidx = state.products.findIndex((p) => p._id === product._id);
        if (pidx !== -1) state.products[pidx] = product;
      })
      .addCase(updateFlashSale.rejected, rejected)

      .addCase(fetchAdminCategories.pending, pending)
      .addCase(fetchAdminCategories.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.categories = Array.isArray(payload.categories) ? payload.categories : [];
      })
      .addCase(fetchAdminCategories.rejected, rejected)
      .addCase(createAdminCategory.pending, pending)
      .addCase(createAdminCategory.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.category) state.categories.push(payload.category);
      })
      .addCase(createAdminCategory.rejected, rejected)
      .addCase(updateAdminCategory.pending, pending)
      .addCase(updateAdminCategory.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.categories.findIndex((c) => c._id === payload.category?._id);
        if (idx !== -1 && payload.category) state.categories[idx] = payload.category;
      })
      .addCase(updateAdminCategory.rejected, rejected)
      .addCase(deleteAdminCategory.pending, pending)
      .addCase(deleteAdminCategory.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.categories = state.categories.filter((c) => c._id !== payload);
      })
      .addCase(deleteAdminCategory.rejected, rejected)

      .addCase(fetchAdminBrands.pending, pending)
      .addCase(fetchAdminBrands.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.brands = Array.isArray(payload.brands) ? payload.brands : [];
        state.brandsTotal = Number.isFinite(payload.total) ? payload.total : 0;
      })
      .addCase(fetchAdminBrands.rejected, rejected)
      .addCase(createAdminBrand.pending, pending)
      .addCase(createAdminBrand.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.brand) {
          state.brands.unshift(payload.brand);
          state.brandsTotal += 1;
        }
      })
      .addCase(createAdminBrand.rejected, rejected)
      .addCase(updateAdminBrand.pending, pending)
      .addCase(updateAdminBrand.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.brands.findIndex((b) => b._id === payload.brand?._id);
        if (idx !== -1 && payload.brand) state.brands[idx] = payload.brand;
      })
      .addCase(updateAdminBrand.rejected, rejected)
      .addCase(deleteAdminBrand.pending, pending)
      .addCase(deleteAdminBrand.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.brands = state.brands.filter((b) => b._id !== payload);
        state.brandsTotal = Math.max(0, state.brandsTotal - 1);
      })
      .addCase(deleteAdminBrand.rejected, rejected)

      .addCase(fetchAdminCoupons.pending, pending)
      .addCase(fetchAdminCoupons.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.coupons = Array.isArray(payload.coupons) ? payload.coupons : [];
        state.couponsTotal = Number.isFinite(payload.total) ? payload.total : 0;
      })
      .addCase(fetchAdminCoupons.rejected, rejected)
      .addCase(createAdminCoupon.pending, pending)
      .addCase(createAdminCoupon.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.coupon) state.coupons.unshift(payload.coupon);
      })
      .addCase(createAdminCoupon.rejected, rejected)
      .addCase(updateAdminCoupon.pending, pending)
      .addCase(updateAdminCoupon.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.coupons.findIndex((c) => c._id === payload.coupon?._id);
        if (idx !== -1 && payload.coupon) state.coupons[idx] = payload.coupon;
      })
      .addCase(updateAdminCoupon.rejected, rejected)
      .addCase(deleteAdminCoupon.pending, pending)
      .addCase(deleteAdminCoupon.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.coupons = state.coupons.filter((c) => c._id !== payload);
        state.couponsTotal = Math.max(0, state.couponsTotal - 1);
      })
      .addCase(deleteAdminCoupon.rejected, rejected)

      .addCase(fetchAdminReviews.pending, pending)
      .addCase(fetchAdminReviews.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.reviews = Array.isArray(payload.reviews) ? payload.reviews : [];
        state.reviewsTotal = Number.isFinite(payload.total) ? payload.total : 0;
      })
      .addCase(fetchAdminReviews.rejected, rejected)
      .addCase(approveReview.pending, pending)
      .addCase(approveReview.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.reviews.findIndex((r) => r._id === payload.review?._id);
        if (idx !== -1 && payload.review) state.reviews[idx] = payload.review;
      })
      .addCase(approveReview.rejected, rejected)
      .addCase(rejectReview.pending, pending)
      .addCase(rejectReview.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.reviews.findIndex((r) => r._id === payload.review?._id);
        if (idx !== -1 && payload.review) state.reviews[idx] = payload.review;
      })
      .addCase(rejectReview.rejected, rejected)
      .addCase(deleteAdminReview.pending, pending)
      .addCase(deleteAdminReview.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.reviews = state.reviews.filter((r) => r._id !== payload);
        state.reviewsTotal = Math.max(0, state.reviewsTotal - 1);
      })
      .addCase(deleteAdminReview.rejected, rejected)

      .addCase(fetchAdminReturns.pending, pending)
      .addCase(fetchAdminReturns.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.returns = Array.isArray(payload.returns) ? payload.returns : [];
        state.returnsTotal = Number.isFinite(payload.total) ? payload.total : 0;
      })
      .addCase(fetchAdminReturns.rejected, rejected)
      .addCase(fetchAdminReturn.fulfilled, (state, { payload }) => {
        state.selectedReturn = payload.return ?? null;
      })
      .addCase(updateAdminReturnStatus.pending, pending)
      .addCase(updateAdminReturnStatus.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.returns.findIndex((r) => r._id === payload.return?._id);
        if (idx !== -1 && payload.return) state.returns[idx] = payload.return;
        state.selectedReturn = payload.return ?? null;
      })
      .addCase(updateAdminReturnStatus.rejected, rejected)

      .addCase(broadcastNotification.pending, pending)
      .addCase(broadcastNotification.fulfilled, (state) => { state.loading = false; })
      .addCase(broadcastNotification.rejected, rejected);
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;