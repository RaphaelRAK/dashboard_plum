import React, { useEffect, useState } from 'react';
import { Avatar, Badge, Dropdown, List, App } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import { supabaseClient } from '../../utility/supabaseClient';
import { MessageChat } from '../../types/message';
import '../../styles/notificationBell.css';
import { fetchNotificationHistory, fetchClaimChannels, setupNotificationChannel } from '../../services/notification/notificationApi';
import { fetchUserById } from '../../services/customer/customerApi';


interface NotificationBellProps {
  mode: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ mode }) => {
  const [notifications, setNotifications] = useState<MessageChat[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase_url_storage_images = import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES;
  const [senders, setSenders] = useState<{[key: string]: any}>({});
  const adminId = import.meta.env.VITE_CURRENT_USER_ID;
  const { message } = App.useApp();

  useEffect(() => {
    console.log("🔍 useEffect - Initialisation des notifications");
    const initializeNotifications = async () => {
      try {
        console.log("🔍 Chargement de l'historique des notifications");
        const history = await fetchNotificationHistory();
        console.log("🔍 Historique des notifications chargé:", history);
        setNotifications(history);

        console.log("🔍 Récupération des canaux de réclamation");
        const channelIds = await fetchClaimChannels();
        console.log("🔍 Canaux de réclamation récupérés:", channelIds);

        const channel = setupNotificationChannel(channelIds, async (newMessage) => {
          console.log("🔍 Nouveau message reçu:", newMessage);
          if (newMessage.sender_id === adminId) {
            console.log("🔍 Message ignoré car envoyé par l'admin");
            return;
          }
          const sender = await fetchUserById(newMessage.sender_id);
          console.log("🔍 Expéditeur du message:", sender);

          setNotifications(prev => [newMessage, ...prev]);
          console.log("🔍 Notification ajoutée, mise à jour du compteur de non-lus");
          setUnreadCount(prev => prev + 1);
        });

        return () => {
          console.log("🔍 Suppression du canal de notification");
          supabaseClient.removeChannel(channel);
        };
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    console.log("🔍 useEffect - Chargement des informations du dernier expéditeur");
    const loadLastSender = async () => {
      if (notifications.length === 0) return;

      const lastNotification = notifications[0];
      const isRecentMessage = (Date.now() - new Date(lastNotification.created_at).getTime()) < 1000;

      try {
        const senderData = await fetchUserById(lastNotification.sender_id);
        setSenders(prev => ({...prev, [lastNotification.sender_id]: senderData}));

        if (senderData.first_name && senderData.last_name && lastNotification.message && isRecentMessage) {
          message.warning({
            content: `Nouveau message de ${senderData.first_name} ${senderData.last_name} ${lastNotification.message}`,
            duration: 5,
            style: {
              fontSize: '18px',
              marginTop: '50px'
            }
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des informations de l'expéditeur:", error);
      }
    };
    loadLastSender();
  }, [notifications, message]);

  const handleNotificationClick = () => {
    console.log("🔍 Notification cliquée, réinitialisation du compteur de non-lus");
    setUnreadCount(0);
  };

  const getThemeColors = () => ({
    backgroundColor: mode === 'dark' ? '#1f1f1f' : 'white',
    textColor: mode === 'dark' ? '#ffffff' : '#1f1f1f',
    borderColor: mode === 'dark' ? '#303030' : '#e0e0e0',
    secondaryTextColor: mode === 'dark' ? '#a0a0a0' : 'gray',
  });

  const colors = getThemeColors();

  const renderAvatar = (avatarUrl: string | undefined) => {
    if (!avatarUrl) {
      return <Avatar icon={<UserOutlined />} />;
    }
    return (
      <Avatar 
        src={avatarUrl} 
        onError={() => {
          return true;
        }}
      />
    );
  };

  const notificationList = (
    <List
      style={{ 
        width: 300, 
        maxHeight: 400, 
        overflow: 'auto',
        backgroundColor: colors.backgroundColor,
        borderRadius: '10px',
        boxShadow: mode === 'dark' ? '0 2px 8px rgba(255,255,255,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
      }}
      dataSource={notifications}
      renderItem={(item) => (
        <List.Item 
          style={{ 
            border: `1px solid ${colors.borderColor}`, 
            borderRadius: '10px', 
            marginBottom: '1px',
            backgroundColor: colors.backgroundColor,
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontSize: '12px', 
            color: colors.secondaryTextColor, 
            marginLeft: '20px' 
          }}>
            <Avatar 
              src={senders[item.sender_id]?.avatar ? 
                `${supabase_url_storage_images}${senders[item.sender_id].avatar}` : 
                null
              } 
              style={{ marginRight: '10px' }} 
            />
            
            <div style={{ 
              marginLeft: '40px',
              color: colors.textColor
            }}>
              <div style={{ color: colors.textColor }}>
                {senders[item.sender_id] ? 
                  `${senders[item.sender_id].first_name} ${senders[item.sender_id].last_name}` : 
                  'Utilisateur inconnu'}
              </div>
              <p style={{ color: colors.secondaryTextColor }}>{item.message}</p>
              <p style={{ color: colors.secondaryTextColor, fontSize: '11px' }}>
                {getTimeDifference(item.created_at)}
              </p>
            </div>
          </div>
        </List.Item>
      )}
    />
  );

  return (
    <Dropdown 
      menu={{ 
        items: [{
          key: '1',
          label: notificationList
        }]
      }}
      trigger={['click']}
      onOpenChange={handleNotificationClick}
    >
      <Badge count={unreadCount} style={{ cursor: 'pointer' }}>
        <BellOutlined 
          style={{ 
            fontSize: '20px', 
            color: mode === 'dark' ? '#fff' : '#1f1f1f' 
          }} 
        />
      </Badge>
    </Dropdown>
  );
};

const getTimeDifference = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  return 'à l\'instant';
};

export default NotificationBell;