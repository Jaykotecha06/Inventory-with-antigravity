import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, signInWithPopup } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, db, googleProvider } from '../../services/firebase';

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

export const googleLogin = createAsyncThunk('auth/googleLogin', async (userDataParams, { rejectWithValue }) => {
    try {
        const { name: providedName, role: providedRole } = userDataParams || {};
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user already exists in RTDB
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const existingUser = snapshot.val();
            // If role is provided (from Signup), it must match the existing role
            if (providedRole && existingUser.role !== providedRole) {
                // If they are different roles, we block and sign them out from Firebase Auth to be safe
                await signOut(auth);
                return rejectWithValue(`This email is already assigned the role: ${existingUser.role}. Please use a different email or select the correct role.`);
            }
            return { uid: user.uid, ...existingUser };
        } else {
            // New user from Google
            // If they are on the Signup page, they must have provided name/role
            // If they are on Login page and it's their first time, we might need a fallback or block
            const userData = {
                email: user.email,
                name: providedName || user.displayName,
                role: providedRole || 'Staff', // Default fallback if not provided
                createdAt: Date.now()
            };
            await set(userRef, userData);
            return { uid: user.uid, ...userData };
        }
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
            .addCase(googleLogin.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(googleLogin.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.isAuthenticated = true; })
            .addCase(googleLogin.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(logoutUser.fulfilled, (state) => { state.user = null; state.isAuthenticated = false; });
    },
});

export const { setUser, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
