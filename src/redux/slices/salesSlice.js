import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, push, child, set, remove } from 'firebase/database';
import { db } from '../../services/firebase';

export const fetchSales = createAsyncThunk('sales/fetchSales', async (businessId, { rejectWithValue }) => {
    try {
        const salesRef = ref(db, 'sales');
        const snapshot = await get(salesRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(sale => sale.businessId === businessId);
        }
        return [];
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const createSale = createAsyncThunk('sales/createSale', async (saleData, { rejectWithValue }) => {
    try {
        const newSaleRef = push(child(ref(db), 'sales'));
        const sale = { ...saleData, createdAt: Date.now() };
        await set(newSaleRef, sale);

        for (const item of saleData.items) {
            const productRef = ref(db, `products/${item.productId}`);
            const productSnap = await get(productRef);
            if (productSnap.exists()) {
                const product = productSnap.val();
                let newStock = Math.max(0, (Number(product.stock) || 0) - Number(item.quantity));
                await set(ref(db, `products/${item.productId}/stock`), newStock);
            }
        }

        return { id: newSaleRef.key, ...sale };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const deleteSale = createAsyncThunk('sales/deleteSale', async (sale, { rejectWithValue }) => {
    try {
        // Restore stock
        for (const item of sale.items) {
            const productRef = ref(db, `products/${item.productId}`);
            const productSnap = await get(productRef);
            if (productSnap.exists()) {
                const product = productSnap.val();
                let newStock = (Number(product.stock) || 0) + Number(item.quantity);
                await set(ref(db, `products/${item.productId}/stock`), newStock);
            }
        }
        await remove(ref(db, `sales/${sale.id}`));
        return sale.id;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const updateSale = createAsyncThunk('sales/updateSale', async ({ id, oldSale, newSaleData }, { rejectWithValue }) => {
    try {
        // 1. Restore old stock
        for (const item of oldSale.items) {
            const productRef = ref(db, `products/${item.productId}`);
            const productSnap = await get(productRef);
            if (productSnap.exists()) {
                const product = productSnap.val();
                let newStock = (Number(product.stock) || 0) + Number(item.quantity);
                await set(ref(db, `products/${item.productId}/stock`), newStock);
            }
        }

        // 2. Update sale in DB
        const saleRef = ref(db, `sales/${id}`);
        // Keep original createdAt if not provided
        const updatedSale = { ...newSaleData, updatedAt: Date.now() };
        await set(saleRef, updatedSale);

        // 3. Deduct new stock
        for (const item of newSaleData.items) {
            const productRef = ref(db, `products/${item.productId}`);
            const productSnap = await get(productRef);
            if (productSnap.exists()) {
                const product = productSnap.val();
                let newStock = Math.max(0, (Number(product.stock) || 0) - Number(item.quantity));
                await set(ref(db, `products/${item.productId}/stock`), newStock);
            }
        }

        return { id, ...updatedSale };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const salesSlice = createSlice({
    name: 'sales',
    initialState: { items: [], loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSales.pending, (state) => { state.loading = true; })
            .addCase(fetchSales.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchSales.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createSale.fulfilled, (state, action) => { state.items.push(action.payload); })
            .addCase(deleteSale.fulfilled, (state, action) => { state.items = state.items.filter(s => s.id !== action.payload); })
            .addCase(updateSale.fulfilled, (state, action) => {
                const index = state.items.findIndex(s => s.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            });
    },
});
export default salesSlice.reducer;
