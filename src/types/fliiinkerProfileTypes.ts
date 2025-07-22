import { Public_profile } from "./public_profileTypes";

export interface FliiinkerProfile {
    id: string;
    created_at: string;
    description?: string;
    degree?: string;
    tagline?: string;
    status: string;
    is_pro: boolean;
    is_validated: boolean;
    avatar?: string;
    spoken_languages?: string[];
    status_config?: boolean;
    public_profile?: Public_profile;
}