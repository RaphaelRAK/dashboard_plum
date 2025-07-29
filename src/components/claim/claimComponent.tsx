import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import {
  Avatar,
  Typography,
  Space,
  Spin,
  List,
  Select,
  Input,
  Tag,
  message,
  Button,
  Empty,
  Badge,
  Tooltip,
  Divider,
  Row,
  Col,
  notification,
} from "antd";
import { MessageChat } from "../../types/message";
import "../../styles/chat.css";
import "../../styles/ClaimList.css";
import ChatUIComponent from "../chat/ChatUIComponent";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseClient } from "../../utility/supabaseClient";
import { ColorModeContext } from "../../contexts/color-mode";
import {
  fetchLastMessagesForChannels,
  fetchMessagesByChannel,
  LastMessageInfo,
  LastMessagesMap,
} from "../../services/chat/chatApi";
import { sendMessageToChannel } from "../../services/chat/kiplynkChatApi";
import { updateClaimStatus as updateClaimStatusAction } from "../../store/slices/claimSlice";
import { useDispatch, useSelector } from "react-redux";
import { setClaims } from "../../store/slices/claimSlice";
import { RootState } from "../../store/store";
import { updateClaimStatus as updateClaimStatusApi } from "../../services/claims/claimApi";
import {
  SearchOutlined,
  FilterOutlined,
  MessageOutlined,
  UserOutlined,
  CommentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  SendOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const { Text, Title, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ClaimComponentProps {
  claims: any[];
  messages: MessageChat[];
}

interface NewMessage {
  message: string;
  sender_id: string;
  channel_id: number;
  created_at: string;
}

interface LastMessageTimestamp {
  [channelId: number]: string; // timestamp du dernier message
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN_UNPROCESSED":
      return "#ea4335"; // Rouge
    case "OPEN_IN_PROGRESS":
      return "#1a73e8"; // Bleu
    case "RESOLVED":
      return "#34a853"; // Vert
    case "PENDING_RESPONSE":
      return "#fbbc04"; // Jaune
    default:
      return "#9aa0a6"; // Gris
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "OPEN_UNPROCESSED":
      return <ExclamationCircleOutlined />;
    case "OPEN_IN_PROGRESS":
      return <ClockCircleOutlined />;
    case "RESOLVED":
      return <CheckCircleOutlined />;
    case "PENDING_RESPONSE":
      return <CommentOutlined />;
    default:
      return <InboxOutlined />;
  }
};

const getStatusTranslation = (status: string) => {
  switch (status) {
    case "OPEN_UNPROCESSED":
      return "Non traité";
    case "OPEN_IN_PROGRESS":
      return "En cours";
    case "RESOLVED":
      return "Résolu";
    case "PENDING_RESPONSE":
      return "En attente";
    default:
      return status;
  }
};

const ClaimComponent: React.FC<ClaimComponentProps> = ({
  claims: initialClaims,
  messages: initialMessages,
}) => {
  const { mode } = useContext(ColorModeContext);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const supabase_url_storage_images =
    import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES || "";
  const cloudflare_url_storage_images =
    import.meta.env.VITE_CLOUDFLARE_STORAGE_URL_FOR_IMAGES || "";
  const adminId = import.meta.env.VITE_CURRENT_USER_ID;
  const [messagesState, setMessagesState] =
    useState<MessageChat[]>(initialMessages);
  const [lastMessagesMap, setLastMessagesMap] = useState<LastMessagesMap>({});
  const [lastMessageTimestamps, setLastMessageTimestamps] =
    useState<LastMessageTimestamp>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const dispatch = useDispatch();
  const claimsFromRedux = useSelector(
    (state: RootState) => state.claims.claims,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [api, contextHolder] = notification.useNotification();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);
  const [claims, setClaims] = useState<any[]>(initialClaims);

  // Ajouter un debounce pour éviter trop d'appels
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  const debouncedUpdateLastMessages = () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    const timeout = setTimeout(() => {
      updateLastMessages();
    }, 500); // Attendre 500ms avant de mettre à jour

    setUpdateTimeout(timeout);
  };

  const containerStyle = {
    backgroundColor: mode === "dark" ? "#141414" : "#f8f9fa",
    color: mode === "dark" ? "#e8eaed" : "#202124",
  };

  const getCustomerInfo = (claim: any) => ({
    first_name: claim.public_profile?.first_name || "",
    last_name: claim.public_profile?.last_name || "",
    avatar: claim.public_profile?.avatar || "",
  });

  // Fonction pour obtenir le timestamp du dernier message d'un claim
  const getLastMessageTimestamp = (claim: any): string => {
    if (!claim.channel_id) return claim.created_at; // Fallback sur la date de création du claim

    const lastMessage = lastMessagesMap[claim.channel_id];
    if (lastMessage && lastMessage.timestamp) {
      return lastMessage.timestamp; // Utiliser le vrai timestamp
    }

    return claim.created_at; // Fallback
  };

  // Fonction pour trier les claims par dernier message
  const getSortedClaims = () => {
    const filteredClaims = getFilteredClaims();

    return filteredClaims.sort((a, b) => {
      const timestampA = getLastMessageTimestamp(a);
      const timestampB = getLastMessageTimestamp(b);

      // Trier par ordre décroissant (plus récent en premier)
      return new Date(timestampB).getTime() - new Date(timestampA).getTime();
    });
  };

  // Mettre à jour la fonction updateLastMessages
  const updateLastMessages = async () => {
    console.log("🚀 DÉBUT updateLastMessages optimisé");
    setIsLoadingMessages(true);
    try {
      const channelIds = claims
        .map((claim) => claim.channel_id)
        .filter(Boolean)
        .map((id) => id.toString());

      console.log("📡 Requête unique pour", channelIds.length, "channels");

      if (channelIds.length === 0) {
        console.log("Aucun channel_id trouvé");
        setLastMessagesMap({});
        setLastMessageTimestamps({});
        return;
      }

      // Utiliser la nouvelle API optimisée
      const lastMessagesMap = await fetchLastMessagesForChannels(channelIds);
      setLastMessagesMap(lastMessagesMap);

      // Créer un map des timestamps pour le tri
      const timestamps: LastMessageTimestamp = {};
      Object.keys(lastMessagesMap).forEach((channelId) => {
        const lastMessage = lastMessagesMap[parseInt(channelId)];
        if (lastMessage && lastMessage.timestamp) {
          timestamps[parseInt(channelId)] = lastMessage.timestamp; // Utiliser le vrai timestamp
        }
      });
      setLastMessageTimestamps(timestamps);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour des derniers messages:",
        error,
      );
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const getMessagesByChannelId = (channelId: number) => {
    if (!channelId) return [];

    return messagesState.filter(
      (message) => Number(message.channel_id) === Number(channelId),
    );
  };

  const handleSendMessageInClaimComponent = async (message: string) => {
    if (!selectedClaim) {
      console.error("Aucune réclamation sélectionnée");
      return;
    }

    if (!selectedClaim.channel_id || !selectedClaim.user_id) {
      console.error("Données de réclamation invalides:", selectedClaim);
      console.error("Données de réclamation invalides");
      return;
    }

    try {
      const sentMessage = await sendMessageToChannel(
        selectedClaim.channel_id,
        message,
        selectedClaim.user_id,
      );
    } catch (error: any) {
      console.error("Erreur détaillée:", error);
      console.error(`Erreur lors de l'envoi: ${error.message}`);
    }
  };

  useEffect(() => {
    if (initialClaims && initialClaims.length > 0) {
      console.log("⚡ Mise à jour des réclamations depuis les props");
      setClaims(initialClaims);
    }
  }, [initialClaims]);

  useEffect(() => {
    // Ne mettre à jour que si les claims ont changé significativement
    if (claims.length > 0) {
      debouncedUpdateLastMessages();
    }
  }, [claims.length]); // Dépendance sur la longueur plutôt que sur claims

  useEffect(() => {
    const loadAllMessages = async () => {
      if (!selectedClaim || !selectedClaim.channel_id) return;

      try {
        const messages = await fetchMessagesByChannel(
          selectedClaim.channel_id.toString(),
        );
        setMessagesState(messages);

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (error) {
        console.error("Erreur lors du chargement des messages:", error);
      }
    };

    if (selectedClaim) {
      loadAllMessages();

      if (selectedClaim.channel_id) {
        // Nettoyer l'ancien canal AVANT d'en créer un nouveau
        if (channelRef.current) {
          console.log("🧹 Nettoyage de l'ancien canal de chat");
          supabaseClient.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        // Créer un nouveau canal avec un nom unique
        const channelName = `message_chat_${selectedClaim.channel_id}_${Date.now()}`;
        const channel = supabaseClient
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "message_chat",
              filter: `channel_id=eq.${selectedClaim.channel_id}`,
            },
            (payload: any) => {
              switch (payload.eventType) {
                case "INSERT":
                  setMessagesState((prevMessages) => [
                    ...prevMessages,
                    payload.new as MessageChat,
                  ]);
                  // Appeler updateLastMessages de manière optimisée
                  setTimeout(() => updateLastMessages(), 100);
                  break;
                case "UPDATE":
                  setMessagesState((prevMessages) =>
                    prevMessages.map((msg) =>
                      msg.id === payload.new.id ? payload.new : msg,
                    ),
                  );
                  setTimeout(() => updateLastMessages(), 100);
                  break;
                case "DELETE":
                  setMessagesState((prevMessages) =>
                    prevMessages.filter((msg) => msg.id !== payload.old.id),
                  );
                  setTimeout(() => updateLastMessages(), 100);
                  break;
              }
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("✅ Canal de chat connecté:", channelName);
            }
            if (status === "CHANNEL_ERROR") {
              console.error(
                "❌ Erreur de connexion au canal de chat:",
                channelName,
              );
            }
          });

        channelRef.current = channel;
      }
    }

    // Nettoyage du canal quand selectedClaim change
    return () => {
      if (channelRef.current) {
        console.log("🧹 Nettoyage du canal lors du changement de claim");
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selectedClaim]); // Dépendance uniquement sur selectedClaim

  useEffect(() => {
    return () => {
      // Nettoyer tous les canaux au démontage du composant
      if (channelRef.current) {
        console.log("�� Nettoyage du canal WebSocket au démontage");
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const handleStatusChange = async (claimId: string, newStatus: string) => {
    try {
      // S'assurer que nous avons le claim_id correct
      const actualClaimId = claimId;
      console.log("🚀 Mise à jour du statut - Détails:", {
        claimId: actualClaimId,
        newStatus,
        selectedClaim: selectedClaim
          ? {
              id: selectedClaim.id,
              claim_id: selectedClaim.claim_id,
              status: selectedClaim.status,
            }
          : null,
      });

      // 1. Mettre à jour dans l'API
      await updateClaimStatusApi(BigInt(actualClaimId), newStatus);
      console.log("✅ API mise à jour avec succès");

      // 2. Mettre à jour dans Redux
      dispatch(updateClaimStatusAction({ claimId: actualClaimId, newStatus }));
      console.log("✅ Redux mis à jour");

      // 3. Mettre à jour la réclamation sélectionnée (UI locale)
      if (
        selectedClaim &&
        (selectedClaim.id === actualClaimId ||
          selectedClaim.claim_id === actualClaimId ||
          selectedClaim.claim_id?.toString() === actualClaimId)
      ) {
        const updatedSelectedClaim = {
          ...selectedClaim,
          status: newStatus,
        };
        setSelectedClaim(updatedSelectedClaim);
        console.log(
          "✅ Réclamation sélectionnée mise à jour:",
          updatedSelectedClaim,
        );
      }

      // 4. Mettre à jour la liste des réclamations pour refléter le changement immédiatement en UI
      const updatedClaimsArray = claims.map((claim) => {
        if (
          (claim.claim_id && claim.claim_id.toString() === actualClaimId) ||
          (claim.id && claim.id.toString() === actualClaimId)
        ) {
          console.log(
            "✅ Réclamation trouvée dans la liste et mise à jour:",
            claim.claim_id || claim.id,
          );
          return { ...claim, status: newStatus };
        }
        return claim;
      });

      // Mettre à jour le state local
      setClaims(updatedClaimsArray);
      console.log("✅ State local des réclamations mis à jour");

      // Forcer une mise à jour de la liste des réclamations dans Redux
      try {
        dispatch(setClaims(updatedClaimsArray) as any);
        console.log("✅ Liste des réclamations mise à jour dans Redux");
      } catch (error) {
        console.error(
          "❌ Erreur lors de la mise à jour du store Redux:",
          error,
        );
      }

      // 5. Notification de succès
      api.success({
        message: "Statut mis à jour",
        description: `Le statut a été changé en "${getStatusTranslation(newStatus)}" avec succès`,
        icon: <CheckOutlined style={{ color: "#34a853" }} />,
        placement: "topRight",
        duration: 3,
      });
      console.log("✅ Notification de succès affichée");
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du statut:", error);

      // Notification d'erreur
      api.error({
        message: "Erreur",
        description:
          "Impossible de mettre à jour le statut de la réclamation dans la base de données",
        placement: "topRight",
        duration: 4,
      });
    }
  };

  const getFilteredClaims = () => {
    return claims.filter((claim) => {
      // console.log('😍😍😍😍😍😍😍😍😍😍😍😍😍😍');
      // console.log('claim', claim);
      // console.log('searchText', searchText);
      // console.log('😍😍😍😍😍😍😍😍😍😍😍😍😍😍');
      const matchesSearch = searchText
        ? claim.order_id.toString().includes(searchText) ||
          (claim.public_profile?.first_name || "")
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (claim.public_profile?.last_name || "")
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (claim.content || "").toLowerCase().includes(searchText.toLowerCase())
        : true;

      const matchesStatus = statusFilter ? claim.status === statusFilter : true;

      return matchesSearch && matchesStatus;
    });
  };

  const getStatusTag = (status: string) => {
    return (
      <Tag color={getStatusColor(status)}>
        {getStatusIcon(status)} {getStatusTranslation(status)}
      </Tag>
    );
  };

  useEffect(() => {
    if (selectedClaim?.public_profile?.avatar) {
      console.log(
        `Chemin de l'avatar selectedClaim: ${
          selectedClaim.public_profile.avatar && cloudflare_url_storage_images
            ? `${cloudflare_url_storage_images}${selectedClaim.public_profile.avatar.startsWith("/") ? "" : "/"}${selectedClaim.public_profile.avatar}`
            : "Aucun avatar"
        }`,
      );
    }
  }, [selectedClaim, cloudflare_url_storage_images]);

  useEffect(() => {
    if (!cloudflare_url_storage_images) {
      console.warn("VITE_CLOUDFLARE_STORAGE_URL_FOR_IMAGES n'est pas défini");
    }
  }, [cloudflare_url_storage_images]);

  // Vérification si l'écran est en mode mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Vérification initiale
    checkIfMobile();

    // Ajouter l'écouteur d'événement pour le redimensionnement
    window.addEventListener("resize", checkIfMobile);

    // Nettoyage
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Fonction pour gérer le retour à la liste en mode mobile
  const handleBackToList = () => {
    if (isMobile) {
      setIsChatVisible(false);
    }
  };

  // Fonction pour gérer la sélection d'une réclamation
  const handleClaimSelection = (claim: any) => {
    setSelectedClaim(claim);
    if (isMobile) {
      setIsChatVisible(true);
    }
  };

  return (
    <div
      className={`claims-chat-container ${isMobile && isChatVisible ? "mobile-chat-visible" : ""}`}
      style={containerStyle}
    >
      {contextHolder}
      <div
        className="claims-list"
        style={{ backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff" }}
      >
        <div
          className="claims-search-filter"
          style={{
            backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff",
            position: "sticky",
            top: 0,
            zIndex: 100,
            padding: "1rem 0",
          }}
        >
          <Title
            level={4}
            style={{ color: mode === "dark" ? "#e8eaed" : "#202124" }}
          >
            Réclamations
          </Title>

          <Space
            direction="vertical"
            style={{ width: "100%", marginBottom: "1rem" }}
          >
            <Search
              placeholder="Rechercher une réclamation..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%" }}
              prefix={<SearchOutlined />}
              allowClear
            />

            <Select
              placeholder="Filtrer par statut"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
              allowClear
              suffixIcon={<FilterOutlined />}
            >
              <Option value="OPEN_UNPROCESSED">Non traité</Option>
              <Option value="OPEN_IN_PROGRESS">En cours</Option>
              <Option value="PENDING_RESPONSE">En attente</Option>
              <Option value="RESOLVED">Résolu</Option>
            </Select>
          </Space>

          <Divider
            style={{
              margin: "0.5rem 0 1rem",
              borderColor: mode === "dark" ? "#303030" : "#e0e0e0",
            }}
          />
        </div>

        {isLoadingMessages ? (
          <div style={{ padding: "1rem", textAlign: "center" }}>
            <Spin tip="Chargement des réclamations..." />
          </div>
        ) : getFilteredClaims().length === 0 ? (
          <Empty
            description={
              <Text style={{ color: mode === "dark" ? "#e8eaed" : "#202124" }}>
                Aucune réclamation trouvée
              </Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: "2rem 0" }}
          />
        ) : (
          <div className="claims-list-container">
            <List
              key={`claims-status-${Date.now()}`}
              dataSource={getSortedClaims()}
              renderItem={(claim) => {
                const customerInfo = getCustomerInfo(claim);
                const isSelected =
                  selectedClaim && selectedClaim.id === claim.id;
                const claimKey = claim.channel_id || claim.id;
                const lastMessageInfo = lastMessagesMap[claimKey] || {
                  message: "Aucun message",
                  time: "",
                };

                return (
                  <div
                    className={`claim-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleClaimSelection(claim)}
                    style={{
                      backgroundColor:
                        mode === "dark"
                          ? isSelected
                            ? "rgba(26, 115, 232, 0.15)"
                            : "#242424"
                          : isSelected
                            ? "rgba(26, 115, 232, 0.08)"
                            : "#fff",
                      borderColor: mode === "dark" ? "#303030" : "#e0e0e0",
                      borderWidth: isSelected ? "2px" : "1px",
                    }}
                  >
                    <div style={{ display: "flex", width: "100%" }}>
                      <div className="claim-avatar">
                        <Badge
                          dot
                          color={getStatusColor(claim.status)}
                          offset={[-4, 36]}
                        >
                          <Avatar
                            src={
                              customerInfo.avatar &&
                              cloudflare_url_storage_images
                                ? `${cloudflare_url_storage_images}${customerInfo.avatar.startsWith("/") ? "" : "/"}${customerInfo.avatar}`
                                : null
                            }
                            icon={!customerInfo.avatar && <UserOutlined />}
                            size={40}
                            style={{
                              backgroundColor: !customerInfo.avatar
                                ? mode === "dark"
                                  ? "#303030"
                                  : "#f0f0f0"
                                : undefined,
                            }}
                          />
                          {/* {console.log(`Chemin de l'avatar customerInfo: ${customerInfo.avatar ? `${cloudflare_url_storage_images}/${customerInfo.avatar}` : 'Aucun avatar'}`)} */}
                          {/* {console.log(`avatar: ${customerInfo.avatar}`);} */}
                          {/* console.log( src={customerInfo.avatar ? `${cloudflare_url_storage_images}${customerInfo.avatar}` : null}) */}
                        </Badge>
                      </div>

                      <div className="claim-content">
                        <div className="claim-header">
                          <span
                            className="claim-name"
                            style={{
                              color: mode === "dark" ? "#e8eaed" : "#202124",
                            }}
                          >
                            {customerInfo.first_name} {customerInfo.last_name}
                          </span>

                          <div className="claim-meta">
                            <span
                              className="claim-time"
                              style={{
                                color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                              }}
                            >
                              {lastMessageInfo.time || ""}
                            </span>

                            <Tooltip title={getStatusTranslation(claim.status)}>
                              <Tag
                                color={getStatusColor(claim.status)}
                                style={{ marginLeft: "0.5rem" }}
                              >
                                {getStatusIcon(claim.status)}{" "}
                                {getStatusTranslation(claim.status)}
                              </Tag>
                            </Tooltip>
                          </div>
                        </div>

                        <div
                          className="last-message"
                          style={{
                            color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                          }}
                        >
                          {lastMessageInfo.message || "Aucun message"}
                        </div>

                        {claim.order_id && (
                          <Text
                            type="secondary"
                            style={{
                              fontSize: "0.75rem",
                              marginTop: "0.25rem",
                              color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                            }}
                          >
                            Order ID: {claim.order_id}
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}
      </div>

      <div
        className="chat-container"
        style={{ backgroundColor: mode === "dark" ? "#1f1f1f" : "#fff" }}
      >
        {selectedClaim ? (
          <>
            <div
              className="chat-header"
              style={{
                backgroundColor: mode === "dark" ? "#242424" : "#fff",
                borderColor: mode === "dark" ? "#303030" : "#e0e0e0",
              }}
            >
              {isMobile && (
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToList}
                  className="back-button"
                  style={{ color: mode === "dark" ? "#e8eaed" : "#202124" }}
                />
              )}
              <div className="chat-header-info">
                <Avatar
                  src={
                    selectedClaim?.public_profile?.avatar &&
                    cloudflare_url_storage_images
                      ? `${cloudflare_url_storage_images}${selectedClaim.public_profile.avatar.startsWith("/") ? "" : "/"}${selectedClaim.public_profile.avatar}`
                      : null
                  }
                  icon={
                    !selectedClaim?.public_profile?.avatar && <UserOutlined />
                  }
                  size={isMobile ? 36 : 40}
                  style={{
                    marginRight: "1rem",
                    backgroundColor: !selectedClaim?.public_profile?.avatar
                      ? mode === "dark"
                        ? "#303030"
                        : "#f0f0f0"
                      : undefined,
                  }}
                />
                <div>
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                      color: mode === "dark" ? "#e8eaed" : "#202124",
                    }}
                  >
                    {selectedClaim.public_profile?.first_name}{" "}
                    {selectedClaim.public_profile?.last_name}
                  </Title>

                  <Space
                    align="center"
                    size={4}
                    wrap={isMobile}
                    style={{ fontSize: isMobile ? "0.75rem" : "inherit" }}
                  >
                    <Text
                      type="secondary"
                      style={{ color: mode === "dark" ? "#9aa0a6" : "#5f6368" }}
                    >
                      #{selectedClaim.id}
                    </Text>

                    {!isMobile && selectedClaim.order_id && (
                      <>
                        <Divider
                          type="vertical"
                          style={{
                            borderColor:
                              mode === "dark" ? "#303030" : "#e0e0e0",
                          }}
                        />
                        <Text
                          type="secondary"
                          style={{
                            color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                          }}
                        >
                          Order ID: {selectedClaim.order_id}
                        </Text>
                      </>
                    )}

                    {!isMobile && selectedClaim.claim_id && (
                      <>
                        <Divider
                          type="vertical"
                          style={{
                            borderColor:
                              mode === "dark" ? "#303030" : "#e0e0e0",
                          }}
                        />
                        <Text
                          type="secondary"
                          style={{
                            color: mode === "dark" ? "#9aa0a6" : "#5f6368",
                          }}
                        >
                          Claim ID: {selectedClaim.claim_id}
                        </Text>
                      </>
                    )}
                  </Space>
                </div>
              </div>

              <Space>
                <Select
                  value={selectedClaim.status}
                  onChange={(value) =>
                    handleStatusChange(
                      selectedClaim.claim_id
                        ? selectedClaim.claim_id.toString()
                        : selectedClaim.id,
                      value,
                    )
                  }
                  style={{ width: isMobile ? "120px" : "180px" }}
                  dropdownStyle={{
                    backgroundColor: mode === "dark" ? "#242424" : "#fff",
                  }}
                  size={isMobile ? "small" : "middle"}
                >
                  <Option value="OPEN_UNPROCESSED">
                    <ExclamationCircleOutlined
                      style={{ marginRight: "8px", color: "#ea4335" }}
                    />
                    Non traité
                  </Option>
                  <Option value="OPEN_IN_PROGRESS">
                    <ClockCircleOutlined
                      style={{ marginRight: "8px", color: "#1a73e8" }}
                    />
                    En cours
                  </Option>
                  <Option value="PENDING_RESPONSE">
                    <CommentOutlined
                      style={{ marginRight: "8px", color: "#fbbc04" }}
                    />
                    En attente
                  </Option>
                  <Option value="RESOLVED">
                    <CheckCircleOutlined
                      style={{ marginRight: "8px", color: "#34a853" }}
                    />
                    Résolu
                  </Option>
                </Select>

                {!isMobile && (
                  <>
                    <Tooltip title="Réduire">
                      <Button type="text" icon={<EyeInvisibleOutlined />} />
                    </Tooltip>

                    <Tooltip title="Fermer">
                      <Button
                        danger
                        type="text"
                        icon={<CloseCircleOutlined />}
                      />
                    </Tooltip>
                  </>
                )}
              </Space>
            </div>

            {selectedClaim.channel_id ? (
              <ChatUIComponent
                messages={getMessagesByChannelId(selectedClaim.channel_id)}
                onSendMessage={handleSendMessageInClaimComponent}
                messagesEndRef={messagesEndRef}
                darkMode={mode === "dark"}
              />
            ) : (
              <div className="empty-state">
                <ExclamationCircleOutlined
                  className="empty-state-icon"
                  style={{ color: mode === "dark" ? "#9aa0a6" : "#5f6368" }}
                />
                <Title
                  level={4}
                  style={{ color: mode === "dark" ? "#e8eaed" : "#202124" }}
                >
                  Aucun canal de discussion
                </Title>
                <Text
                  style={{ color: mode === "dark" ? "#9aa0a6" : "#5f6368" }}
                >
                  Cette réclamation n'a pas de canal de discussion actif
                </Text>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <MessageOutlined
              className="empty-state-icon"
              style={{ color: mode === "dark" ? "#9aa0a6" : "#5f6368" }}
            />
            <Title
              level={4}
              style={{ color: mode === "dark" ? "#e8eaed" : "#202124" }}
            >
              Aucune réclamation sélectionnée
            </Title>
            <Text style={{ color: mode === "dark" ? "#9aa0a6" : "#5f6368" }}>
              Sélectionnez une réclamation dans la liste pour voir les détails
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimComponent;
