import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Button,
  Calendar,
  Layout,
  Menu,
  Typography,
  Form,
  Input,
  Modal,
  TimePicker,
  DatePicker,
  Select,
  Tooltip,
  message,
  Badge,
  Switch,
  Space,
  Empty,
} from "antd";
import {
  LeftOutlined,
  PlusCircleOutlined,
  RightOutlined,
  UserOutlined,
  CalendarOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { ColorModeContext } from "../../contexts/color-mode";
import "../../styles/calendar.css";
import { Meeting, fetchMeetings, fetchMeetingWithProfiles, MeetingWithProfiles, fetchRawMeetings, fetchFliiinkerCompleteProfile } from "../../services/meeting/meetingService";
import MeetingModal from "./meetingModal";
import { supabaseClient } from "../../utility/supabaseClient";

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

// Type étendu pour le meeting avec les propriétés supplémentaires
interface ExtendedMeeting extends Meeting {
  fliiinker_id?: string;
  public_profile_id?: string;
}

interface Event {
  id: string;
  time: string;
  title: string;
  isFinished: boolean;
}

// Modifions d'abord l'interface du composant pour accepter la propriété siderVisible
interface WeeklyCalendarProps {
  siderVisible?: boolean;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ siderVisible = true }) => {
  const { mode } = useContext(ColorModeContext);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [events, setEvents] = useState<Record<string, Event[]>>({});
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isMeetingModalVisible, setIsMeetingModalVisible] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithProfiles | null>(null);
  const [loadingMeeting, setLoadingMeeting] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [meetingsWithoutDate, setMeetingsWithoutDate] = useState<Meeting[]>([]);
  const [showFinishedOnly, setShowFinishedOnly] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const startOfWeek = selectedDate.startOf("week").add(1, "day");
  const endOfWeek = startOfWeek.add(6, "day");

  // Ref pour le conteneur des heures et la barre rouge
  const currentHourRef = useRef<HTMLDivElement>(null);

  // Barre rouge dynamique
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000); // Mise à jour toutes les minutes
    return () => clearInterval(interval);
  }, []);

  // Rafraîchissement automatique toutes les 5 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadMeetings();
    }, 300000); // 5 minutes en millisecondes
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Charger les rendez-vous depuis Supabase
  const loadMeetings = async () => {
    setRefreshing(true);
    try {
      // D'abord, récupérons les données brutes pour diagnostiquer
      const rawData = await fetchRawMeetings();
      // Log simplifié: seulement le nombre d'éléments
      console.log(`Rendez-vous récupérés: ${rawData.length} éléments`);
      
      // Séparation des rendez-vous avec et sans date
      const withoutDate: Meeting[] = [];
      const formattedEvents: Record<string, Event[]> = {};
      
      rawData.forEach((meeting: any) => {
        if (meeting.date_to_call) {
          const meetingDate = dayjs(meeting.date_to_call);
          const dateKey = meetingDate.format("YYYY-MM-DD");
          
          // Extraire l'heure à partir de différents formats possibles
          let hourStart = "00:00";
          if (meeting.hour_to_call) {
            // Format "8h-9h" ou "15h-16h"
            if (meeting.hour_to_call.includes('h')) {
              const hourMatch = meeting.hour_to_call.match(/^(\d+)h/);
              if (hourMatch && hourMatch[1]) {
                const hour = parseInt(hourMatch[1], 10);
                hourStart = `${hour.toString().padStart(2, '0')}:00`;
              }
            } 
            // Format "8:00-9:00" ou "15:00-16:00"
            else if (meeting.hour_to_call.includes(':')) {
              const hourMatch = meeting.hour_to_call.match(/^(\d+):/);
              if (hourMatch && hourMatch[1]) {
                const hour = parseInt(hourMatch[1], 10);
                hourStart = `${hour.toString().padStart(2, '0')}:00`;
              }
            }
            // Format simple "8" ou "15"
            else if (/^\d+$/.test(meeting.hour_to_call)) {
              const hour = parseInt(meeting.hour_to_call, 10);
              hourStart = `${hour.toString().padStart(2, '0')}:00`;
            }
          }
          
          const newEvent: Event = {
            id: meeting.id,
            time: hourStart,
            title: `Rendez-vous ${meeting.is_free ? 'gratuit' : 'payant'}`,
            isFinished: meeting.is_finish,
          };
          
          if (!formattedEvents[dateKey]) {
            formattedEvents[dateKey] = [];
          }
          formattedEvents[dateKey].push(newEvent);
        } else {
          withoutDate.push(meeting);
        }
      });
      
      // Log uniquement pour les erreurs ou cas exceptionnels
      Object.entries(formattedEvents).forEach(([date, events]) => {
        console.log(`${date}: ${events.length} événement(s)`);
      });
      
      setEvents(formattedEvents);
      setMeetingsWithoutDate(withoutDate);
    } catch (error) {
      console.error("Erreur lors du chargement des rendez-vous:", error);
      message.error("Impossible de charger les rendez-vous");
    } finally {
      setRefreshing(false);
    }
  };
  
  // Chargement initial des rendez-vous
  useEffect(() => {
    loadMeetings();
  }, []);

  // Scroll jusqu'à l'heure actuelle à l'ouverture
  useEffect(() => {
    if (currentHourRef.current) {
      currentHourRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  const handlePreviousWeek = (): void => {
    setSelectedDate(selectedDate.subtract(1, "week"));
  };

  const handleNextWeek = (): void => {
    setSelectedDate(selectedDate.add(1, "week"));
  };

  const handleToday = (): void => {
    setSelectedDate(dayjs());
  };

  const handleAddEvent = (values: {
    date: Dayjs;
    time: Dayjs;
    title: string;
    Id: string;
  }) => {
    const dateKey = values.date.format("YYYY-MM-DD");
    const newEvent: Event = {
      id: values.Id || "temp-id",
      time: values.time.format("HH:mm"),
      title: values.title,
      isFinished: false,
    };
    setEvents((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey] ? [...prev[dateKey], newEvent] : [newEvent],
    }));
    setIsAddModalVisible(false);
  };

  const showAddEventModal = () => {
    setIsAddModalVisible(true);
  };

  const closeAddEventModal = () => {
    setIsAddModalVisible(false);
  };

  const handleMeetingClick = async (meetingId: string) => {
    setLoadingMeeting(true);
    setIsMeetingModalVisible(true);
    
    try {
      // Trouver d'abord le rendez-vous dans les événements
      let fliiinkerId = "";
      
      // Parcourir tous les événements pour trouver le rendez-vous par son ID
      for (const dateKey in events) {
        const dayEvents = events[dateKey];
        const foundEvent = dayEvents.find(event => event.id === meetingId);
        if (foundEvent) {
          // Si on trouve l'événement, on essaie d'obtenir le fliiinkerId associé
          const rawMeeting = await supabaseClient
            .from("fliiinker_meeting")
            .select("fliiinker_id")
            .eq("id", meetingId)
            .single();
          
          if (rawMeeting.data && rawMeeting.data.fliiinker_id) {
            fliiinkerId = rawMeeting.data.fliiinker_id;
            break;
          }
        }
      }
      
      // Si on n'a pas trouvé dans les événements datés, chercher dans les rendez-vous sans date
      if (!fliiinkerId) {
        const foundMeeting = meetingsWithoutDate.find(m => m.id === meetingId);
        if (foundMeeting && (foundMeeting as ExtendedMeeting).fliiinker_id) {
          fliiinkerId = (foundMeeting as ExtendedMeeting).fliiinker_id || "";
        } else {
          // Si on n'a toujours pas trouvé, faire une requête directe
          const rawMeeting = await supabaseClient
            .from("fliiinker_meeting")
            .select("fliiinker_id")
            .eq("id", meetingId)
            .single();
          
          if (rawMeeting.data && rawMeeting.data.fliiinker_id) {
            fliiinkerId = rawMeeting.data.fliiinker_id;
          }
        }
      }
      
      if (fliiinkerId) {
        // Utiliser fetchFliiinkerCompleteProfile pour obtenir toutes les données en une seule requête
        const completeProfile = await fetchFliiinkerCompleteProfile(fliiinkerId, meetingId);
        
        if (completeProfile && completeProfile.meeting) {
          // Créer un objet compatible MeetingWithProfiles à partir du profil complet
          const meetingWithProfiles: MeetingWithProfiles = {
            meeting: completeProfile.meeting,
            fliiinkerProfile: {
              id: completeProfile.id,
              created_at: completeProfile.created_at,
              description: completeProfile.description,
              degree: completeProfile.degree,
              tagline: completeProfile.tagline || '',
              status: completeProfile.status || 'pending',
              is_pro: completeProfile.is_pro || false,
              is_validated: completeProfile.is_validated || false,
              avatar: completeProfile.avatar,
              spoken_languages: completeProfile.spoken_languages || [],
              status_config: completeProfile.status_config
            },
            publicProfile: {
              id: completeProfile.id,
              created_at: completeProfile.created_at,
              updated_at: completeProfile.created_at, // Utiliser created_at comme fallback
              email: completeProfile.email,
              last_name: completeProfile.last_name || "Pas de nom",
              first_name: completeProfile.first_name || "Pas de prénom",
              gender: (completeProfile.gender as "male" | "female" | "other") || "other",
              avatar: completeProfile.avatar,
              fliiinker_profile: null
            }
          };
          
          setSelectedMeeting(meetingWithProfiles);
        } else {
          message.error("Impossible de trouver les détails du rendez-vous");
        }
      } else {
        // Fallback sur l'ancienne méthode si on ne trouve pas le fliiinkerId
        const meetingWithProfiles = await fetchMeetingWithProfiles(meetingId);
        setSelectedMeeting(meetingWithProfiles);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails du rendez-vous:", error);
      message.error("Impossible de charger les détails du rendez-vous");
    } finally {
      setLoadingMeeting(false);
    }
  };

  const closeMeetingModal = () => {
    setIsMeetingModalVisible(false);
    setSelectedMeeting(null);
  };

  // Rafraîchissement manuel
  const handleRefresh = () => {
    loadMeetings();
  };

  // Générer les jours à afficher selon le mode de vue
  const getDaysToShow = () => {
    switch (viewMode) {
      case 'day':
        return [selectedDate];
      case 'week':
        return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
      case 'month':
        const startOfMonth = selectedDate.startOf('month');
        return Array.from(
          { length: selectedDate.daysInMonth() },
          (_, i) => startOfMonth.add(i, 'day')
        );
      default:
        return [];
    }
  };

  // Filtrer les rendez-vous sans date selon les critères de filtre
  const filteredMeetingsWithoutDate = meetingsWithoutDate.filter((meeting) => {
    if (showFinishedOnly && !showPendingOnly) {
      return meeting.is_finish;
    } else if (!showFinishedOnly && showPendingOnly) {
      return !meeting.is_finish;
    }
    return true;
  });

  const daysToShow = getDaysToShow();

  return (
    <Layout className="weekly-calendar" data-theme={mode}>
      <Header className="header" style={{ display: "flex", alignItems: "center" }}>
        <Button type="text" icon={<LeftOutlined />} onClick={handlePreviousWeek} />
        <Button type="text" icon={<RightOutlined />} onClick={handleNextWeek} />
        <Button type="primary" onClick={handleToday}>
          Aujourd'hui
        </Button>
        <Select 
          value={viewMode}
          onChange={setViewMode}
          style={{ width: 120, marginLeft: 16 }}
        >
          <Select.Option value="day">Jour</Select.Option>
          <Select.Option value="week">Semaine</Select.Option>
          <Select.Option value="month">Mois</Select.Option>
        </Select>
        <Button 
          icon={<SyncOutlined spin={refreshing} />} 
          onClick={handleRefresh} 
          style={{ marginLeft: 8 }}
          loading={refreshing}
        >
          Rafraîchir
        </Button>
        <Title level={4} className="header-title" style={{ marginLeft: "auto" }}>
          {startOfWeek.format("MMM D, YYYY")} – {endOfWeek.format("MMM D, YYYY")}
        </Title>
        <Button type="dashed" onClick={showAddEventModal} style={{ marginLeft: "auto" }}>
          Ajouter un événement <PlusCircleOutlined />
        </Button>
      </Header>
      <Layout>
        {siderVisible && (
          <Sider width={250} className="sider">
            <Calendar style={{ borderRadius: '50%'}}
              fullscreen={false}
              headerRender={({ value, onChange }) => (
                <div
                  className="calendar-header"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <Button onClick={() => onChange?.(value.subtract(1, "month"))}>
                    <LeftOutlined />
                  </Button>
                  <Title level={5} style={{ marginLeft: "auto" }}>
                    {value.format("MMMM YYYY")}
                  </Title>
                  <Button
                    onClick={() => onChange?.(value.add(1, "month"))}
                    style={{ marginLeft: "auto" }}
                  >
                    <RightOutlined />
                  </Button>
                </div>
              )}
              value={selectedDate}
              onSelect={setSelectedDate}
            />
            
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #303030' }}>
              <Title level={5} style={{ margin: '10px 0' }}>Mes agendas</Title>
              
              <div style={{ marginBottom: 10 }}>
                <Space>
                  <Switch 
                    size="small" 
                    checked={showFinishedOnly} 
                    onChange={(checked) => setShowFinishedOnly(checked)} 
                  />
                  <span>Terminés uniquement</span>
                </Space>
              </div>
              
              <div style={{ marginBottom: 10 }}>
                <Space>
                  <Switch 
                    size="small" 
                    checked={showPendingOnly} 
                    onChange={(checked) => setShowPendingOnly(checked)} 
                  />
                  <span>En attente uniquement</span>
                </Space>
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: 16 }}>
                <Title level={5} style={{ fontSize: '14px', marginBottom: '10px' }}>
                  Rendez-vous sans date ({filteredMeetingsWithoutDate.length})
                </Title>
                
                {filteredMeetingsWithoutDate.length > 0 ? (
                  filteredMeetingsWithoutDate.map((meeting) => (
                    <div 
                      key={meeting.id} 
                      style={{ 
                        padding: '8px', 
                        marginBottom: '8px', 
                        borderRadius: '4px',
                        backgroundColor: meeting.is_finish ? 'rgba(82, 196, 26, 0.2)' : 'rgba(24, 144, 255, 0.2)',
                        cursor: 'pointer',
                        border: `1px solid ${meeting.is_finish ? '#52c41a' : '#1890ff'}`
                      }}
                      onClick={() => handleMeetingClick(meeting.id)}
                    >
                      <Space>
                        {meeting.is_finish ? (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <ClockCircleOutlined style={{ color: '#1890ff' }} />
                        )}
                        <span>
                          Rendez-vous sans date
                        </span>
                      </Space>
                    </div>
                  ))
                ) : (
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description="Aucun rendez-vous" 
                    style={{ margin: '20px 0' }}
                  />
                )}
              </div>
            </div>
          </Sider>
        )}
        <Content className="content">
          <div className="calendar-grid">
            <div className="time-column" >
              <div className="header-cell" />
              {[...Array(24)].map((_, hour) => (
                <div key={hour} className="hour-cell">
                  {hour % 12 === 0 ? 12 : hour % 12}
                  {hour < 12 ? " AM" : " PM"}
                </div>
              ))}
            </div>
            {daysToShow.map(day => {
              const formattedDay = day.format("YYYY-MM-DD");
              const dayEvents = events[formattedDay] || [];
              
              return (
                <div key={day.format()} className="day-column">
                  <div className={`header-cell ${day.isSame(dayjs(), 'day') ? 'today' : ''}`}>
                    <div className="day-name">{day.format('ddd')}</div>
                    <div className="day-number">{day.format('D')}</div>
                  </div>
                  {[...Array(24)].map((_, hour) => {
                    // Afficher tous les événements pour cette heure
                    const hourEvents = dayEvents.filter(event => {
                      // Essayer différentes méthodes pour extraire l'heure
                      try {
                        if (event.time.includes(':')) {
                          const eventHour = parseInt(event.time.split(':')[0], 10);
                          return eventHour === hour;
                        } else {
                          const eventHour = parseInt(event.time, 10);
                          return eventHour === hour;
                        }
                      } catch (e) {
                        // En cas d'erreur, afficher quand même l'événement à l'heure 8 par défaut
                        console.error(`Erreur d'analyse de l'heure pour ${event.id}:`, e);
                        return hour === 8;
                      }
                    });
                    
                    return (
                      <div 
                        key={hour} 
                        className="time-slot"
                        ref={currentTime.hour() === hour ? currentHourRef : null}
                      >
                        {/* Ligne d'heure actuelle */}
                        {currentTime.hour() === hour && day.isSame(dayjs(), 'day') && (
                          <div
                            className="current-time-bar"
                            style={{
                              top: `${currentTime.minute()}%`,
                            }}
                          />
                        )}
                        
                        {/* Afficher les événements pour cette heure */}
                        {hourEvents.length > 0 && hourEvents.map((event, index) => (
                          <Tooltip 
                            key={index} 
                            title="Cliquez pour voir les détails" 
                            placement="top"
                          >
                            <div 
                              className="event"
                              style={{
                                backgroundColor: event.isFinished ? 'rgba(82, 196, 26, 0.2)' : 'rgba(24, 144, 255, 0.2)',
                                borderLeft: `3px solid ${event.isFinished ? '#52c41a' : '#1890ff'}`,
                              }}
                              onClick={() => handleMeetingClick(event.id)}
                            >
                              <div className="event-content">
                                {event.isFinished ? (
                                  <CheckCircleOutlined style={{ marginRight: 5, color: '#52c41a' }} />
                                ) : (
                                  <ClockCircleOutlined style={{ marginRight: 5, color: '#1890ff' }} />
                                )}
                                {event.title}
                              </div>
                              <div className="event-time">{event.time}</div>
                            </div>
                          </Tooltip>
                        ))}
                        
                        {/* Aucun événement mais on ajoute un debug pour les jours qui ont des événements */}
                        {hourEvents.length === 0 && dayEvents.length > 0 && hour === 0 && (
                          <div className="debug-info" style={{ fontSize: '10px', color: 'gray', padding: '2px' }}>
                            {dayEvents.length} événement(s) ce jour
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Content>
      </Layout>

      {/* Modal pour ajouter un événement */}
      <Modal
        title="Ajouter un événement"
        open={isAddModalVisible}
        onCancel={closeAddEventModal}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleAddEvent}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: "Veuillez sélectionner une date" }]}
          >
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item
            name="time"
            label="Heure"
            rules={[{ required: true, message: "Veuillez sélectionner une heure" }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item
            name="title"
            label="Titre"
            rules={[{ required: true, message: "Veuillez entrer un titre" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: "right" }}>
            <Button type="primary" htmlType="submit">
              Ajouter
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal pour afficher les détails d'un rendez-vous */}
      <MeetingModal 
        isVisible={isMeetingModalVisible}
        meeting={selectedMeeting}
        loading={loadingMeeting}
        onClose={closeMeetingModal}
      />
    </Layout>
  );
};

// Et à la fin du fichier, assurez-vous de définir les defaultProps
WeeklyCalendar.defaultProps = {
  siderVisible: true,
};

export default WeeklyCalendar;
