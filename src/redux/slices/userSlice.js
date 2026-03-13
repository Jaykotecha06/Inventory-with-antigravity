import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, set, remove } from 'firebase/database';
import { db } from '../../services/firebase';

export const fetchUsers = createAsyncThunk('users/fetch', async (_, { rejectWithValue }) => {
    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.keys(data).map(key => ({ id: key, ...data[key] }));
        }
        return [];
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const updateUserRole = createAsyncThunk('users/updateRole', async ({ uid, role }, { rejectWithValue }) => {
    try {
        await set(ref(db, `users/${uid}/role`), role);
        return { uid, role };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const deleteUser = createAsyncThunk('users/delete', async (uid, { rejectWithValue }) => {
    try {
        await remove(ref(db, `users/${uid}`));
        return uid;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const userSlice = createSlice({
    name: 'users',
    initialState: { items: [], loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => { state.loading = true; })
            .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(updateUserRole.fulfilled, (state, action) => {
                const index = state.items.findIndex(u => u.id === action.payload.uid);
                if (index !== -1) state.items[index].role = action.payload.role;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.items = state.items.filter(u => u.id !== action.payload);
            });
    },
});
export default userSlice.reducer;
