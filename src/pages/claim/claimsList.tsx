import React, { useContext, useEffect, useState } from "react";
import ClaimComponent from "../../components/claim/claimComponent";
import { ColorModeContext } from "../../contexts/color-mode";
import { fetchClaimsWithMessages } from "../../services/claims/claimApi";
import { Spin, Typography, Alert } from "antd";

const { Title } = Typography;

const ClaimList: React.FC = () => {
  const { mode } = useContext(ColorModeContext);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        const claimsWithMessages = await fetchClaimsWithMessages();
        setClaims(claimsWithMessages);
      } catch (err: any) {
        setError(err.message);
        console.error("Erreur lors du chargement des données initiales:", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isMounted]);

  // // Les messages seront chargés uniquement lorsqu'une réclamation sera sélectionnée
  // const loadMessagesForClaim = async (claimId: number) => {
  //     try {
  //         const messagesData = await fetchMessagesByChannel(claimId.toString());
  //         return messagesData;
  //     } catch (err: any) {
  //         console.error('Erreur lors du chargement des messages:', err);
  //         throw err;
  //     }
  // };

  const containerStyle = {
    backgroundColor: mode === "dark" ? "#141414" : "#f8f9fa",
    color: mode === "dark" ? "#e8eaed" : "#202124",
    minHeight: "calc(100vh - 64px)",
    padding: "0",
    position: "relative" as const,
    width: "100%",
  };

  if (loading) {
    return (
      <div
        style={{
          ...containerStyle,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column" as const,
          gap: "1rem",
        }}
      >
        <Spin size="large" />
        <Typography.Text>Chargement des réclamations...</Typography.Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <Alert
          message="Erreur"
          description={`Une erreur est survenue lors du chargement des réclamations: ${error}`}
          type="error"
          showIcon
          style={{ maxWidth: "600px", margin: "2rem auto" }}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2>Réclamations</h2>
      <ClaimComponent claims={claims} messages={[]} />
    </div>
  );
};

export default ClaimList;
