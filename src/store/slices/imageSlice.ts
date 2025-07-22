import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface ImageState {
  images: any[];
  loading: boolean;
  error: string | null;
  lastFetchTimestamp: number;
}

const initialState: ImageState = {
  images: [],
  loading: false,
  error: null,
  lastFetchTimestamp: 0
};

const imageSlice = createSlice({
  name: 'images',
  initialState,
  reducers: {
    setImages: (state, action: PayloadAction<any[]>) => {
      state.images = action.payload;
      state.lastFetchTimestamp = Date.now();
    }
  }
});

export const { setImages } = imageSlice.actions;
export const selectImagesFromRedux = (state: RootState) => state.images.images;
export default imageSlice.reducer; 