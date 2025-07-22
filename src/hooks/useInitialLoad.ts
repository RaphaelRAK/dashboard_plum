import { useEffect } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { fetchPublicProfilesIfNeeded } from '../store/slices/publicProfileSlice';

export const useInitialLoad = () => {
  useEffect(() => {
    console.log('[Initial Load] Vérification des données nécessaires');
  }, []);
};