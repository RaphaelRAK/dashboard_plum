export interface Message {
    id: number;
    channel_id: number;
    sender_id: string;
    message: string;
    created_at: string;
  }
  
  export interface User {
    id: string;
    name: string;
    avatar?: string;
  }
  