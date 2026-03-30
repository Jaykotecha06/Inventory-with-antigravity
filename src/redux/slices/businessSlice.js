import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, set, push, remove, update } from 'firebase/database';
import { db } from '../../services/firebase';

// Fetch all businesses for the current user
export const fetchBusinesses = createAsyncThunk('business/fetchBusinesses', async (userId, { rejectWithValue }) => {
    try {
        const businessesRef = ref(db, 'businesses');
        const snapshot = await get(businessesRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Filter businesses by ownerId OR if userId is in the business's users list
            return Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(b => b.ownerId === userId || (b.users && b.users[userId]));
        }
        return [];
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const createBusiness = createAsyncThunk('business/createBusiness', async (businessData, { rejectWithValue }) => {
    try {
        const newBusinessRef = push(ref(db, 'businesses'));
        const business = { ...businessData, createdAt: Date.now() };
        await set(newBusinessRef, business);
        return { id: newBusinessRef.key, ...business };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const updateBusinessSlice = createAsyncThunk('business/updateBusiness', async ({ id, data }, { rejectWithValue }) => {
    try {
        await update(ref(db, `businesses/${id}`), data);
        return { id, ...data };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const deleteBusinessSlice = createAsyncThunk('business/deleteBusiness', async (id, { rejectWithValue }) => {
    try {
        await remove(ref(db, `businesses/${id}`));
        return id;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const businessSlice = createSlice({
    name: 'business',
    initialState: {
        items: [],
        activeBusiness: null,
        loading: false,
        error: null
    },
    reducers: {
        setActiveBusiness: (state, action) => {
            state.activeBusiness = action.payload;
            if (action.payload) {
                localStorage.setItem('activeBusinessId', action.payload.id);
            } else {
                localStorage.removeItem('activeBusinessId');
            }
        },
        restoreActiveBusiness: (state) => {
            const id = localStorage.getItem('activeBusinessId');
            if (id && state.items.length > 0) {
                const business = state.items.find(b => b.id === id);
                if (business) state.activeBusiness = business;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBusinesses.pending, (state) => { state.loading = true; })
            .addCase(fetchBusinesses.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;

                const savedId = localStorage.getItem('activeBusinessId');
                const savedBusiness = action.payload.find(b => b.id === savedId);

                if (savedBusiness) {
                    state.activeBusiness = savedBusiness;
                } else if (action.payload.length > 0 && !state.activeBusiness) {
                    state.activeBusiness = action.payload[0];
                    localStorage.setItem('activeBusinessId', action.payload[0].id);
                }
            })
            .addCase(fetchBusinesses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createBusiness.fulfilled, (state, action) => {
                state.items.push(action.payload);
                if (!state.activeBusiness) {
                    state.activeBusiness = action.payload;
                    localStorage.setItem('activeBusinessId', action.payload.id);
                }
            })
            .addCase(updateBusinessSlice.fulfilled, (state, action) => {
                const index = state.items.findIndex(b => b.id === action.payload.id);
                if (index !== -1) state.items[index] = { ...state.items[index], ...action.payload };
                if (state.activeBusiness?.id === action.payload.id) {
                    state.activeBusiness = { ...state.activeBusiness, ...action.payload };
                }
            })
            .addCase(deleteBusinessSlice.fulfilled, (state, action) => {
                state.items = state.items.filter(b => b.id !== action.payload);
                if (state.activeBusiness?.id === action.payload) {
                    state.activeBusiness = state.items.length > 0 ? state.items[0] : null;
                    if (state.activeBusiness) {
                        localStorage.setItem('activeBusinessId', state.activeBusiness.id);
                    } else {
                        localStorage.removeItem('activeBusinessId');
                    }
                }
            });
    },
});

export const { setActiveBusiness, restoreActiveBusiness } = businessSlice.actions;
export default businessSlice.reducer;
