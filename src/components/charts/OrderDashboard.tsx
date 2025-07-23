import React from "react";
import { Card, Space, Row, Col } from "antd";
import CombinedChart from "./CombinedChart";
import { fetchAllOrderInPeriodForAnalytics } from "../../api/order";
import { fetchAllClaimInPeriod } from "../../services/claims/claimApi";
import { Data } from "plotly.js";

const OrderDashboard: React.FC = () => {
  const fetchFunctions = {
    orders: fetchAllOrderInPeriodForAnalytics,
    claims: fetchAllClaimInPeriod,
  };

  const prepareChartData = (data: { [key: string]: any[] }): Data[] => {
    const plotData: Data[] = [];
    
    if (data.orders && data.orders.length > 0) {
      // Regrouper les commandes par date
      const ordersByDate: { [date: string]: number } = {};
      data.orders.forEach((order) => {
        const date = new Date(order.createdAt).toISOString().split("T")[0];
        ordersByDate[date] = (ordersByDate[date] || 0) + 1;
      });

      // Convertir en format pour Plotly
      const orderDates = Object.keys(ordersByDate).sort();
      const orderCounts = orderDates.map((date) => ordersByDate[date]);

      plotData.push({
        x: orderDates,
        y: orderCounts,
        type: "bar",
        name: "Commandes",
        marker: { color: "#1890ff" },
      });
    }

    if (data.claims && data.claims.length > 0) {
      // Regrouper les réclamations par date
      const claimsByDate: { [date: string]: number } = {};
      data.claims.forEach((claim) => {
        const date = new Date(claim.createdAt).toISOString().split("T")[0];
        claimsByDate[date] = (claimsByDate[date] || 0) + 1;
      });

      // Convertir en format pour Plotly
      const claimDates = Object.keys(claimsByDate).sort();
      const claimCounts = claimDates.map((date) => claimsByDate[date]);

      plotData.push({
        x: claimDates,
        y: claimCounts,
        type: "scatter",
        mode: "lines+markers",
        name: "Réclamations",
        marker: { color: "#ff4d4f" },
        line: { color: "#ff4d4f" },
      });
    }

    return plotData;
  };

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Tableau de bord des commandes" bordered={false}>
            <CombinedChart
              title="Évolution des commandes et réclamations"
              fetchDataFunctions={fetchFunctions}
              prepareDataFunction={prepareChartData}
              xAxisTitle="Date"
              yAxisTitle="Nombre"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OrderDashboard; 