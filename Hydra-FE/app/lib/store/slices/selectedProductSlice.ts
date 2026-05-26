import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CardData } from '@/features/products/types/EnhancedCard.types';

interface SelectedProductState {
  card: CardData | null;
}

const initialState: SelectedProductState = {
  card: null,
};

const selectedProductSlice = createSlice({
  name: 'selectedProduct',
  initialState,
  reducers: {
    setSelectedProduct: (state, action: PayloadAction<CardData>) => {
      state.card = action.payload;
    },
    clearSelectedProduct: (state) => {
      state.card = null;
    },
  },
});

export const selectedProductReducer = selectedProductSlice.reducer;
