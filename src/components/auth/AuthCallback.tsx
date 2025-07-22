import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export const AuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
  
    useEffect(() => {
      console.log("🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵");
      console.log("Je suis dans AuthCallback");
      
      const hashValue = window.location.hash;
      console.log("Hash complet:", hashValue);
      
      // Enlever le # du début et récupérer la valeur
      const encodedData = hashValue.substring(1);
      console.log("Données encodées:", encodedData);
      
      if (encodedData) {
        try {
          // Décoder l'URL complète qui est encodée en base64
          const decodedUrl = decodeURIComponent(atob(encodedData));
          console.log("URL décodée:", decodedUrl);
          
          // Créer un objet URL pour extraire facilement les paramètres
          const url = new URL(decodedUrl);
          const token = url.searchParams.get('token');
          const type = url.searchParams.get('type');
          
          console.log("Token extrait:", token);
          console.log("Type extrait:", type);
          
          if (type === 'recovery') {
            navigate('/update-password', { 
              state: { 
                token, 
                type,
                fullUrl: decodedUrl 
              },
              replace: true 
            });
          }
        } catch (error) {
          console.error("Erreur lors du décodage:", error);
        }
      }
      console.log("🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵");
    }, [navigate]);
  
    return null;
};