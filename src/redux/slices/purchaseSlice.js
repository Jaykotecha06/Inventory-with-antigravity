import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, push, child, set, remove } from 'firebase/database';
import { db } from '../../services/firebase';

export const fetchPurchases = createAsyncThunk('purchases/fetchPurchases', async (businessId, { rejectWithValue }) => {
    try {
        const purchasesRef = ref(db, 'purchases');
        const snapshot = await get(purchasesRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(p => p.businessId === businessId);
        }
        return [];
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const createPurchase = createAsyncThunk('purchases/createPurchase', async (purchaseData, { rejectWithValue }) => {
    try {
        const newRef = push(child(ref(db), 'purchases'));
        const purchase = { ...purchaseData, createdAt: Date.now() };
        await set(newRef, purchase);

        // Increase stock for each item purchased
        for (const item of purchaseData.items) {
            const productRef = ref(db, `products/${item.productId}`);
            const productSnap = await get(productRef);
            if (productSnap.exists()) {
                const product = productSnap.val();
                const newStock = (Number(product.stock) || 0) + Number(item.quantity);
                await set(ref(db, `products/${item.productId}/stock`), newStock);
            }
        }

        return { id: newRef.key, ...purchase };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const deletePurchase = createAsyncThunk('purchases/deletePurchase', async (purchase, { rejectWithValue }) => {
    try {
        // Decrease stock back (reverse the purchase)
        for (const item of purchase.items) {
            const productRef = ref(db, `products/${item.productId}`);
            const productSnap = await get(productRef);
            if (productSnap.exists()) {
                const product = productSnap.val();
                const newStock = Math.max(0, (Number(product.stock) || 0) - Number(item.quantity));
                await set(ref(db, `products/${item.productId}/stock`), newStock);
            }
        }
        await remove(ref(db, `purchases/${purchase.id}`));
        return purchase.id;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const updatePurchase = createAsyncThunk('purchases/updatePurchase', async ({ id, oldPurchase, newPurchaseData }, { rejectWithValue }) => {
    try {
        // 1. Reverse old stock additions
        for (const item of oldPurchase.items) {
            const productRef = ref(db, `products/${item.productId}`);
            const productSnap = await get(productRef);
            if (productSnap.exists()) {
                const product = productSnap.val();
                const newStock = Math.max(0, (Number(product.stock) || 0) - Number(item.quantity));
                await set(ref(db, `products/${item.productId}/stock`), newStock);
            }
        }

        // 2. Update purchase record
        const updatedPurchase = { ...newPurchaseData, updatedAt: Date.now() };
        await set(ref(db, `purchases/${id}`), updatedPurchase);

        // 3. Apply new stock additions
        for (const item of newPurchaseData.items) {
            const productRef = ref(db, `products/${item.productId}`);
            const productSnap = await get(productRef);
            if (productSnap.exists()) {
                const product = productSnap.val();
                const newStock = (Number(product.stock) || 0) + Number(item.quantity);
                await set(ref(db, `products/${item.productId}/stock`), newStock);
            }
        }

        return { id, ...updatedPurchase };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const purchaseSlice = createSlice({
    name: 'purchases',
    initialState: { items: [], loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPurchases.pending, (state) => { state.loading = true; })
            .addCase(fetchPurchases.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchPurchases.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createPurchase.fulfilled, (state, action) => { state.items.push(action.payload); })
            .addCase(deletePurchase.fulfilled, (state, action) => { state.items = state.items.filter(p => p.id !== action.payload); })
            .addCase(updatePurchase.fulfilled, (state, action) => {
                const index = state.items.findIndex(p => p.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            });
    },
});

export default purchaseSlice.reducer;
