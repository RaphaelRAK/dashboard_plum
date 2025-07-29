import React, { useEffect, useState, useRef, useContext } from 'react';
import { MessageChat } from '../../types/message';
import { Input, Button, Select, Modal, message, Card, Empty, Typography, Spin, Avatar, Tooltip, Space, App } from 'antd';
import { 
    SendOutlined, 
    UserOutlined, 
    InfoCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import '../../styles/ChatUIComponent.css';
import { signIn } from '../../utility/authService';
import { fetchOrderWithBilling } from '../../services/order/orderApi';
import { OrderWithBillingDetails } from '../order/orderWithBillingDetails';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ColorModeContext } from '../../contexts/color-mode';
import { fetchMessagesByChannel, subscribeToMessages, unsubscribeFromMessages } from '../../services/chat/chatApi';
import { updateClaimStatus as updateClaimStatusApi } from '../../services/claims/claimApi';

import { updateClaimStatus } from '../../store/slices/claimSlice';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

interface ChatUIComponentProps {
    messages: MessageChat[];
    onSendMessage: (message: string) => void;
    messagesEndRef?: React.RefObject<HTMLDivElement>;
    darkMode?: boolean;
}

const ChatUIComponent: React.FC<ChatUIComponentProps> = ({
    messages,
    onSendMessage,
    messagesEndRef,
    darkMode = false
}) => {
    const { mode } = useContext(ColorModeContext);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const { message: messageApi } = App.useApp();
    const dispatch = useDispatch();
    const adminId = import.meta.env.VITE_CURRENT_USER_ID;

    // Utiliser le mode sombre passé en prop ou celui du contexte
    const isDarkMode = darkMode || mode === 'dark';

    // Fonction pour formater la date
    const formatMessageTime = (timestamp: string) => {
        return dayjs(timestamp).format('HH:mm');
    };

    // Fonction pour formater la date plus détaillée (pour le tooltip)
    const formatMessageFullDate = (timestamp: string) => {
        return dayjs(timestamp).format('DD/MM/YYYY HH:mm:ss');
    };

    const handleSendMessage = async () => {
        if (inputValue.trim()) {
            setIsLoading(true);
            try {
                await onSendMessage(inputValue);
                setInputValue("");
            } catch (error) {
                messageApi.error("Erreur lors de l'envoi du message");
                console.error("Erreur lors de l'envoi:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Faire défiler vers le bas lorsque de nouveaux messages arrivent
    useEffect(() => {
        const scrollToBottom = () => {
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
        };
        
        scrollToBottom();
    }, [messages]);

    // Tri des messages par date
    const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return (
        <>
            <div 
                className={`chat-messages ${isDarkMode ? 'dark' : ''}`} 
                ref={messagesContainerRef}
                style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#fff' }}
            >
                {sortedMessages.length === 0 ? (
                    <div className="empty-messages">
                        <Empty 
                            description={
                                <Text style={{ color: isDarkMode ? '#9aa0a6' : '#5f6368' }}>
                                    Aucun message
                                </Text>
                            }
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    </div>
                ) : (
                    sortedMessages.map((msg, index) => {
                        const isAdmin = msg.sender_id === adminId;
                        return (
                            <Tooltip 
                                key={msg.id || index} 
                                title={formatMessageFullDate(msg.created_at)}
                                placement={isAdmin ? "left" : "right"}
                            >
                                <div 
                                    className={`message-bubble ${isAdmin ? 'message-admin' : 'message-user'}`}
                                >
                                    <div 
                                        className="message-content"
                                        style={{
                                            backgroundColor: isAdmin 
                                                ? '#1a73e8' 
                                                : (isDarkMode ? '#303030' : '#f8f9fa'),
                                            color: isAdmin 
                                                ? 'white' 
                                                : (isDarkMode ? '#e8eaed' : '#202124')
                                        }}
                                    >
                                        <p>{msg.message}</p>
                                        <span 
                                            className="message-time"
                                            style={{
                                                color: isAdmin 
                                                    ? 'rgba(255, 255, 255, 0.9)' 
                                                    : (isDarkMode ? '#9aa0a6' : '#5f6368')
                                            }}
                                        >
                                            {formatMessageTime(msg.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </Tooltip>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div 
                className="chat-input-container"
                style={{
                    backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
                    borderColor: isDarkMode ? '#303030' : '#e0e0e0'
                }}
            >
                <TextArea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Écrivez votre message..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    disabled={isLoading}
                    style={{
                        backgroundColor: isDarkMode ? '#242424' : '#f8f9fa',
                        borderColor: isDarkMode ? '#303030' : '#e0e0e0',
                        color: isDarkMode ? '#e8eaed' : '#202124'
                    }}
                />
                <Button 
                    type="primary" 
                    icon={<SendOutlined />} 
                    onClick={handleSendMessage}
                    loading={isLoading}
                    disabled={!inputValue.trim()}
                    className="send-button"
                    shape="circle"
                />
            </div>
        </>
    );
};

export default ChatUIComponent;
