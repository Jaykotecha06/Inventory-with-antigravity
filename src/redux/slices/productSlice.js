import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, set, remove, push, child } from 'firebase/database';
import { db } from '../../services/firebase';

export const fetchProducts = createAsyncThunk('products/fetch', async (_, { rejectWithValue }) => {
    try {
        const productsRef = ref(db, 'products');
        const snapshot = await get(productsRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.keys(data).map(key => ({ id: key, ...data[key] }));
        }
        return [];
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const addProduct = createAsyncThunk('products/add', async (productData, { rejectWithValue }) => {
    try {
        const newProductRef = push(child(ref(db), 'products'));
        const newProduct = { ...productData, createdAt: Date.now() };
        await set(newProductRef, newProduct);
        return { id: newProductRef.key, ...newProduct };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
        await set(ref(db, `products/${id}`), updateData);
        return { id, ...updateData };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
    try {
        await remove(ref(db, `products/${id}`));
        return id;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const productSlice = createSlice({
    name: 'products',
    initialState: {
        items: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => { state.loading = true; })
            .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(addProduct.fulfilled, (state, action) => { state.items.push(action.payload); })
            .addCase(updateProduct.fulfilled, (state, action) => {
                const index = state.items.findIndex(p => p.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.items = state.items.filter(p => p.id !== action.payload);
            });
    },
});

export default productSlice.reducer;
