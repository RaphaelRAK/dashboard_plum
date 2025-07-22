import Globe from 'react-globe.gl';
import { useEffect, useState } from 'react';
import { fetchAllSearch } from '../../services/search/searchApi';
import { ArchiveSearchResult } from '../../types/searchAnalytics';

// Définir le type pour les points affichés sur le globe
interface GlobePoint {
  lat: number;
  lng: number;
  label: string;
  intensity?: number; // Intensité pour simuler la heatmap
}

const GlobeComponent: React.FC = () => {
  // État pour stocker les points à afficher sur le globe
  const [points, setPoints] = useState<GlobePoint[]>([]);

  // Coordonnées de La Réunion
  const reunionCoords = { lat: -21.1151, lng: 55.5364 };

  useEffect(() => {
    // Récupérez les données de la table archive_search_results
    fetchAllSearch()
      .then((data: ArchiveSearchResult[]) => {
        // Transformez les données en format adapté pour le globe
        const formattedPoints = data
          .filter((item) => item.customer_latitude !== null && item.customer_longitude !== null) // Filtrez les points sans coordonnées
          .map((item) => ({
            lat: item.customer_latitude as number, // Utilisez `as number` pour indiquer que ces valeurs ne sont pas null
            lng: item.customer_longitude as number,
            label: `
              <strong>${item.customer_first_name} ${item.customer_last_name}</strong><br/>
              Ville: ${item.customer_city}<br/>
              Service: ${item.service_name}<br/>
              Statut: ${item.status}
            `, // Libellé HTML à afficher au survol
            intensity: Math.random(), // Intensité aléatoire pour l'exemple
          }));
        setPoints(formattedPoints);
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération des données :', error);
      });
  }, []);

  // Fonction pour déterminer la couleur en fonction de l'intensité
  const getPointColor = (point: GlobePoint) => {
    const intensity = point.intensity || 0;
    if (intensity > 0.8) return 'red'; // Points chauds
    if (intensity > 0.5) return 'orange'; // Points intermédiaires
    return 'yellow'; // Points froids
  };

  return (
    <Globe 
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg" // Image de la Terre
      pointsData={points}
      pointLabel="label" // Affiche le libellé au survol
      pointAltitude={(point: object) => {
        const globePoint = point as GlobePoint; // Cast de l'objet point en GlobePoint
        return (globePoint.intensity || 0) * 0.1;
      }} // Hauteur des points proportionnelle à l'intensité
      pointRadius={(point: object) => {
        const globePoint = point as GlobePoint; // Cast de l'objet point en GlobePoint
        return (globePoint.intensity || 0) * 0.5;
      }} // Taille des points proportionnelle à l'intensité
      pointColor={(point: object) => {
        const globePoint = point as GlobePoint; // Cast de l'objet point en GlobePoint
        return getPointColor(globePoint);
      }} // Couleur des points en fonction de l'intensité
      width={500} // Largeur du globe
      height={600} // Hauteur du globe
      backgroundColor="rgba(0, 0, 0, 0)" // Fond transparent
      onPointClick={(point: object, event: MouseEvent, coords: { lat: number; lng: number; altitude: number; }) => {
        const globePoint = point as GlobePoint; // Cast de l'objet point en GlobePoint
        console.log('Point cliqué :', globePoint);
      }} // Gestionnaire de clic
    //   camera={{ lat: reunionCoords.lat, lng: reunionCoords.lng, altitude: 2.5 }} // Position de la caméra
    />
  );
};

export default GlobeComponent;