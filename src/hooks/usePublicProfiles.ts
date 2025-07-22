// src/hooks/usePublicProfiles.ts
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { fetchPublicProfilesIfNeeded } from '../store/slices/publicProfileSlice';

// Définition d'un hook personnalisé pour gérer les profils publics
export const usePublicProfiles = () => {
  // Utilisation du hook useDispatch pour obtenir la fonction dispatch
  const dispatch = useDispatch<AppDispatch>();
  
  // Utilisation du hook useSelector pour accéder à l'état des profils publics dans le store
  const { profiles, loading, error } = useSelector((state: RootState) => state.publicProfiles);
  
  // Utilisation de useEffect pour déclencher une action lors du premier rendu du composant
  useEffect(() => {
    // Dispatch de l'action pour récupérer les profils publics si nécessaire
    dispatch(fetchPublicProfilesIfNeeded());
  }, [dispatch]); // Dépendance sur dispatch pour éviter les avertissements de dépendance

  // Retourne les données des profils, l'état de chargement et les erreurs
  return { profiles, loading, error };
};