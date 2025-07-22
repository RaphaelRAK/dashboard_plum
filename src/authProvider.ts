import { AuthBindings, AuthProvider } from "@refinedev/core";

import { supabaseClient } from "./utility";
import { message } from "antd";
import { useLocation } from "react-router-dom";

// Étendre le type AuthProvider
type ExtendedAuthProvider = AuthProvider & {
  getRoutePermissions: (route: string) => Promise<boolean>;
};

const authProvider: ExtendedAuthProvider = {
  login: async ({ email, password, providerName }) => {
    try {
      // Connexion avec OAuth ou email/mot de passe
      if (providerName) {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: providerName,
        });
  
        if (error) {
          return { success: false, error };
        }
  
        if (data?.url) {
          return { success: true, redirectTo: "/" };
        }
      }
  
      // Connexion avec email et mot de passe
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: {
            message: "Email ou mot de passe incorrect",
            name: "LoginError"
          },
          redirectTo: "/login" // Force la redirection vers login en cas d'erreur
        };
      }

      console.log("🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑");
      console.log("data", data)
      console.log("🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑");
      
      console.log("--------------------------------")
      console.log("user_id", data?.user?.id)
      console.log("--------------------------------")
      if (data?.user) {
        // Récupérer le rôle de l'utilisateur dans le metadata
        const role = data.user.role;
        console.log("role", role)
  
        // Rediriger en fonction du rôle
        if (role === 'admin_dashboard_plum') {
          return { success: true, redirectTo: "/home" };
        } else if (role === 'commercial_dashboard_user') {
          return { success: true, redirectTo: "/claim" };
        } else {
          return {
            success: false,
            error: { 
              message: "Accès refusé, veuillez contacter les administrateurs.", 
              name: "Droit d'accès insuffisant" 
            },
            redirectTo: "/login" 
          };
        }
      }

      throw new Error("Échec de l'authentification");
    } catch (error) {
      return {
        success: false,
        error: {
          message: "Erreur d'authentification",
          name: "LoginError"
        }
      };
    }
  },
  register: async ({ email, password }) => {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error,
        };
      }

      if (data) {
        return {
          success: true,
          redirectTo: "/",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: false,
      error: {
        message: "Register failed",
        name: "Invalid email or password",
      },
    };
  },
  forgotPassword: async ({ email }) => {
    try {
      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/update-password#`,
        }
      );

  

      if (error) {
        return {
          success: false,
          error,
        };
      }

      if (data) {
        message.success("Email sent successfully");
        return {
          success: true,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: false,
      error: {
        message: "Forgot password failed",
        name: "Invalid email",
      },
    };
  },
  updatePassword: async ({ password }) => {
    try {
      // Extraire le fragment après le double hash (##)
      const fragment = window.location.hash.substring(2); // Supprime le '##'
      const fragmentParams = new URLSearchParams(fragment);

      // Récupérer les paramètres nécessaires
      const accessToken = fragmentParams.get('access_token');
      const refreshToken = fragmentParams.get('refresh_token');
      const tokenType = fragmentParams.get('token_type');
      const type = fragmentParams.get('type');

      console.log("🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑");
      console.log("fragment", fragment);
      console.log("accessToken", accessToken);
      console.log("refreshToken", refreshToken);
      console.log("tokenType", tokenType);
      console.log("type", type);
      console.log("🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑");

      // Vérifier si le type est 'recovery' et si le token est présent
    if (type === 'recovery' && accessToken) {
       // Initialiser la session avec le token
       await supabaseClient.auth.setSession({
        access_token: accessToken as string,
        refresh_token: refreshToken as string,
      });

      // Utiliser le token pour mettre à jour le mot de passe
      const { data, error } = await supabaseClient.auth.updateUser({
        password: password,
      });

      if (error) {
        console.log(error);
        return {
          success: false,
          error,
        };
      }

      if (data) {
        message.success("Password updated successfully");
        return {
          message: "Password updated successfully",
          success: true,
          redirectTo: "/login",
        };
      }
    } else {
      throw new Error("Invalid token or type");
    }
  } catch (error: any) {
    return {
      success: false,
      error,
    };
  }
  return {
    success: false,
    error: {
      message: "Update password failed",
      name: "Invalid password",
    },
  };
},
  logout: async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: true,
      redirectTo: "/",
    };
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
  // 
  check: async () => {
    try {
      const { data } = await supabaseClient.auth.getSession();
      const { session } = data;
  
      if (!session) {
        return {
          authenticated: false,
          error: { message: "Session non trouvée", name: "AuthError" },
          logout: true,
          redirectTo: "/",
        };
      }
  
      // Récupération du rôle de l'utilisateur dans le metadata
      const role = session.user.role;
      // console.log("role", role)
  
      // Autoriser l'accès en fonction du rôle
      if (role === 'admin_dashboard_plum' || role === 'commercial_dashboard_user') {
        return { authenticated: true };
      } else {
        return {
          authenticated: false,
          error: { message: "Rôle non autorisé", name: "RoleError" },
          logout: true,
          redirectTo: "/login",
        };
      }
    } catch (error: any) {
      return {
        authenticated: false,
        error: error || { message: "Échec de la vérification", name: "AuthError" },
        logout: true,
        redirectTo: "/login",
      };
    }
  },
  // 
  getPermissions: async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (user) {
        return user.role;
      }
      return null;
    } catch (error) {
      console.error("Erreur lors de la récupération des permissions:", error);
      return null;
    }
  },
  getIdentity: async () => {
    const { data } = await supabaseClient.auth.getUser();

    if (data?.user) {
      return {
        ...data.user,
        name: data.user.email,
      };
    }

    return null;
  },
  // Ajoutez cette fonction dans authProvider.ts après la fonction check
getRoutePermissions: async (route: string) => {
  try {
    const { data } = await supabaseClient.auth.getSession();
    const { session } = data;

    if (!session) {
      return false;
    }

    const role = session.user.role;

    // Admin a accès à toutes les routes
    if (role === 'admin_dashboard_plum') {
      return true;
    }

    // Commercial a accès à toutes les routes sauf phototeque
    if (role === 'commercial_dashboard_user') {
      // ici pour ajouter d'autres routes
      // return route !== '/phototeque' && route !== '/paymentHistory';
      
      // On ne veut pas que le commercial accède à la phototeque
      return route !== '/phototeque';
    }

    return false;
  } catch (error) {
    console.error("Erreur lors de la vérification des permissions de route:", error);
    return false;
  }
}
};



export default authProvider;
