import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import { Modal, Typography, Avatar, Tag, Divider, Spin, Space, Row, Col, Card, Button, message } from "antd";
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  TrophyOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  IdcardOutlined,
  BankOutlined,
  CarOutlined,
  GlobalOutlined,
  DollarCircleOutlined,
  TagsOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { MeetingWithProfiles, fetchFliiinkerCompleteProfile, validateFliiinkerProfileAndServices } from "../../services/meeting/meetingService";
import dayjs from "dayjs";
import { ColorModeContext } from "../../contexts/color-mode";
import { FliiinkerCompleteProfile } from "../../types/FliiinkerCompleteProfile";
import type { Address } from "../../types/FliiinkerCompleteProfile";
import "../../styles/meetingModal.css";

const { Title, Text, Paragraph } = Typography;

// Composant d'image administrative qui gère l'en-tête d'autorisation
const AdminImage: React.FC<{
  imagePath: string | undefined;
  alt: string;
  style?: React.CSSProperties;
  onClick: () => void;
}> = ({ imagePath, alt, style, onClick }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imagePath) {
      setLoading(false);
      setError(true);
      return;
    }

    const fetchImage = async () => {
      console.log("✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️")
      console.log(imagePath)
      console.log("✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️✈️")
      try {
        setLoading(true);
        const response = await fetch(`https://administrative-image-access.fliiinkapp.workers.dev/${imagePath}`, {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_ADMIN_DATA_IMAGES_SECRET_KEY}`
          }
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }else{
          console.log("Image administrative chargée avec succès:", imagePath);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        console.error(`Erreur de chargement de l'image: ${imagePath}`, err);
        setError(true);
        setLoading(false);
      }
    };

    fetchImage();

    // Nettoyage de l'URL de l'objet lors du démontage
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imagePath]);

  if (loading) {
    return <Spin style={{ ...style, display: "flex", justifyContent: "center", alignItems: "center" }} />;
  }

  if (error || !imageUrl) {
    return <div style={{...style, background: "#f5f5f5", display: "flex", justifyContent: "center", alignItems: "center"}}><Text type="secondary">Image non disponible</Text></div>;
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      style={style}
      onClick={onClick}
    />
  );
};

interface MeetingModalProps {
  isVisible: boolean;
  meeting: MeetingWithProfiles | null;
  loading: boolean;
  onClose: () => void;
  meetingId?: string;
}

// Déclaration des types Google Maps
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

const MeetingModal: React.FC<MeetingModalProps> = ({ isVisible, meeting, loading: initialLoading, onClose, meetingId }) => {
  const { mode } = useContext(ColorModeContext);
  const [fliiinkerProfile, setFliiinkerProfile] = useState<FliiinkerCompleteProfile | null>(null);
  const [loading, setLoading] = useState(initialLoading);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [activatingPlum, setActivatingPlum] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Déterminer les données à afficher
  const profileData = (fliiinkerProfile || {
    ...meeting?.publicProfile,
    ...meeting?.fliiinkerProfile,
    meeting: meeting?.meeting,
  }) as FliiinkerCompleteProfile;

  // Récupérer les données complètes du fliiinker
  useEffect(() => {
    if (isVisible && meeting) {
      setLoading(true);

      const meetingData = meeting.meeting as any;
      const fliiinkerId = meeting.fliiinkerProfile.id;

      fetchFliiinkerCompleteProfile(fliiinkerId, meetingData.id)
        .then((profile) => {
          if (profile) {
            setFliiinkerProfile(profile);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement du profil complet:", error);
          setLoading(false);
        });
    }
  }, [isVisible, meeting]);

  useEffect(() => {
    if (fliiinkerProfile) {
      console.log("Données du profil complet:", fliiinkerProfile);
      console.log(
        "Données administratives:",
        fliiinkerProfile.fliiinker_profile?.administrative_data || fliiinkerProfile.administrative_data
      );
      console.log("Services:", fliiinkerProfile.services);
      console.log(
        "Meeting:",
        fliiinkerProfile.fliiinker_profile?.fliiinker_meeting || fliiinkerProfile.meeting
      );
      console.log("📸📸📸 Images administratives:", fliiinkerProfile.administrative_images);
    }
  }, [fliiinkerProfile]);

  // Fonction pour charger l'API Google Maps une seule fois
  const loadGoogleMaps = useCallback(() => {
    if (window.google?.maps) {
      console.log("Google Maps déjà chargé");
      setMapLoaded(true);
      return;
    }

    console.log("Chargement de Google Maps...");
    window.initMap = () => {
      console.log("Google Maps callback initié");
      setMapLoaded(true);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Fonction pour initialiser la carte
  const initializeMap = useCallback((addresses: Address[]) => {
    if (!mapLoaded || !addresses.length || !mapContainerRef.current) return;

    try {
      const defaultAddress = addresses[0];
      if (!defaultAddress?.latitude || !defaultAddress?.longitude) return;

      const mapOptions = {
        center: { lat: defaultAddress.latitude, lng: defaultAddress.longitude },
        zoom: 15,
        mapTypeId: "roadmap",
      };

      const map = new window.google.maps.Map(mapContainerRef.current, mapOptions);

      addresses.forEach((address) => {
        if (address.latitude && address.longitude) {
          new window.google.maps.Marker({
            map,
            position: { lat: address.latitude, lng: address.longitude },
            title: address.name || "Adresse",
          });
        }
      });
    } catch (error) {
      console.error("Erreur carte:", error);
    }
  }, [mapLoaded]);

  // Charger l'API Google Maps quand le modal est visible
  useEffect(() => {
    if (isVisible && profileData?.addresses && profileData.addresses.length > 0) {
      console.log("Tentative de chargement de la carte");
      loadGoogleMaps();
    }
  }, [isVisible, profileData?.addresses, loadGoogleMaps]);

  // Initialiser la carte quand l'API est chargée
  useEffect(() => {
    if (mapLoaded && profileData?.addresses && profileData.addresses.length > 0 && mapContainerRef.current) {
      console.log("Initialisation de la carte");
      initializeMap(profileData.addresses);
    }
  }, [mapLoaded, profileData?.addresses, initializeMap]);

  // Nettoyer les ressources
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
    };
  }, []);

  // Forcer un re-render du conteneur de la carte
  useEffect(() => {
    if (isVisible && mapContainerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          google.maps.event.trigger(mapRef.current, "resize");
        }
      });
      resizeObserver.observe(mapContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isVisible]);

  // Fonction pour activer le Plüm
  const handleActivatePlum = async () => {
    if (!meeting?.fliiinkerProfile?.id) {
      console.log("No fliiinker profile id");
      messageApi.error({
        content: "Impossible de trouver l'ID du profil Fliiinker",
        icon: <ThunderboltOutlined style={{ color: "#ff4d4f" }} />,
        duration: 3,
      });
      return;
    }

    setActivatingPlum(true);
    const key = "plum-activation";

    messageApi.open({
      key,
      type: "loading",
      content: "Activation du Plüm en cours...",
      duration: 0,
    });

    try {
      await validateFliiinkerProfileAndServices(meeting.fliiinkerProfile.id);
      messageApi.open({
        key,
        type: "success",
        content: (
          <Space>
            <CheckCircleOutlined />
            Plüm activé avec succès !
          </Space>
        ),
        duration: 3,
      });
    } catch (error) {
      messageApi.open({
        key,
        type: "error",
        content: (
          <Space>
            <ThunderboltOutlined />
            Échec de l'activation du Plüm
          </Space>
        ),
        duration: 3,
      });
    } finally {
      setActivatingPlum(false);
    }
  };

  // Fonction pour ouvrir l'image dans la modale
  const handleImageClick = (imageUrl: string) => {
    // Si c'est une image administrative, garder l'URL originale
    if (imageUrl.startsWith("https://administrative-image-access.fliiinkapp.workers.dev")) {
      setSelectedImage(imageUrl);
    } else {
      setSelectedImage(`${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${imageUrl}`);
    }
  };

  // Fonction pour fermer la modale d'image
  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  // Fonction pour afficher l'image administrative dans la modale
  const handleAdminImageClick = (imagePath: string) => {
    if (!imagePath) return;
    
    // Charger l'image avec l'autorisation et l'afficher
    fetch(`https://administrative-image-access.fliiinkapp.workers.dev/${imagePath}`, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_ADMIN_DATA_IMAGES_SECRET_KEY}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      return response.blob();
    })
    .then(blob => {
      const objectUrl = URL.createObjectURL(blob);
      setSelectedImage(objectUrl);
    })
    .catch(error => {
      console.error(`Erreur lors du chargement de l'image administrative: ${imagePath}`, error);
      messageApi.error(`Impossible de charger l'image: ${error.message}`);
    });
  };

  if (loading) {
    return (
      <Modal
        className="styled-modal"
        title="Détails du rendez-vous"
        open={isVisible}
        onCancel={onClose}
        footer={null}
        centered
        width={800}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  if (!meeting && !fliiinkerProfile) {
    return null;
  }

  const meetingData = profileData.fliiinker_profile?.fliiinker_meeting || profileData.meeting || meeting?.meeting;
  const meetingDate = meetingData?.date_to_call ? dayjs(meetingData.date_to_call) : null;

  const adminData = profileData.fliiinker_profile?.administrative_data || profileData.administrative_data;
  const supaPowas = profileData.fliiinker_profile?.supa_powa || profileData.supa_powa || [];
  const services = profileData.services || [];
  const description = profileData.fliiinker_profile?.description || profileData.description;

  console.log("Données complètes pour debug:", {
    profileData,
    meetingData,
    adminData,
    supaPowas,
    services,
  });

  return (
    <Modal
      className="styled-modal"
      title={
        <Title level={4}>
          Détails du rendez-vous
          {meetingData && (
            <Tag className={`status-tag ${meetingData.is_finish ? "validated" : "pending"}`}>
              {meetingData.is_finish ? "Terminé" : "En attente"}
            </Tag>
          )}
        </Title>
      }
      open={isVisible}
      onCancel={onClose}
      footer={null}
      centered
      width={800}
      data-theme={mode}
    >
      {contextHolder}

      {/* Modale pour afficher l'image en grand */}
      <Modal
        open={!!selectedImage}
        onCancel={() => {
          handleCloseImageModal();
          // Si c'est une URL d'objet blob, la révoquer pour libérer la mémoire
          if (selectedImage && !selectedImage.startsWith('http')) {
            URL.revokeObjectURL(selectedImage);
          }
        }}
        footer={null}
        centered
        
      >
        {selectedImage && (
          <img
            src={selectedImage}
            alt="Image agrandie"
            style={{ width: "100%", maxHeight: "80vh", objectFit: "contain" }}
            onError={() => {
              console.error("Erreur de chargement de l'image:", selectedImage);
              handleCloseImageModal();
            }}
          />
        )}
      </Modal>

      <div className="profile-card">
        <Avatar
          className="large-avatar"
          src={profileData.avatar ? `${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${profileData.avatar}` : undefined}
          size={80}
          icon={<UserOutlined />}
          style={{
            borderRadius: "50%",
            minWidth: "80px",
            minHeight: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            objectFit: "cover",
            cursor: profileData.avatar ? "pointer" : "default",
          }}
          onClick={() => profileData.avatar && handleImageClick(profileData.avatar)}
          onError={() => {
            console.error("Erreur de chargement de l'avatar:", profileData.avatar);
            return false;
          }}
        />
        <div className="profile-info">
          <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
            {profileData.first_name} {profileData.last_name}
            {(profileData.fliiinker_profile?.is_pro || profileData.is_pro) && (
              <Tag color="gold" style={{ marginLeft: 10 }}>PRO</Tag>
            )}
          </Title>
          <Text type="secondary" style={{ fontSize: 16, display: "block", marginBottom: 12 }}>
            {profileData.fliiinker_profile?.tagline ||
              profileData.tagline ||
              (description ? description.substring(0, 50) + (description.length > 50 ? "..." : "") : "Fliiinker")}
          </Text>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {Array.isArray(profileData.fliiinker_profile?.spoken_languages) &&
              profileData.fliiinker_profile?.spoken_languages.map((lang: any, index: number) => (
                <Tag key={index} color="blue" icon={lang.emoji ? <span>{lang.emoji}</span> : null}>
                  {typeof lang === "object" ? lang.name || "Langue" : lang}
                </Tag>
              ))}
            {Array.isArray(profileData.spoken_languages) &&
              profileData.spoken_languages.map((lang: any, index: number) => (
                <Tag key={index} color="blue" icon={lang.emoji ? <span>{lang.emoji}</span> : null}>
                  {typeof lang === "object" ? lang.name || "Langue" : lang}
                </Tag>
              ))}
          </div>
        </div>
      </div>

      <div className="glass-section" style={{ textAlign: "center" }}>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          onClick={handleActivatePlum}
          loading={activatingPlum}
          style={{
            height: "50px",
            padding: "0 40px",
            fontSize: "18px",
            background: "linear-gradient(45deg, #722ed1 0%, #1890ff 100%)",
            border: "none",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            marginBottom: "10px",
            transition: "all 0.3s ease",
          }}
          className="plum-button"
        >
          Activer le Plüm
        </Button>
        <br />
        <Text type="secondary">Valider le profil et activer les services</Text>
      </div>

      {meetingData && (
        <div className="glass-section">
          <Title level={5}>Détails du rendez-vous</Title>
          <div className="detail-item">
            <CalendarOutlined style={{ color: "#1890ff" }} />
            <Text>{meetingDate ? meetingDate.format("DD MMMM YYYY") : "Date non définie"}</Text>
          </div>
          <div className="detail-item">
            <ClockCircleOutlined style={{ color: "#52c41a" }} />
            <Text>{meetingData.hour_to_call || "Heure non définie"}</Text>
          </div>
          <div className="detail-item">
            <EnvironmentOutlined style={{ color: "#faad14" }} />
            <Text>Fuseau horaire: {meetingData.timezone || "Non spécifié"}</Text>
          </div>
          <div className="detail-item">
            <MailOutlined style={{ color: "#eb2f96" }} />
            <Text>{profileData.email}</Text>
          </div>
          {profileData.phone && (
            <div className="detail-item">
              <PhoneOutlined style={{ color: "#722ed1" }} />
              <Text>{profileData.phone}</Text>
            </div>
          )}
        </div>
      )}

      <Divider style={{ margin: "12px 0" }} />

      <Title level={5}>Profil</Title>
      {description && (
        <div className="glass-section">
          <Paragraph style={{ margin: 0 }}>{description}</Paragraph>
        </div>
      )}

      {supaPowas && supaPowas.length > 0 && (
        <div className="glass-section">
          <Text strong style={{ display: "block", marginBottom: 8 }}>Super Pouvoirs:</Text>
          <Space wrap>
            {supaPowas.map((power: any, index: number) => (
              <Tag key={index} color="purple" icon={power.emoji ? <span>{power.emoji}</span> : null}>
                {typeof power === "object" ? power.name : power}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      <div className="meeting-stats">
        <div className="stat-card">
          <TrophyOutlined style={{ fontSize: 24, color: "#faad14", marginBottom: 8 }} />
          <Text strong>{profileData.fliiinker_profile?.degree || profileData.degree || "Non spécifié"}</Text>
          <Text type="secondary">Diplôme</Text>
        </div>
        <div className="stat-card">
          <UserOutlined style={{ fontSize: 24, color: "#1890ff", marginBottom: 8 }} />
          <Text strong>
            {(() => {
              const gender = profileData.gender;
              if (typeof gender === "object" && gender !== null) {
                return gender || "Non spécifié";
              }
              return gender || "Non spécifié";
            })()}
          </Text>
          <Text type="secondary">Genre</Text>
        </div>
      </div>

      {(profileData.Pictures1 || profileData.Pictures2 || profileData.Pictures3) && (
        <>
          <Divider style={{ margin: "16px 0" }} />
          <Title level={5}>Photos du Plüm</Title>
          <Row gutter={[16, 16]}>
            {profileData.Pictures1 && (
              <Col span={8}>
                <img
                  src={`${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${profileData.Pictures1}`}
                  alt="Photo 1"
                  style={{
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => profileData.Pictures1 && handleImageClick(profileData.Pictures1)}
                  onError={() => console.error("Erreur de chargement de Pictures1:", profileData.Pictures1)}
                />
              </Col>
            )}
            {profileData.Pictures2 && (
              <Col span={8}>
                <img
                  src={`${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${profileData.Pictures2}`}
                  alt="Photo 2"
                  style={{
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => profileData.Pictures2 && handleImageClick(profileData.Pictures2)}
                  onError={() => console.error("Erreur de chargement de Pictures2:", profileData.Pictures2)}
                />
              </Col>
            )}
            {profileData.Pictures3 && (
              <Col span={8}>
                <img
                  src={`${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${profileData.Pictures3}`}
                  alt="Photo 3"
                  style={{
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => profileData.Pictures3 && handleImageClick(profileData.Pictures3)}
                  onError={() => console.error("Erreur de chargement de Pictures3:", profileData.Pictures3)}
                />
              </Col>
            )}
          </Row>
        </>
      )}

      {/* Affichage des images administratives */}
      {(() => {
        console.log("🔍🔍🔍 Vérification des images administratives:", {
          hasProfileData: !!profileData,
          hasAdminImages: !!(profileData?.administrative_images),
          adminImagesLength: profileData?.administrative_images?.length || 0,
          adminImages: profileData?.administrative_images
        });
        return profileData.administrative_images && profileData.administrative_images.length > 0 && (
          <>
            <Divider style={{ margin: "16px 0" }} />
            <Title level={5}>Documents administratifs</Title>
            <Row gutter={[16, 16]}>
              {profileData.administrative_images.map((adminImage, index) => (
                <React.Fragment key={index}>
                  {adminImage.front_image && (
                    <Col span={12}>
                      <Card title="Pièce d'identité (Recto)" className="admin-image-card">
                        <AdminImage 
                          imagePath={adminImage.front_image} 
                          alt="Pièce d'identité recto"
                          style={{
                            width: "100%",
                            height: 200,
                            objectFit: "cover",
                            borderRadius: 8,
                            cursor: "pointer",
                          }}
                          onClick={() => handleAdminImageClick(adminImage.front_image || "")}
                        />
                      </Card>
                    </Col>
                  )}
                  {adminImage.back_image && (
                    <Col span={12}>
                      <Card title="Pièce d'identité (Verso)" className="admin-image-card">
                        <AdminImage 
                          imagePath={adminImage.back_image} 
                          alt="Pièce d'identité verso"
                          style={{
                            width: "100%",
                            height: 200,
                            objectFit: "cover",
                            borderRadius: 8,
                            cursor: "pointer",
                          }}
                          onClick={() => handleAdminImageClick(adminImage.back_image || "")}
                        />
                      </Card>
                    </Col>
                  )}
                </React.Fragment>
              ))}
            </Row>
          </>
        );
      })()}

      {services && services.length > 0 && (
        <>
          <Divider style={{ margin: "16px 0" }} />
          <Title level={5}>Services proposés</Title>
          {services.map((service: any, index: number) => (
            <Card
              key={index}
              className="service-card"
              title={
                <Space>
                  <DollarCircleOutlined style={{ color: service.is_active ? "#52c41a" : "#ff4d4f" }} />
                  <Text>
                    {service.service_type ||
                      (service.service_id === 24
                        ? "Garde d'animaux"
                        : service.service_id === 25
                        ? "Ménage/Linge"
                        : service.service_id === 26
                        ? "Garde d'enfant"
                        : `Service #${service.service_id}`)}
                  </Text>
                  <Tag color={service.is_active ? "success" : "error"}>{service.is_active ? "Actif" : "Inactif"}</Tag>
                </Space>
              }
            >
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text strong>Tarif horaire:</Text> {service.hourly_rate || "Non défini"} €/h
                </Col>
                <Col span={12}>
                  <Text strong>Date création:</Text>{" "}
                  {service.created_at ? dayjs(service.created_at).format("DD/MM/YYYY") : "Non définie"}
                </Col>
                {service.description && (
                  <Col span={24}>
                    <Text strong>Description:</Text> {service.description}
                  </Col>
                )}
                {service.tags && service.tags.length > 0 && (
                  <Col span={24}>
                    <Space style={{ marginTop: 8 }}>
                      <TagsOutlined />
                      {service.tags.map((tag: any, i: number) => (
                        <Tag key={i} color="blue">{tag}</Tag>
                      ))}
                    </Space>
                  </Col>
                )}
              </Row>
            </Card>
          ))}
        </>
      )}

      {profileData?.addresses && profileData.addresses.length > 0 && (
        <>
          <Divider style={{ margin: "16px 0" }} />
          <Title level={5}>Adresses</Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              {profileData.addresses.map((address) => (
                <Card
                  key={address.id}
                  className="address-card"
                  title={
                    <Space>
                      <EnvironmentOutlined style={{ color: address.is_default ? "#52c41a" : "#1890ff" }} />
                      <Text strong>{address.name}</Text>
                      {address.is_default && <Tag color="success">Par défaut</Tag>}
                    </Space>
                  }
                >
                  <div className="detail-item">
                    <Text>{address.street}</Text>
                  </div>
                  <div className="detail-item">
                    <Text>
                      {address.zip_code} {address.city}
                    </Text>
                  </div>
                </Card>
              ))}
            </Col>
            <Col span={12}>
              <div style={{ height: "300px", width: "100%", position: "relative" }}>
                <div className="map-container" ref={mapContainerRef} />
                {!mapLoaded && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: mode === "dark" ? "#1f1f1f" : "#f0f0f0",
                    }}
                  >
                    <Space>
                      <Spin />
                      <Text>Chargement de la carte...</Text>
                    </Space>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </>
      )}
    </Modal>
  );
};

export default MeetingModal;