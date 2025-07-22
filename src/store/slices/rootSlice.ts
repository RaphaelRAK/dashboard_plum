import { combineReducers } from '@reduxjs/toolkit';
import orderSlice from './orderSlice';
import fliiinkerProfileSlice from './fliiinkerProfileSlice';
import publicProfileSlice from './publicProfileSlice';

export const rootReducer = combineReducers({
  orders: orderSlice,
  customers: publicProfileSlice,
  fliiinkers: fliiinkerProfileSlice
}); 