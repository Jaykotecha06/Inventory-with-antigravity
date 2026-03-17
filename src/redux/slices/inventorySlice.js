import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, push, child, set, remove } from 'firebase/database';
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

export const updateInventoryLog = createAsyncThunk('inventory/updateLog', async ({ id, oldLog, newLog }, { rejectWithValue }) => {
    try {
        // Reverse old movement
        const productRef = ref(db, `products/${oldLog.productId}`);
        const productSnap = await get(productRef);
        if (productSnap.exists()) {
            const product = productSnap.val();
            let stock = Number(product.stock || 0);

            // Revert old
            if (oldLog.type === 'IN') stock -= Number(oldLog.quantity);
            else stock += Number(oldLog.quantity);

            // Apply new
            if (newLog.type === 'IN') stock += Number(newLog.quantity);
            else stock -= Number(newLog.quantity);

            await set(ref(db, `products/${oldLog.productId}/stock`), stock);
        }

        await set(ref(db, `inventory/${id}`), { ...newLog, date: oldLog.date });
        return { id, ...newLog, date: oldLog.date };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const deleteInventoryLog = createAsyncThunk('inventory/deleteLog', async (log, { rejectWithValue }) => {
    try {
        const productRef = ref(db, `products/${log.productId}`);
        const productSnap = await get(productRef);
        if (productSnap.exists()) {
            const product = productSnap.val();
            let stock = Number(product.stock || 0);

            // Reverse the movement
            if (log.type === 'IN') stock -= Number(log.quantity);
            else stock += Number(log.quantity);

            await set(ref(db, `products/${log.productId}/stock`), stock);
        }

        await remove(ref(db, `inventory/${log.id}`));
        return log.id;
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
            .addCase(recordStockMovement.fulfilled, (state, action) => { state.logs.push(action.payload); })
            .addCase(updateInventoryLog.fulfilled, (state, action) => {
                const index = state.logs.findIndex(log => log.id === action.payload.id);
                if (index !== -1) state.logs[index] = action.payload;
            })
            .addCase(deleteInventoryLog.fulfilled, (state, action) => {
                state.logs = state.logs.filter(log => log.id !== action.payload);
            });
    }
});
export default inventorySlice.reducer;
