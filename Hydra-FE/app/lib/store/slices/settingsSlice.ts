import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PublicSettings } from '@/lib/api/settings';

interface SettingsState {
  public: PublicSettings;
  isInitialized: boolean;
}

const initialState: SettingsState = {
  public: {
    site_name: 'Hydra Collectables',
    support_email: 'support@hydracollectables.com',
    contact_phone: '+520000000000',
  },
  isInitialized: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setPublicSettings: (state, action: PayloadAction<PublicSettings>) => {
      state.public = { ...state.public, ...action.payload };
      state.isInitialized = true;
    },
  },
});

export const { setPublicSettings } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
