import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ref, get, remove, onValue, off } from 'firebase/database';
import { db } from '../../services/firebase';

export const fetchSessions = createAsyncThunk('sessions/fetch', async (uid, { rejectWithValue }) => {
    try {
        const sessionsRef = ref(db, `sessions/${uid}`);
        const snapshot = await get(sessionsRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => b.loginDate - a.loginDate);
        }
        return [];
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const revokeSession = createAsyncThunk('sessions/revoke', async ({ uid, sessionId }, { rejectWithValue }) => {
    try {
        await remove(ref(db, `sessions/${uid}/${sessionId}`));
        return sessionId;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const sessionSlice = createSlice({
    name: 'sessions',
    initialState: {
        items: [],
        loading: false,
        error: null,
    },
    reducers: {
        setSessions: (state, action) => {
            state.items = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSessions.pending, (state) => { state.loading = true; })
            .addCase(fetchSessions.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchSessions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(revokeSession.fulfilled, (state, action) => {
                state.items = state.items.filter(s => s.id !== action.payload);
            });
    },
});

export const { setSessions } = sessionSlice.actions;
export default sessionSlice.reducer;
