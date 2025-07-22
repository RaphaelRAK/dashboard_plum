export interface MessageChat {
    eventType: any;
    new: MessageChat;
    old: any;
    id: number; 
    created_at: string; 
    message: string; 
    channel_id: number;
    sender_id: string; 
    receiver_id: string; 
}