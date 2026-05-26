import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Tcg } from '../../types/tcg';
import type { Banner } from '../../api/banners';
import { getActiveTCGs } from '../../api/tcgs';

import { Category } from '../../api/categories';

interface GameState {
  activeTcgs: Tcg[];
  selectedTcg: Tcg | null;
  categoriesByTcg: Record<string, Category[]>;
  bannersByTcg: Record<string, Banner[]>;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number;
}

const initialState: GameState = {
  activeTcgs: [],
  selectedTcg: null,
  categoriesByTcg: {},
  bannersByTcg: {},
  isLoading: false,
  error: null,
  lastFetchedAt: 0,
};

const ACTIVE_TCGS_REFETCH_INTERVAL_MS = 5 * 60 * 1000;

export const fetchActiveTcgs = createAsyncThunk(
  'game/fetchActive',
  async () => {
    return await getActiveTCGs();
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { game?: GameState };
      const gameState = state.game;
      if (!gameState) return true;
      if (gameState.isLoading) return false;
      if (!gameState.activeTcgs.length) return true;
      return Date.now() - gameState.lastFetchedAt > ACTIVE_TCGS_REFETCH_INTERVAL_MS;
    },
  }
);

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setSelectedTcg: (state, action: PayloadAction<Tcg | null>) => {
      state.selectedTcg = action.payload;
    },
    setInitialTcgs: (state, action: PayloadAction<Tcg[]>) => {
      state.activeTcgs = action.payload;
    },
    setInitialCategories: (state, action: PayloadAction<Record<string, Category[]>>) => {
      state.categoriesByTcg = { ...state.categoriesByTcg, ...action.payload };
    },
    setInitialBanners: (state, action: PayloadAction<Record<string, Banner[]>>) => {
      state.bannersByTcg = { ...state.bannersByTcg, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveTcgs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveTcgs.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = Array.isArray(action.payload) ? action.payload : [];
        // Defensive sorting: name ASC
        state.activeTcgs = data.toSorted((a, b) => a.name.localeCompare(b.name));
        state.lastFetchedAt = Date.now();
        // No default selection — user picks the TCG
      })
      .addCase(fetchActiveTcgs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch TCGs';
      });
  },
});

export const { setSelectedTcg, setInitialTcgs, setInitialCategories, setInitialBanners } =
  gameSlice.actions;
export const gameReducer = gameSlice.reducer;
