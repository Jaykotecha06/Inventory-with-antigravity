import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, db } from '../../services/firebase';

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { uid: userCredential.user.uid, email: userCredential.user.email };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const signupUser = createAsyncThunk('auth/signup', async ({ email, password, name, role }, { rejectWithValue }) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userData = { email, name, role: role || 'Staff', createdAt: Date.now() };
        await set(ref(db, `users/${user.uid}`), userData);
        return { uid: user.uid, ...userData };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
    try {
        await signOut(auth);
        return null;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, { rejectWithValue }) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

const initialState = {
    user: null,
    loading: true, // initial load check
    error: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.loading = false;
        },
        setAuthLoading: (state, action) => {
            state.loading = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(loginUser.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.isAuthenticated = true; })
            .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(signupUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(signupUser.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.isAuthenticated = true; })
            .addCase(signupUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(logoutUser.fulfilled, (state) => { state.user = null; state.isAuthenticated = false; });
    },
});

export const { setUser, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
