import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, push, child, set } from 'firebase/database';
import { db } from '../../services/firebase';

export const fetchInventoryLogs = createAsyncThunk('inventory/fetchLogs', async (businessId, { rejectWithValue }) => {
    try {
        const logsRef = ref(db, 'inventory');
        const snapshot = await get(logsRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(log => log.businessId === businessId);
        }
        return [];
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const recordStockMovement = createAsyncThunk('inventory/recordMovement', async (stockData, { rejectWithValue }) => {
    try {
        const logRef = push(child(ref(db), 'inventory'));
        const movementLog = { ...stockData, date: Date.now() };
        await set(logRef, movementLog);

        const productRef = ref(db, `products/${stockData.productId}`);
        const productSnap = await get(productRef);
        if (productSnap.exists()) {
            const product = productSnap.val();
            let newStock = Number(product.stock || 0);
            if (stockData.type === 'IN') {
                newStock += Number(stockData.quantity);
            } else if (stockData.type === 'OUT') {
                newStock -= Number(stockData.quantity);
            }
            await set(ref(db, `products/${stockData.productId}/stock`), newStock);
        }

        return { id: logRef.key, ...movementLog };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const inventorySlice = createSlice({
    name: 'inventory',
    initialState: { logs: [], loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchInventoryLogs.pending, (state) => { state.loading = true; })
            .addCase(fetchInventoryLogs.fulfilled, (state, action) => { state.loading = false; state.logs = action.payload; })
            .addCase(fetchInventoryLogs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(recordStockMovement.fulfilled, (state, action) => { state.logs.push(action.payload); });
    }
});
export default inventorySlice.reducer;
