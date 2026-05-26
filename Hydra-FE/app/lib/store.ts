import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './store/slices/authSlice';
import { selectedProductReducer } from './store/slices/selectedProductSlice';
import { gameReducer } from './store/slices/gameSlice';
import { settingsReducer } from './store/slices/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    selectedProduct: selectedProductReducer,
    game: gameReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export store utilities and actions
export { useAppDispatch, useAppSelector } from './store/hooks';
export { setCredentials, logout, initializeAuth } from './store/slices/authSlice';
