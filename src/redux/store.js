import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import inventoryReducer from './slices/inventorySlice';
import salesReducer from './slices/salesSlice';
import customerReducer from './slices/customerSlice';
import userReducer from './slices/userSlice';
import businessReducer from './slices/businessSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        products: productReducer,
        inventory: inventoryReducer,
        sales: salesReducer,
        customers: customerReducer,
        users: userReducer,
        business: businessReducer,
    },
});
