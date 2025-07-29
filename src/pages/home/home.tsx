import React, { useState } from "react";
import { Select } from "antd";
import GlobeWrapper from "../../components/globe/GlobeWrapper";
import { CustomerConfirmedCounter } from "../../components/linking/customerConfirmedCounter";
import { FliiinkerRefuseCounter } from "../../components/linking/fliiinkerRefuseCounter";
// import CombinedChart from "../../components/orderAnalytics/allOrderComponent";
import OrderCancelled from "../../components/orderAnalytics/orderCancelledCounter";
import OrderConfirmedCounter from "../../components/orderAnalytics/orderConfirmedCounter";
import SearchCounter from "../../components/searchAnalytics/searchCounter";
import "../../styles/home.css";
// import OrderEvolutionBarChart from '../../components/orderAnalytics/allOrderComponent';
// import ConversionRatePieChart from '../../components/searchAnalytics/searchAndOrdersChart';
// import SearchAndOrdersChart from '../../components/searchAnalytics/searchAndOrdersChart';
// import ClaimAndOrderChart from '../../components/claimAnalytics/claimAndOrderChart';
import ChartFallback from "../../components/charts/ChartFallback";
import MapFallback from "../../components/maps/MapFallback";
import RealtimeClaimComponentCounter from "../../components/claim/RealtimeClaimComponent";

const { Option } = Select;

export const HomePage: React.FC = () => {
  // État pour gérer le graphique sélectionné
  const [selectedChart, setSelectedChart] =
    useState<keyof typeof chartDescriptions>("orderEvolution");

  // Description des graphiques
  const chartDescriptions = {
    orderEvolution:
      "Graphique montrant l'évolution des commandes au fil du temps.",
    // conversionRate: "Graphique montrant le taux de conversion des recherches en commandes.",
    searchAndOrders:
      "Graphique combinant les recherches et les commandes pour une période donnée.",
    claimAndOrder:
      "Graphique combinant les réclamations et les commandes pour une période donnée.",
  };

  // Fonction pour afficher le graphique sélectionné
  const renderSelectedChart = () => {
    switch (selectedChart) {
      case "orderEvolution":
        return (
          <ChartFallback
            title="Évolution des commandes"
            message="Graphique d'évolution des commandes temporairement indisponible"
          />
        );
      // case 'conversionRate':
      //     return <ConversionRatePieChart />;
      case "searchAndOrders":
        return (
          <ChartFallback
            title="Recherches et commandes"
            message="Graphique des recherches et commandes temporairement indisponible"
          />
        );
      case "claimAndOrder":
        return (
          <ChartFallback
            title="Réclamations et commandes"
            message="Graphique des réclamations et commandes temporairement indisponible"
          />
        );
      default:
        return (
          <ChartFallback
            title="Évolution des commandes"
            message="Graphique d'évolution des commandes temporairement indisponible"
          />
        ); // Graphique par défaut
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <SearchCounter />
        <OrderConfirmedCounter />
        <OrderCancelled />
        <CustomerConfirmedCounter />
        <FliiinkerRefuseCounter />
        <RealtimeClaimComponentCounter />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          width: "100%",
          marginTop: "20px",
        }}
      >
        <div style={{ width: "60%", marginLeft: "20px" }}>
          <div style={{ marginBottom: "20px" }}>
            <Select
              defaultValue="orderEvolution" // Graphique par défaut
              style={{ width: 300 }}
              onChange={(value: "orderEvolution" | "searchAndOrders") =>
                setSelectedChart(value)
              }
            >
              <Option value="orderEvolution">Évolution des commandes</Option>
              <Option value="searchAndOrders">Recherches et commandes</Option>
              <Option value="claimAndOrder">Réclamations et commandes</Option>
            </Select>
            <p
              style={{ marginTop: "10px", fontStyle: "italic", color: "#666" }}
            >
              {chartDescriptions[selectedChart]}
            </p>
          </div>
          {renderSelectedChart()}
        </div>
      </div>
    </div>
  );
};
