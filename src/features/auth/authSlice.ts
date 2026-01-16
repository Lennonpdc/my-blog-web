import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../api/supabaseClient';

interface AuthState {
    user: any | null;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    loading: false,
    error: null,
};

export const registerUser = createAsyncThunk(
    'auth/register',
    async ({ email, password, username, full_name }: any, { rejectWithValue }) => {
        // Create the Auth Account
        const { data, error: authError } = await supabase.auth.signUp({ email, password });

        if (authError) return rejectWithValue(authError.message);

        // Insert into bloggers_profile
        if (data.user) {
            const { error: profileError } = await supabase
                .from('bloggers_profile')
                .insert([
                    {
                        username,
                        full_name
                    }
                ]);
            if (profileError) return rejectWithValue(profileError.message);
        }
        return data.user;
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            supabase.auth.signOut();
        },
    },
    extraReducers: (builder) => {
        builder
            // Case for registration
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Case for Logged in user
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Case for UserProfile fetching
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.user = { ...state.user, ...action.payload };
                state.loading = false;
            })

            // Case for Logout
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.loading = false;
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const loginUser = createAsyncThunk(
    'auth/login',
    async ({ email, password }: any, { rejectWithValue }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) return rejectWithValue(error.message);
        return data.user;
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return true;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);
export const fetchUserProfile = createAsyncThunk(
    'auth/fetchProfile',
    async (userId: string, { rejectWithValue }) => {
        const { data, error } = await supabase
            .from('bloggers_profile')
            .select('username, full_name')
            .eq('id', userId)
            .single();

        if (error) return rejectWithValue(error.message);
        return data;
    }
);

export const { logout } = authSlice.actions;
export default authSlice.reducer;