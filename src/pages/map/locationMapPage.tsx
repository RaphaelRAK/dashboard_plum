import React, { useEffect, useState } from "react";
import Map from "../../components/map/mapComponent"; // Importez le composant Map
import { LocationData } from "../../types/location";
import { fetchLocationData } from "../../services/map/mapApi";

const LocationMapPage: React.FC = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchLocationData();
        setLocations(data);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des données");
        setLoading(false);
        console.error(err);
      }
    };

    loadData();
  }, []);


  if (loading) {
    return <div>Chargement en cours...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Carte des localisations des clients</h1>
      <div style={{ margin: "0 auto", maxWidth: "100%" }}>
        <Map /> {/* Utilisation du composant Map */}
      </div>
    </div>
  );
};

export default LocationMapPage;