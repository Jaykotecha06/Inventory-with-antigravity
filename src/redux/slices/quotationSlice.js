import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, push, child, set, remove } from 'firebase/database';
import { db } from '../../services/firebase';

export const fetchQuotations = createAsyncThunk('quotations/fetchQuotations', async (businessId, { rejectWithValue }) => {
    try {
        const quotationsRef = ref(db, 'quotations');
        const snapshot = await get(quotationsRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(q => q.businessId === businessId);
        }
        return [];
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const createQuotation = createAsyncThunk('quotations/createQuotation', async (quotationData, { rejectWithValue }) => {
    try {
        const newRef = push(child(ref(db), 'quotations'));
        // Quotations do NOT affect stock
        const quotation = { ...quotationData, status: quotationData.status || 'Draft', createdAt: Date.now() };
        await set(newRef, quotation);
        return { id: newRef.key, ...quotation };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const deleteQuotation = createAsyncThunk('quotations/deleteQuotation', async (id, { rejectWithValue }) => {
    try {
        await remove(ref(db, `quotations/${id}`));
        return id;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const updateQuotation = createAsyncThunk('quotations/updateQuotation', async ({ id, quotationData }, { rejectWithValue }) => {
    try {
        const updatedQuotation = { ...quotationData, updatedAt: Date.now() };
        await set(ref(db, `quotations/${id}`), updatedQuotation);
        return { id, ...updatedQuotation };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

// Marks quotation as Converted — the actual sale creation is handled in CreateQuotation page
export const markQuotationConverted = createAsyncThunk('quotations/markConverted', async ({ id, saleId }, { rejectWithValue }) => {
    try {
        await set(ref(db, `quotations/${id}/status`), 'Converted');
        await set(ref(db, `quotations/${id}/convertedSaleId`), saleId);
        await set(ref(db, `quotations/${id}/convertedAt`), Date.now());
        return { id, status: 'Converted', convertedSaleId: saleId };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const quotationSlice = createSlice({
    name: 'quotations',
    initialState: { items: [], loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchQuotations.pending, (state) => { state.loading = true; })
            .addCase(fetchQuotations.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchQuotations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createQuotation.fulfilled, (state, action) => { state.items.push(action.payload); })
            .addCase(deleteQuotation.fulfilled, (state, action) => { state.items = state.items.filter(q => q.id !== action.payload); })
            .addCase(updateQuotation.fulfilled, (state, action) => {
                const index = state.items.findIndex(q => q.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(markQuotationConverted.fulfilled, (state, action) => {
                const index = state.items.findIndex(q => q.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = { ...state.items[index], ...action.payload };
                }
            });
    },
});

export default quotationSlice.reducer;
