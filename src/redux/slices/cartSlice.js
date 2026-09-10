import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';
import { createOrder } from './orderSlice';

const apiErr = (err) => err.response?.data?.message || err.response?.data?.error || err.message;

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/cart');
      return res.data;
    } catch (err) { return rejectWithValue(apiErr(err)); }
  }
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ productId, quantity = 1, selectedVariant = null }, { rejectWithValue }) => {
    try {
      const res = await api.post('/cart/add', { productId, quantity, selectedVariant });
      return res.data;
    } catch (err) { return rejectWithValue(apiErr(err)); }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/update',
  async ({ productId, quantity, itemId = null, variantName = null }, { rejectWithValue }) => {
    try {
      const res = await api.put('/cart/update', { productId, quantity, itemId, variantName });
      return res.data;
    } catch (err) { return rejectWithValue(apiErr(err)); }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async (payload, { rejectWithValue }) => {
    try {
      const productId = typeof payload === 'object' ? payload.productId : payload;
      const itemId = typeof payload === 'object' ? payload.itemId : undefined;
      const variantName = typeof payload === 'object' ? payload.variantName : undefined;
      const params = {};
      if (itemId) params.itemId = itemId;
      if (variantName) params.variantName = variantName;

      const res = await api.delete(`/cart/item/${productId}`, { params });
      return res.data;
    } catch (err) { return rejectWithValue(apiErr(err)); }
  }
);

export const applyCoupon = createAsyncThunk(
  'cart/coupon',
  async (code, { rejectWithValue }) => {
    try {
      const res = await api.post('/cart/coupon', { code });
      return res.data;
    } catch (err) { return rejectWithValue(apiErr(err)); }
  }
);

export const clearCartAsync = createAsyncThunk(
  'cart/clearAsync',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.delete('/cart');
      return res.data;
    } catch (err) { return rejectWithValue(apiErr(err)); }
  }
);

const decodeEntity = (str) => {
  if (typeof str !== 'string') return str;
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&quot;': '"', '&#39;': "'", '&#x27;': "'",
    '&#x2F;': '/', '&#x2f;': '/'
  };
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;|&#x2[fF];|&#(\d+);|&#x([0-9a-fA-F]+);/g, (match, dec, hex) => {
    if (entities[match]) return entities[match];
    if (dec) return String.fromCharCode(dec);
    if (hex) return String.fromCharCode(parseInt(hex, 16));
    return match;
  });
};

const deepDecode = (obj) => {
  if (typeof obj === 'string') return decodeEntity(obj);
  if (Array.isArray(obj)) return obj.map(deepDecode);
  if (obj !== null && typeof obj === 'object') {
    const decoded = {};
    for (const key in obj) {
      decoded[key] = deepDecode(obj[key]);
    }
    return decoded;
  }
  return obj;
};

const EMPTY_CART = { items: [], discount: 0, coupon: null };

const setCart     = (state, action) => { state.loading = false; state.cart  = deepDecode(action.payload.cart); };
const setPending  = (state)         => { state.loading = true;  state.error = null; };
const setRejected = (state, action) => { state.loading = false; state.error = action.payload; };

const cartSlice = createSlice({
  name: 'cart',
  initialState: { cart: EMPTY_CART, loading: false, error: null },
  reducers: {
    clearCartError: (state) => { state.error = null; },
    clearCart:      (state) => { state.cart  = EMPTY_CART; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending,       setPending)  .addCase(fetchCart.fulfilled,       setCart)  .addCase(fetchCart.rejected,       setRejected)
      .addCase(addToCart.pending,       setPending)  .addCase(addToCart.fulfilled,       setCart)  .addCase(addToCart.rejected,       setRejected)
      .addCase(updateCartItem.pending,  setPending)  .addCase(updateCartItem.fulfilled,  setCart)  .addCase(updateCartItem.rejected,  setRejected)
      .addCase(removeFromCart.pending,  setPending)  .addCase(removeFromCart.fulfilled,  setCart)  .addCase(removeFromCart.rejected,  setRejected)
      .addCase(applyCoupon.fulfilled,   setCart)     .addCase(applyCoupon.rejected,      setRejected)
      .addCase(clearCartAsync.fulfilled, setCart)
      .addCase(createOrder.fulfilled,   (state) => { state.cart = EMPTY_CART; });
  },
});

export const { clearCartError, clearCart } = cartSlice.actions;
export default cartSlice.reducer;