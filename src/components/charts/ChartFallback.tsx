import React from "react";
import { Card, Empty } from "antd";
import { BarChartOutlined } from "@ant-design/icons";

interface ChartFallbackProps {
  width?: number | string;
  height?: number | string;
  message?: string;
  style?: React.CSSProperties;
  title?: string;
}

const ChartFallback: React.FC<ChartFallbackProps> = ({
  width = "100%",
  height = 400,
  message = "Graphique temporairement indisponible",
  style = {},
  title,
}) => {
  return (
    <Card
      title={title}
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Empty
          image={
            <BarChartOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
          }
          description={
            <div>
              <div style={{ marginBottom: "8px" }}>{message}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Les composants de graphiques sont en cours de mise à jour
              </div>
            </div>
          }
        />
      </div>
    </Card>
  );
};

export default ChartFallback;
