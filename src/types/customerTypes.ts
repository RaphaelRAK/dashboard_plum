// src/types.ts
export interface Customer {
    gender: any;
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    date_of_birth?: string; // Format ISO (YYYY-MM-DD)
    avatars?: string[];
    created_at: string;
    updated_at: string;
}
