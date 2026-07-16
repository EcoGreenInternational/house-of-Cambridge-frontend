import { configureStore } from '@reduxjs/toolkit';
import authReducer    from './slices/authSlice';
import productReducer from './slices/productSlice';
import cartReducer    from './slices/cartSlice';
import orderReducer   from './slices/orderSlice';
import userReducer    from './slices/userSlice';
import adminReducer   from './slices/adminSlice';
import paymentReducer from './slices/paymentSlice';
import brandReducer   from './slices/brandSlice';
import invoiceReducer from './slices/invoiceSlice';

const store = configureStore({
  reducer: {
    auth:     authReducer,
    products: productReducer,
    cart:     cartReducer,
    orders:   orderReducer,
    payment:  paymentReducer,
    user:     userReducer,
    admin:    adminReducer,
    brands:   brandReducer,
    invoice: invoiceReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;