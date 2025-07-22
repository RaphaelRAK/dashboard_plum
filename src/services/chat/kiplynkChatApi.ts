import { MessageChat } from "../../types/message";
import { signIn } from "../../utility/authService";

const API_BASE_URL = 'https://api.plumservices.fr';
// const API_BASE_URL = 'http://localhost:24102';
const AUTH_TOKEN_KEY = 'plumservices_auth_token';

// Fonction pour récupérer le token d'authentification
export const getAuthToken = async (): Promise<string> => {
    try {
        // Vérifier si un token existe déjà
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        console.log("Vérification du token stocké:", storedToken);
        
        if (!storedToken) {
            console.log("Pas de token trouvé, tentative de connexion...");
            // Si pas de token, utiliser la fonction signIn existante
            const authResponse = await signIn(
                import.meta.env.VITE_ADMIN_EMAIL,
                import.meta.env.VITE_ADMIN_PASSWORD
            );

            console.log("Réponse d'authentification:", {
                success: !!authResponse.token,
                tokenLength: authResponse.token?.length
            });

            if (!authResponse.token) {
                throw new Error('Échec de l\'authentification: Token non reçu');
            }

            // Vérifier le rôle avant de stocker le token
            try {
                const decodedToken = JSON.parse(atob(authResponse.token.split('.')[1]));
                console.log("Rôle de l'utilisateur:", decodedToken.role);
                
                if (decodedToken.role !== 'admin_dashboard_plum') {
                    throw new Error('Rôle non autorisé');
                }
            } catch (error) {
                console.error('Erreur lors de la vérification du token:', error);
                throw new Error('Token invalide ou rôle non autorisé');
            }

            // Stocker le nouveau token
            localStorage.setItem(AUTH_TOKEN_KEY, authResponse.token);
            return authResponse.token;
        }

        // Vérifier la validité du token existant
        try {
            const decodedToken = JSON.parse(atob(storedToken.split('.')[1]));
            const tokenExpiration = decodedToken.exp * 1000;
            
            if (tokenExpiration < Date.now()) {
                console.log("Token expiré, obtention d'un nouveau token");
                localStorage.removeItem(AUTH_TOKEN_KEY);
                return getAuthToken(); // Récursion pour obtenir un nouveau token
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du token existant:', error);
            localStorage.removeItem(AUTH_TOKEN_KEY);
            return getAuthToken(); // Récursion pour obtenir un nouveau token
        }

        return storedToken;
    } catch (error) {
        console.error('Erreur détaillée lors de la récupération du token:', error);
        throw error;
    }
};

// Fonction pour envoyer un message via l'API Kiplynk
export const sendMessageToChannel = async (
    channelId: number,
    message: string,
    receiverId: string
): Promise<MessageChat> => {
    try {
        // Validation des paramètres
        if (!channelId || !message || !receiverId) {
            console.error('Paramètres invalides:', { channelId, message, receiverId });
            throw new Error('Tous les paramètres sont requis');
        }

        const authToken = await getAuthToken();
        
        // Log complet de la requête
        // console.log('Requête complète:', {
        //     url: `${API_BASE_URL}/channel/${channelId}/chat-message`,
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${authToken?.substring(0, 10)}...` 
        //     },
        //     body: {
        //         message,
        //         receiver_id: receiverId
        //     }
        // });

        const response = await fetch(`${API_BASE_URL}/channel/${channelId}/chat-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                message: message,
                receiver_id: receiverId,
                // Ajout d'un timestamp pour le débogage
                timestamp: new Date().toISOString(), 
                full_name : "Equipe plüm",
                is_claim: true
            })
        });

        if (!response.ok) {
            // Ajouter plus d'informations sur l'erreur
            const errorText = await response.text();
            console.error('Détails de l\'erreur:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: errorText
            });
            
            if (response.status === 401) {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                // Réessayer une fois avec un nouveau token
                const newToken = await getAuthToken();
                // Appel de la fonction sendMessageToChannel avec le nouveau token
                return sendMessageToChannel(channelId, message, receiverId);
            }
            throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur détaillée lors de l\'envoi du message:', error);
        throw error;
    }
};