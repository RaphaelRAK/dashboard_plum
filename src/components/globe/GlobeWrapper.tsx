import React, { useState, useEffect } from 'react';
import { fetchAllSearch } from '../../services/search/searchApi';
import { ArchiveSearchResult } from '../../types/searchAnalytics';
import MapFallback from '../maps/MapFallback';

// Définir le type pour les points affichés sur le globe
interface GlobePoint {
  lat: number;
  lng: number;
  label: string;
  intensity?: number;
}

const GlobeWrapper: React.FC = () => {
  // Temporairement, on utilise le fallback pour éviter les erreurs d'import
  return (
    <MapFallback 
      width={500} 
      height={600} 
      message="Globe 3D temporairement indisponible"
    />
  );
};

export default GlobeWrapper; 