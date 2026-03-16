import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, push, child, set } from 'firebase/database';
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

const salesSlice = createSlice({
    name: 'sales',
    initialState: { items: [], loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSales.pending, (state) => { state.loading = true; })
            .addCase(fetchSales.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchSales.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createSale.fulfilled, (state, action) => { state.items.push(action.payload); });
    },
});
export default salesSlice.reducer;
