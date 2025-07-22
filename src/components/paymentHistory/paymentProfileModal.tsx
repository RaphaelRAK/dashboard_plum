import React, { useState, useEffect, useContext } from "react";
import { 
  Modal, 
  Typography, 
  Avatar, 
  Tag, 
  Divider, 
  Spin, 
  Space, 
  Row, 
  Col, 
  Card, 
  Button, 
  message, 
  Tabs,
  Table,
  Statistic,
  Alert,
  Input,
  ConfigProvider,
  App,
  theme
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  DollarCircleOutlined,
  TagsOutlined,
  BankOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  CalendarOutlined,
  SearchOutlined
} from "@ant-design/icons";
import { FliiinkerCompleteProfile } from "../../types/FliiinkerCompleteProfile";
import { PlumPayment } from "../../types/plumPayment";
import { fetchFliiinkerCompleteProfile } from "../../services/meeting/meetingService";
import { updateMultiplePaymentsStatus } from "../../services/payment/paymentApi";
import { ColorModeContext } from "../../contexts/color-mode";
import dayjs from "dayjs";
import 'dayjs/locale/fr';
import "../../styles/meetingModal.css";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface PaymentProfileModalProps {
  isVisible: boolean;
  fliiinkerId: string | null;
  payments: PlumPayment[];
  onClose: () => void;
  onPaymentsProcessed: () => void;
}

const PaymentProfileModal: React.FC<PaymentProfileModalProps> = ({
  isVisible,
  fliiinkerId,
  payments,
  onClose,
  onPaymentsProcessed
}) => {
  const { mode } = useContext(ColorModeContext);
  const [profile, setProfile] = useState<FliiinkerCompleteProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [searchValue, setSearchValue] = useState("");
  const [ibanCopied, setIbanCopied] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  
  // État pour gérer l'IBAN manuel
  const [manualIban, setManualIban] = useState<string>("");
  const [showManualIbanInput, setShowManualIbanInput] = useState(false);

  // Récupérer les données complètes du fliiinker
  useEffect(() => {
    if (isVisible && fliiinkerId) {
      setLoading(true);
      fetchFliiinkerCompleteProfile(fliiinkerId)
        .then((profileData) => {
          if (profileData) {
            console.log("📊 Données de profil complètes:", profileData);
            
            // Accéder directement aux données brutes pour debug
            const rawData = profileData as any;
            console.log("🔍 Accès direct à fliiinker_profile:", rawData.fliiinker_profile);
            if (rawData.fliiinker_profile) {
              console.log("🔍 Accès direct à administrative_data:", rawData.fliiinker_profile.administrative_data);
              if (rawData.fliiinker_profile.administrative_data) {
                console.log("🔍 IBAN direct:", rawData.fliiinker_profile.administrative_data.iban);
              }
            }
            
            setProfile(profileData);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement du profil:", error);
          messageApi.error("Impossible de charger les informations du prestataire");
          setLoading(false);
        });
    } else {
      // Réinitialiser l'état lors de la fermeture
      setProfile(null);
      setSelectedPaymentIds([]);
      setActiveTab("profile");
    }
  }, [isVisible, fliiinkerId]);

  // Filtrer les paiements par statut
  const filterPaymentsByStatus = (status: string) => {
    return payments.filter(p => p.fliiinker_id === fliiinkerId && p.status === status);
  };

  // Filtrer les paiements par recherche
  const getFilteredPayments = (status: string) => {
    const statusPayments = filterPaymentsByStatus(status);
    if (!searchValue) return statusPayments;
    
    return statusPayments.filter(payment => {
      const searchLower = searchValue.toLowerCase();
      
      // Recherche par ID de paiement
      if (payment.id.toString().includes(searchLower)) {
        return true;
      }
      
      // Recherche par ID de commande
      if (payment.order_id.toString().includes(searchLower)) {
        return true;
      }
      
      // Recherche par nom de service
      if (payment.service_name && payment.service_name.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
  };

  // Calculer le total des paiements
  const calculateTotal = (payments: PlumPayment[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount_earned, 0);
  };

  // Calculer le total des paiements sélectionnés
  const calculateSelectedTotal = () => {
    return payments
      .filter(payment => selectedPaymentIds.includes(payment.id))
      .reduce((sum, payment) => sum + payment.amount_earned, 0);
  };

  // Gérer la sélection des paiements
  const handleSelectPayment = (paymentId: number, checked: boolean, isFinished: boolean) => {
    if (!isFinished && checked) {
      // Utiliser modal.confirm au lieu de AntModal.confirm
      const appInstance = App.useApp();
      appInstance.modal.confirm({
        title: (
          <span>
            <ExclamationCircleOutlined style={{ marginRight: 8, color: '#faad14' }} />
            Prestation non terminée
          </span>
        ),
        content: "Voulez-vous vraiment payer une prestation non terminée ?",
        okText: "Oui, continuer",
        cancelText: "Annuler",
        onOk() {
          setSelectedPaymentIds(prev => [...prev, paymentId]);
        }
      });
    } else if (checked) {
      setSelectedPaymentIds(prev => [...prev, paymentId]);
    } else {
      setSelectedPaymentIds(prev => prev.filter(id => id !== paymentId));
    }
  };

  // Sélectionner tous les paiements en attente
  const handleSelectAllPendingPayments = () => {
    const pendingPaymentIds = filterPaymentsByStatus('payment_pending').map(p => p.id);
    setSelectedPaymentIds(pendingPaymentIds);
  };

  // Traiter les paiements sélectionnés
  const handleProcessPayments = async () => {
    if (selectedPaymentIds.length === 0) {
      messageApi.warning("Veuillez sélectionner au moins un paiement");
      return;
    }
    
    setProcessingPayment(true);
    try {
      await updateMultiplePaymentsStatus(selectedPaymentIds, 'paid');
      messageApi.success(`${selectedPaymentIds.length} paiement(s) traité(s) avec succès`);
      setSelectedPaymentIds([]);
      onPaymentsProcessed();
    } catch (error) {
      console.error("Erreur lors du traitement des paiements:", error);
      messageApi.error("Erreur lors du traitement des paiements");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Copier l'IBAN dans le presse-papier
  const copyIbanToClipboard = () => {
    const iban = getIban();
    if (iban && iban !== "Non renseigné") {
      navigator.clipboard.writeText(iban)
        .then(() => {
          setIbanCopied(true);
          messageApi.success("IBAN copié dans le presse-papier");
          setTimeout(() => setIbanCopied(false), 3000);
        })
        .catch(err => {
          console.error("Erreur lors de la copie de l'IBAN:", err);
          messageApi.error("Impossible de copier l'IBAN");
        });
    } else {
      messageApi.warning("Aucun IBAN disponible à copier");
    }
  };

  // Colonnes pour le tableau des paiements
  const paymentColumns = [
    {
      title: ' ',
      key: 'selection',
      width: 50,
      render: (record: PlumPayment) => (
        console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥'),
        console.log(record),
        record.status === 'payment_pending' ? (
          <input
            type="checkbox"
            checked={selectedPaymentIds.includes(record.id)}
            onChange={(e) => handleSelectPayment(record.id, e.target.checked, record.is_finished ?? false)}
          />
        ) : null
      ),
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a: PlumPayment, b: PlumPayment) => a.id - b.id,
    },
    {
      title: 'Commande',
      dataIndex: 'order_id',
      key: 'order_id',
    },
    {
      title: 'Terminée ?',
      dataIndex: 'is_finished',
      key: 'is_finished',
      render: (isFinished: boolean) => (
        <Tag color={isFinished ? 'green' : 'orange'}>
          {isFinished ? "Oui" : "Non"}
        </Tag>
      ),
    },
    {
      title: 'Montant',
      dataIndex: 'amount_earned',
      key: 'amount_earned',
      render: (amount: number) => <Text strong>{amount.toFixed(2)}€</Text>,
      sorter: (a: PlumPayment, b: PlumPayment) => a.amount_earned - b.amount_earned,
    },
    {
      title: 'Date de fin',
      dataIndex: 'service_end_date',
      key: 'service_end_date',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
      sorter: (a: PlumPayment, b: PlumPayment) => {
        if (!a.service_end_date) return -1;
        if (!b.service_end_date) return 1;
        return dayjs(a.service_end_date).unix() - dayjs(b.service_end_date).unix();
      },
    },
    {
      title: 'Date de paiement',
      dataIndex: 'date_payment',
      key: 'date_payment',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
  ];

  // Obtenir l'IBAN depuis le profil
  const getIban = () => {
    // Si un IBAN manuel a été saisi, l'utiliser en priorité
    if (manualIban) {
      return manualIban;
    }
    
    if (!profile) return "Non renseigné";
    
    // Accéder directement à l'IBAN en contournant le type FliiinkerCompleteProfile
    const rawProfile = profile as any;
    
    // Vérifier tous les chemins possibles pour l'IBAN
    let iban = null;
    
    // 1. Chemin direct dans fliiinker_profile.administrative_data (chemin le plus probable d'après les logs)
    if (rawProfile.fliiinker_profile && 
        rawProfile.fliiinker_profile.administrative_data &&
        rawProfile.fliiinker_profile.administrative_data.iban) {
      iban = rawProfile.fliiinker_profile.administrative_data.iban;
      console.log("✅ IBAN trouvé via fliiinker_profile.administrative_data:", iban);
    }
    // 2. Chemin alternatif via administrative_data
    else if (rawProfile.administrative_data && rawProfile.administrative_data.iban) {
      iban = rawProfile.administrative_data.iban;
      console.log("✅ IBAN trouvé via administrative_data:", iban);
    }
    // 3. Chemin via administrative_data[0] (tableau)
    else if (Array.isArray(rawProfile.administrative_data) && 
             rawProfile.administrative_data[0] && 
             rawProfile.administrative_data[0].iban) {
      iban = rawProfile.administrative_data[0].iban;
      console.log("✅ IBAN trouvé via administrative_data[0]:", iban);
    }
    
    if (!iban) {
      console.log("❌ Aucun IBAN trouvé par les chemins standards");
      
      // Chercher l'IBAN dans n'importe quelle propriété (recherche en profondeur)
      const findIbanInObject = (obj: any, path = ''): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        
        // Si c'est un objet et qu'il a une propriété iban
        if ('iban' in obj && obj.iban) {
          console.log(`✅ IBAN trouvé à ${path}.iban:`, obj.iban);
          return obj.iban;
        }
        
        // Parcourir récursivement toutes les propriétés
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            const newPath = path ? `${path}.${key}` : key;
            const result = findIbanInObject(obj[key], newPath);
            if (result) return result;
          }
        }
        
        return null;
      };
      
      iban = findIbanInObject(rawProfile);
    }
    
    return iban || "Non renseigné";
  };

  // Déterminer si l'IBAN est valide
  const isIbanValid = () => {
    const iban = getIban();
    return iban && iban !== "Non renseigné";
  };
  
  // Gérer la saisie manuelle de l'IBAN
  const handleManualIbanSubmit = () => {
    if (!manualIban || manualIban.trim().length < 15) {
      messageApi.error("Veuillez saisir un IBAN valide");
      return;
    }
    
    messageApi.success("IBAN temporaire enregistré pour cette session");
    setShowManualIbanInput(false);
  };

  // Ajouter le bloc de l'IBAN à l'interface
  const renderIbanSection = () => {
    return (
      <Card 
        title={
          <Space align="center">
            <BankOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
            <span>Informations bancaires</span>
          </Space>
        }
        style={{ marginBottom: '20px' }}
        className="glass-section"
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>IBAN:</Text>
              {showManualIbanInput ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    placeholder="Saisir l'IBAN manuellement"
                    value={manualIban}
                    onChange={(e) => setManualIban(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <Space>
                    <Button 
                      type="primary" 
                      onClick={handleManualIbanSubmit}
                    >
                      Enregistrer
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowManualIbanInput(false);
                        setManualIban("");
                      }}
                    >
                      Annuler
                    </Button>
                  </Space>
                </Space>
              ) : (
                <>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '10px',
                    background: isIbanValid() ? '#f6ffed' : '#fff2e8',
                    border: `1px solid ${isIbanValid() ? '#b7eb8f' : '#ffccc7'}`,
                    borderRadius: '4px'
                  }}>
                    <Input.Password
                      value={getIban()}
                      readOnly
                      style={{ 
                        flex: 1,
                        fontSize: '16px',
                        border: 'none', 
                        // background: 'transparent'
                      }}
                      visibilityToggle={true}
                    />
                    {isIbanValid() ? (
                      <Button
                        icon={ibanCopied ? <CheckCircleOutlined /> : <CopyOutlined />}
                        onClick={copyIbanToClipboard}
                        type={ibanCopied ? "primary" : "default"}
                        style={{ marginLeft: '8px' }}
                      >
                        {ibanCopied ? "Copié" : "Copier"}
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        style={{ marginLeft: '8px' }}
                        onClick={() => setShowManualIbanInput(true)}
                      >
                        Ajouter un IBAN
                      </Button>
                    )}
                  </div>
                
                  {!isIbanValid() && (
                    <Alert
                      message="IBAN manquant"
                      description="Le prestataire n'a pas encore renseigné son IBAN. Vous pouvez saisir un IBAN manuellement pour cette session."
                      type="warning"
                      showIcon
                      style={{ marginTop: '10px' }}
                    />
                  )}
                </>
              )}
              
              {profile?.administrative_data?.siret || profile?.fliiinker_profile?.administrative_data?.siret ? (
                <div style={{ marginTop: '10px' }}>
                  <Text strong>SIRET:</Text>
                  <Text style={{ marginLeft: '8px' }}>
                    {profile.administrative_data?.siret || profile.fliiinker_profile?.administrative_data?.siret}
                  </Text>
                </div>
              ) : null}
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  const [showWarningModal, setShowWarningModal] = useState<number | null>(null);

  if (loading) {
    return (
      <ConfigProvider theme={{ algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
        <Modal
          title="Profil de paiement"
          open={isVisible}
          onCancel={onClose}
          footer={null}
          width={900}
          centered
        >
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Spin size="large" />
          </div>
        </Modal>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={{ algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <App>
        <Modal
          className="styled-modal"
          title={
            <Title level={4}>
              Profil de paiement
              {profile && (
                <Tag color="blue" style={{ marginLeft: 10 }}>
                  {profile.first_name} {profile.last_name}
                </Tag>
              )}
            </Title>
          }
          open={isVisible}
          onCancel={onClose}
          footer={null}
          centered
          width={900}
          data-theme={mode}
        >
          {contextHolder}

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Profil" key="profile">
              {profile ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <Avatar
                      size={80}
                      icon={<UserOutlined />}
                      src={profile.avatar ? `${import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES}/${profile.avatar}` : undefined}
                      style={{ marginRight: '20px' }}
                    />
                    <div>
                      <Title level={3} style={{ margin: 0 }}>
                        {profile.first_name} {profile.last_name}
                        {profile.is_pro && <Tag color="gold" style={{ marginLeft: 10 }}>PRO</Tag>}
                      </Title>
                      <Text type="secondary" style={{ fontSize: '16px' }}>
                        {profile.tagline || (profile.description ? profile.description.substring(0, 50) + "..." : "Prestataire Fliiink")}
                      </Text>
                      
                      <div style={{ marginTop: '10px' }}>
                        <Space direction="vertical" size="small">
                          <div>
                            <MailOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                            <Text>{profile.email}</Text>
                          </div>
                          {profile.phone && (
                            <div>
                              <PhoneOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                              <Text>{profile.phone}</Text>
                            </div>
                          )}
                        </Space>
                      </div>
                    </div>
                  </div>
                  
                  {renderIbanSection()}
                  
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card className="stat-card">
                        <DollarCircleOutlined style={{ fontSize: 24, color: '#faad14', marginBottom: 8 }} />
                        <Statistic 
                          title="En attente" 
                          value={calculateTotal(filterPaymentsByStatus('payment_pending'))} 
                          precision={2}
                          suffix="€"
                          valueStyle={{ color: '#faad14' }}
                        />
                        <Text type="secondary">{filterPaymentsByStatus('payment_pending').length} paiement(s)</Text>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card className="stat-card">
                        <LockOutlined style={{ fontSize: 24, color: '#ff4d4f', marginBottom: 8 }} />
                        <Statistic 
                          title="Bloqué" 
                          value={calculateTotal(filterPaymentsByStatus('blocked_by_claim'))} 
                          precision={2}
                          suffix="€"
                          valueStyle={{ color: '#ff4d4f' }}
                        />
                        <Text type="secondary">{filterPaymentsByStatus('blocked_by_claim').length} paiement(s)</Text>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card className="stat-card">
                        <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
                        <Statistic 
                          title="Payé" 
                          value={calculateTotal(filterPaymentsByStatus('paid'))} 
                          precision={2}
                          suffix="€"
                          valueStyle={{ color: '#52c41a' }}
                        />
                        <Text type="secondary">{filterPaymentsByStatus('paid').length} paiement(s)</Text>
                      </Card>
                    </Col>
                  </Row>
                </>
              ) : (
                <Alert
                  message="Aucune information disponible"
                  description="Impossible de charger les informations du prestataire"
                  type="error"
                  showIcon
                />
              )}
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  En attente <Tag color="orange">{filterPaymentsByStatus('payment_pending').length}</Tag>
                </span>
              } 
              key="pending"
            >
              <div style={{ marginBottom: '16px' }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col>
                    <Button
                      type="primary"
                      onClick={handleSelectAllPendingPayments}
                      disabled={filterPaymentsByStatus('payment_pending').length === 0}
                    >
                      Tout sélectionner
                    </Button>
                  </Col>
                  <Col flex="1">
                    <Input
                      placeholder="Rechercher par ID, commande ou service"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      allowClear
                      prefix={<SearchOutlined />}
                    />
                  </Col>
                </Row>
              </div>
              
              <Table
                columns={paymentColumns}
                dataSource={getFilteredPayments('payment_pending')}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                footer={() => {
                  const total = calculateTotal(getFilteredPayments('payment_pending'));
                  return <Text strong>Total: {total.toFixed(2)}€</Text>;
                }}
              />
              
              {selectedPaymentIds.length > 0 && (
                <div style={{ 
                  background: '#f6ffed', 
                  padding: '16px', 
                  borderRadius: '8px',
                  marginTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Space>
                    <Statistic
                      title="Sélection"
                      value={selectedPaymentIds.length}
                      suffix="paiement(s)"
                      style={{ marginRight: '24px' }}
                    />
                    <Statistic
                      title="Montant total"
                      value={calculateSelectedTotal()}
                      precision={2}
                      suffix="€"
                      valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                    />
                  </Space>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={handleProcessPayments}
                    loading={processingPayment}
                    size="large"
                    disabled={!isIbanValid()}
                  >
                    Marquer comme payé
                  </Button>
                </div>
              )}
              
              {!isIbanValid() && selectedPaymentIds.length > 0 && (
                <Alert
                  message="IBAN manquant"
                  description="Le prestataire n'a pas encore renseigné son IBAN. Impossible d'effectuer un paiement."
                  type="warning"
                  showIcon
                  style={{ marginTop: '16px' }}
                />
              )}
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  Bloqué <Tag color="red">{filterPaymentsByStatus('blocked_by_claim').length}</Tag>
                </span>
              } 
              key="blocked"
            >
              <Input
                placeholder="Rechercher par ID, commande ou service"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                allowClear
                prefix={<SearchOutlined />}
                style={{ marginBottom: '16px' }}
              />
              
              <Table
                columns={paymentColumns.filter(col => col.key !== 'selection')}
                dataSource={getFilteredPayments('blocked_by_claim')}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                footer={() => {
                  const total = calculateTotal(getFilteredPayments('blocked_by_claim'));
                  return <Text strong>Total: {total.toFixed(2)}€</Text>;
                }}
              />
              
              <Alert
                message="Paiements bloqués"
                description="Ces paiements sont bloqués en raison de réclamations en cours. Ils ne peuvent pas être traités tant que les réclamations ne sont pas résolues."
                type="warning"
                showIcon
                style={{ marginTop: '16px' }}
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  Payé <Tag color="green">{filterPaymentsByStatus('paid').length}</Tag>
                </span>
              } 
              key="paid"
            >
              <Input
                placeholder="Rechercher par ID, commande ou service"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                allowClear
                prefix={<SearchOutlined />}
                style={{ marginBottom: '16px' }}
              />
              
              <Table
                columns={paymentColumns.filter(col => col.key !== 'selection')}
                dataSource={getFilteredPayments('paid')}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                footer={() => {
                  const total = calculateTotal(getFilteredPayments('paid'));
                  return <Text strong>Total: {total.toFixed(2)}€</Text>;
                }}
              />
            </TabPane>
            
            <TabPane 
              tab="Tous les paiements" 
              key="all"
            >
              <Input
                placeholder="Rechercher par ID, commande ou service"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                allowClear
                prefix={<SearchOutlined />}
                style={{ marginBottom: '16px' }}
              />
              
              <Table
                columns={paymentColumns.filter(col => col.key !== 'selection')}
                dataSource={payments.filter(p => p.fliiinker_id === fliiinkerId)}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                footer={() => {
                  const total = calculateTotal(payments.filter(p => p.fliiinker_id === fliiinkerId));
                  return <Text strong>Total: {total.toFixed(2)}€</Text>;
                }}
              />
            </TabPane>
          </Tabs>
        </Modal>
      </App>
    </ConfigProvider>
  );
};

export default PaymentProfileModal; 