import { useEffect, useState } from "react";
import { Claim } from "../../types/claim";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Statistic } from "antd";
import { Card } from "antd";
import {
  subscribeToClaimNotResolved,
  unsubscribeFromClaimNotResolved,
} from "../../services/claims/realtimeClaimApi";

const RealtimeClaimComponentCounter = () => {
  const [claims, setClaims] = useState<Claim[]>([]);

  // Abonnement aux changements en temps réel sur les réclamations résolues
  useEffect(() => {
    const channel = subscribeToClaimNotResolved(setClaims, (error) =>
      console.error("Erreur:", error),
    );

    return () => unsubscribeFromClaimNotResolved(channel);
  }, []);

  return (
    <Card style={{ alignContent: "center" }}>
      <Statistic
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ExclamationCircleOutlined />
            <span>Réclamations non résolues</span>
          </div>
        }
        value={claims.length}
        valueStyle={{
          color: "#ff4d4f",
          fontSize: "2.5rem",
          textAlign: "center",
        }}
      />
    </Card>
  );
};

export default RealtimeClaimComponentCounter;
