import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import React, { useEffect, useState } from 'react';
import { fetchLocationData } from '../../services/map/mapApi';
import { LocationData } from '../../types/location';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction pour l'icône du marqueur
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map: React.FC = () => {
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [center, setCenter] = useState<[number, number]>([-21.1151, 55.5364]); // Centre par défaut (La Réunion)

    useEffect(() => {
        const loadLocations = async () => {
            console.log("🔄 Chargement des données de localisation...");
            try {
                const data = await fetchLocationData();
                console.log("✅ Données de localisation récupérées:", data);
                setLocations(data);
                
                // Si des données sont disponibles, centrer la carte sur le premier point
                if (data.length > 0) {
                    setCenter([data[0].customer_latitude, data[0].customer_longitude]);
                    console.log("📍 Carte centrée sur:", data[0].customer_first_name, data[0].customer_last_name);
                } else {
                    console.warn("⚠️ Aucune donnée de localisation disponible.");
                }
            } catch (error) {
                console.error("❌ Erreur lors du chargement des locations:", error);
            }
        };

        loadLocations();
    }, []);

    return (
        <MapContainer 
            center={center} 
            zoom={10} 
            scrollWheelZoom={true}
            style={{ height: '600px', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((location) => (
                <Marker 
                    key={location.customer_id}
                    position={[location.customer_latitude, location.customer_longitude]}
                >
                    <Popup>
                        <div>
                            <strong>{location.customer_first_name} {location.customer_last_name}</strong>
                            <br />
                            {location.customer_city}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default Map;
