import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

// 1. Thunk for Logging In
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const response = await api.post('/users/login', credentials);
        // console.log(response);
        localStorage.setItem('token', response.data.token);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
});

// Google Login Thunk
export const googleLogin = createAsyncThunk('auth/googleLogin', async (googleAccessToken, { rejectWithValue }) => {
    try {
        const response = await api.post('/users/google', { accessToken: googleAccessToken });
        localStorage.setItem('token', response.data.token);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Google Login failed');
    }
});

// 2. Thunk for Registration
export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
    try {
        const response = await api.post('/users/register', userData);
        localStorage.setItem('token', response.data.token);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
});

// 3. Thunk for Loading User (Session Persistence)
export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/users/me');
        return response.data;
    } catch (error) {
        // If the token is invalid, remove it
        localStorage.removeItem('token');
        return rejectWithValue(error.response?.data?.message || 'Session expired');
    }
});

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
};

// Logout Thunk - calls backend to clear refresh cookie
export const logout = createAsyncThunk('auth/logout', async () => {
    await api.post('/users/logout');
    localStorage.removeItem('token');
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    // Handle the Thunk lifecycles (Pending, Fulfilled, Rejected)
    extraReducers: (builder) => {
        builder
            // Login Handlers
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Google Login Handlers
            .addCase(googleLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(googleLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Register Handlers
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // LoadUser Handlers
            .addCase(loadUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(loadUser.rejected, (state) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
            })
            // Logout Handlers
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.loading = false;
                state.error = null;
            });
    }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
