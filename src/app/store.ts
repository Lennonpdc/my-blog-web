import { configureStore } from '@reduxjs/toolkit';
// We'll add reducers here as we build features

export const store = configureStore({
  reducer: {
    // Add slices here later
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;