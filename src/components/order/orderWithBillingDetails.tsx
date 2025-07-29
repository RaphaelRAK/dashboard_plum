import React, { useState } from "react";
import { OrderWithBilling } from "../../types/orderWithBillingType";
import '../../styles/OrderWithBillingDetails.css';
import { EyeOutlined } from "@ant-design/icons";
import { Button, Modal, message } from "antd";
import { Customer } from "../../types/customerTypes";
import { FliiinkerProfile } from "../../types/fliiinkerProfileTypes";
import { FliiinkerDetails } from "../fliiinker/fliiinkerDetails";
import { CustomerDetails } from "../customer/customerDetails";
import { fetchFliiinkerProfiles } from "../../services/fliiinker/fliiinkerApi";
import { fetchCustomerProfiles } from "../../services/customer/customerApi";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { fetchPublicProfileById } from "../../store/slices/publicProfileSlice";

interface OrderWithBillingDetailsProps {
  order: OrderWithBilling;
  onClose: () => void;
}

export const OrderWithBillingDetails: React.FC<OrderWithBillingDetailsProps> = ({ order, onClose }) => {
  const {
    id,
    created_at,
    start_date,
    end_date,
    status,
    service_id,
    channel_id,
    customer_id,
    fliiinker_id,
    events,
    billing,
  } = order;

  const [isFliiinkerDetailsVisible, setFliiinkerDetailsVisible] = useState(false);
  const [isCustomerDetailsVisible, setCustomerDetailsVisible] = useState(false);
  const [selectedFliiinkerProfile, setSelectedFliiinkerProfile] = useState<FliiinkerProfile | null>(null);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<Customer | null>(null);

  const dispatch = useAppDispatch();

  const handleShowFliiinkerDetails = async (fliiinkerId: string) => {
    try {
      const profiles = await fetchFliiinkerProfiles();
      const profile = profiles.find((p: FliiinkerProfile) => p.id === fliiinkerId);
      if (profile) {
        console.log("Profil du Fliiinker trouvé :", profile);
        setSelectedFliiinkerProfile(profile);
        setFliiinkerDetailsVisible(true);
      } else {
        message.warning("Profil du Fliiinker non trouvé.");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des profils de Fliiinker:", error);
      message.error("Erreur lors de la récupération des profils de Fliiinker.");
    }
  };

  const handleShowCustomerDetails = (customerId: string) => {
    dispatch(fetchPublicProfileById(customerId))
      .unwrap()
      .then((profile) => {
        setSelectedCustomerProfile(profile);
        setCustomerDetailsVisible(true);
      })
      .catch((error) => {
        message.error("Erreur lors de la récupération du profil client");
      });
  };

const handleCloseFliiinkerDetails = () => {
    setFliiinkerDetailsVisible(false);
    setSelectedFliiinkerProfile(null);
};

const handleCloseCustomerDetails = () => {
    setCustomerDetailsVisible(false);
    setSelectedCustomerProfile(null);
};

    function Public_profile(public_profile: import("../../types/public_profileTypes").Public_profile | undefined): import("../../types/public_profileTypes").Public_profile {
        throw new Error("Function not implemented.");
    }

  return (
    <div className="order-details">
      <button onClick={onClose} className="close-button">
        Fermer
      </button>
      <h2 style={{ color: "#007aff" }}>Détails de la Commande</h2>
      <table>
        <thead>
          <tr>
            <th>Champ</th>
            <th>Valeur</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>ID</strong></td>
            <td>{id}</td>
          </tr>
          <tr>
            <td><strong>Statut</strong></td>
            <td>{status.replace(/_/g, " ")}</td>
          </tr>
          <tr>
            <td><strong>Créé le</strong></td>
            <td>{new Date(created_at).toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Date de Début</strong></td>
            <td>{new Date(start_date).toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Date de Fin</strong></td>
            <td>{new Date(end_date).toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Service ID</strong></td>
            <td>{service_id}</td>
          </tr>
          <tr>
            <td><strong>Channel ID</strong></td>
            <td>{channel_id !== null ? channel_id : "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Customer ID</strong></td>
            <td>
              {customer_id}
              <Button 
                icon={<EyeOutlined />} 
                onClick={() => handleShowCustomerDetails(customer_id)} 
                style={{ marginLeft: '8px' }} 
                size="small"
              />
            </td>
          </tr>
          <tr>
            <td><strong>Fliiinker ID</strong></td>
            <td>
              {fliiinker_id}
              <Button 
                icon={<EyeOutlined />} 
                onClick={() => handleShowFliiinkerDetails(fliiinker_id)} 
                style={{ marginLeft: '8px' }} 
                size="small"
              />
            </td>
          </tr>
          <tr>
            <td><strong>Événements</strong></td>
            <td>{events.length > 0 ? JSON.stringify(events) : "Aucun événement"}</td>
          </tr>
        </tbody>
      </table>

      {billing ? (
        <>
          <h2 style={{ color: '#007aff' }}>Détails de la Facturation</h2>
          <table>
            <thead>
              <tr>
                <th>Champ</th>
                <th>Valeur</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ID de Facturation</strong></td>
                <td>{billing.id}</td>
              </tr>
              <tr>
                <td><strong>Créé le</strong></td>
                <td>{new Date(billing.created_at).toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Montant Total</strong></td>
                <td>{billing.total_amount} €</td>
              </tr>
              <tr>
                <td><strong>Frais</strong></td>
                <td>{billing.fees} €</td>
              </tr>
              <tr>
                <td><strong>Fliiinker Rate</strong></td>
                <td>{billing.fliiinker_rate}%</td>
              </tr>
              <tr>
                <td><strong>Status de Paiement</strong></td>
                <td>{billing.payment_status.replace(/_/g, " ")}</td>
              </tr>
              <tr>
                <td><strong>Événements de Paiement</strong></td>
                <td>{billing.payment_events.length > 0 ? JSON.stringify(billing.payment_events) : "Aucun événement de paiement"}</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        <div className="billing-warning">
          <p style={{ color: "orange" }}><strong>Avertissement :</strong> Aucune facturation trouvée pour cette commande.</p>
        </div>
      )}

      {/* Modals pour afficher les détails */}
      <Modal
        title="Détails du Fliiinker"
        open={isFliiinkerDetailsVisible}
        onCancel={handleCloseFliiinkerDetails}
        footer={null}
      >
        {selectedFliiinkerProfile ? (
          <FliiinkerDetails
            fliiinkerProfile={selectedFliiinkerProfile}
            publicProfile={selectedFliiinkerProfile?.public_profile!}
            onClose={handleCloseFliiinkerDetails}
          />
        ) : (
          <p>Aucun détail disponible pour le Fliiinker.</p>
        )}
      </Modal>

      <Modal
        title="Détails du Client"
        open={isCustomerDetailsVisible}
        onCancel={handleCloseCustomerDetails}
        footer={null}
      >
        {selectedCustomerProfile ? (
          <CustomerDetails
            publicProfile={{
              ...selectedCustomerProfile,
              gender: selectedCustomerProfile?.gender || 'non spécifié',
              fliiinker_profile: null,
              updated_at: selectedCustomerProfile?.created_at || new Date().toISOString(),
            }}
            onClose={handleCloseCustomerDetails}
          />
        ) : (
          <p>Aucun détail disponible pour le client.</p>
        )}
      </Modal>
    </div>
  );
};
