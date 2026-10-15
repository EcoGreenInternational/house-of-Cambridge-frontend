import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';

const apiErr = (err) =>
  (typeof err.response?.data?.message === 'string'
    ? err.response.data.message
    : typeof err.message === 'string'
      ? err.message
      : 'Something went wrong'
  ).replace(/[<>]/g, '').slice(0, 500);

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await api.get('/products', { params });
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

export const fetchProduct = createAsyncThunk('products/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/products/${encodeURIComponent(id)}`);
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

export const fetchFlashSaleProducts = createAsyncThunk('products/flashSale', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/flash-sale');
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

export const fetchFeaturedProducts = createAsyncThunk('products/featured', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/featured');
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

export const fetchCategories = createAsyncThunk('products/categories', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/categories');
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

export const fetchPreOwnedCategories = createAsyncThunk('products/preOwnedCategories', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/categories');
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

export const fetchNewArrivalCategories = createAsyncThunk('products/newArrivalCategories', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/categories');
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

export const fetchPopularProducts = createAsyncThunk('products/popular', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/popular');
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

export const fetchHomeNewArrivals = createAsyncThunk('products/homeNewArrivals', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/new-arrivals');
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

export const createReview = createAsyncThunk('products/createReview', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/products/${encodeURIComponent(id)}/reviews`, data);
    return res.data;
  } catch (err) { return rejectWithValue(apiErr(err)); }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    products: [],
    product: null,
    flashSale: [],
    flashSaleVisible: true,
    flashSalePosterUrl: '',
    featured: [],
    popular: [],
    homeNewArrivals: [],
    categories: [],
    preOwnedCategories: [],
    newArrivalCategories: [],
    loading: false,
    categoriesLoading: false,
    error: null,
    total: 0,
    resPerPage: 12,
  },
  reducers: {
    clearProductError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = Array.isArray(action.payload.products) ? action.payload.products : [];
        state.total = Number.isFinite(action.payload.total) ? action.payload.total : 0;
        state.resPerPage = Number.isFinite(action.payload.resPerPage) ? action.payload.resPerPage : 12;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload.product ?? null;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchFlashSaleProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFlashSaleProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.flashSaleVisible = action.payload.flashSaleVisible !== false && action.payload.flashSaleVisible !== 'false';
        state.flashSalePosterUrl = action.payload.flashSalePosterUrl || '';
        state.flashSale = Array.isArray(action.payload.products) ? action.payload.products : [];
      })
      .addCase(fetchFlashSaleProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featured = Array.isArray(action.payload.products) ? action.payload.products : [];
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(fetchPopularProducts.fulfilled, (state, action) => {
        state.popular = Array.isArray(action.payload.products) ? action.payload.products : [];
      })
      .addCase(fetchPopularProducts.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(fetchHomeNewArrivals.fulfilled, (state, action) => {
        state.homeNewArrivals = Array.isArray(action.payload.products) ? action.payload.products : [];
      })
      .addCase(fetchHomeNewArrivals.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(fetchCategories.pending, (state) => { state.categoriesLoading = true; })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = Array.isArray(action.payload.categories) ? action.payload.categories : [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchPreOwnedCategories.pending, (state) => { state.categoriesLoading = true; })
      .addCase(fetchPreOwnedCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.preOwnedCategories = Array.isArray(action.payload.categories) ? action.payload.categories : [];
      })
      .addCase(fetchPreOwnedCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchNewArrivalCategories.pending, (state) => { state.categoriesLoading = true; })
      .addCase(fetchNewArrivalCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.newArrivalCategories = Array.isArray(action.payload.categories) ? action.payload.categories : [];
      })
      .addCase(fetchNewArrivalCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProductError } = productSlice.actions;
export default productSlice.reducer;