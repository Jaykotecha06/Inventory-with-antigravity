import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, push, child, set, remove } from 'firebase/database';
import { db } from '../../services/firebase';

export const fetchCustomers = createAsyncThunk('customers/fetch', async (_, { rejectWithValue }) => {
    try {
        const customersRef = ref(db, 'customers');
        const snapshot = await get(customersRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.keys(data).map(key => ({ id: key, ...data[key] }));
        }
        return [];
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const addCustomer = createAsyncThunk('customers/add', async (customerData, { rejectWithValue }) => {
    try {
        const newCustomerRef = push(child(ref(db), 'customers'));
        const newCustomer = { ...customerData, createdAt: Date.now() };
        await set(newCustomerRef, newCustomer);
        return { id: newCustomerRef.key, ...newCustomer };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const updateCustomer = createAsyncThunk('customers/update', async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
        await set(ref(db, `customers/${id}`), updateData);
        return { id, ...updateData };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const deleteCustomer = createAsyncThunk('customers/delete', async (id, { rejectWithValue }) => {
    try {
        await remove(ref(db, `customers/${id}`));
        return id;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const customerSlice = createSlice({
    name: 'customers',
    initialState: { items: [], loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCustomers.pending, (state) => { state.loading = true; })
            .addCase(fetchCustomers.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchCustomers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(addCustomer.fulfilled, (state, action) => { state.items.push(action.payload); })
            .addCase(updateCustomer.fulfilled, (state, action) => {
                const index = state.items.findIndex(c => c.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(deleteCustomer.fulfilled, (state, action) => {
                state.items = state.items.filter(c => c.id !== action.payload);
            });
    },
});
export default customerSlice.reducer;
