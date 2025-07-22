import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

export const signIn = async (email: string, password: string): Promise<{ token: string | null; userId: string | null }> => {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            console.error("Error signing in:", error.message);
            return { token: null, userId: null };
        }

        const token = data.session?.access_token || null;
        const userId = data.user?.id || null;

        console.log("User authenticated successfully. Token:", token, "User ID:", userId);

        return { token, userId };
    } catch (err) {
        console.error("Unexpected error during sign-in:", err);
        return { token: null, userId: null };
    }
};
