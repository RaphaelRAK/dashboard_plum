export interface Public_profile {
    fliiinker_profile: any;
    id: string;
    created_at: string;
    updated_at: string;
    email: string;
    email_confirmed_at?: string;
    phone?: string;
    phone_confirmed_at?: string;
    last_name?: string;
    first_name?: string;
    is_fliiinker?: boolean;
    avatar?: string;
    gender: "male" | "female" | "other";
    birthday?: string; // Format ISO (YYYY-MM-DD)
}