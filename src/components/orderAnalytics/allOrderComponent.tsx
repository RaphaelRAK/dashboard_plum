import React, { useState, useContext } from "react";
import { DatePicker, Spin } from "antd";
import { fetchAllOrderInPeriodForAnalytics } from "../../services/analytics/order/allOrderApi";
import { Order } from "../../types/orderTypes";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { ColorModeContext } from "../../contexts/color-mode";
import Plot from 'react-plotly.js';
import { Data } from 'plotly.js';
import '../../styles/allOrder.css';

const { RangePicker } = DatePicker;

const OrderEvolutionBarChart: React.FC = () => {
  const { mode } = useContext(ColorModeContext);
  const [loading, setLoading] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<Order[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchOrdersByDate = async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      const orders = await fetchAllOrderInPeriodForAnalytics(startDate, endDate);
      setOrderData(orders);
    } catch (error) {
      console.error("------ Error on fetch order by date (allOrderComponent): ", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrdersByPeriod = (orders: Order[], startDate: string, endDate: string): { period: string; count: number; statuses: Record<string, number> }[] => {
    const periodCounts: Record<string, { count: number; statuses: Record<string, number> }> = {};
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    // Lister tous les statuts possibles
    const allStatuses = Array.from(new Set(orders.map((order) => order.status || "unknown")));

    // Générer toutes les dates dans la plage sélectionnée
    for (let date = start; date.isBefore(end) || date.isSame(end); date = date.add(1, "day")) {
      const formattedDate = date.format("YYYY-MM-DD");
      periodCounts[formattedDate] = {
        count: 0,
        statuses: Object.fromEntries(allStatuses.map((status) => [status, 0])), // Initialiser tous les statuts à 0
      };
    }

    // Compter les orders pour chaque période et chaque statut
    orders.forEach((order) => {
      const orderDate = dayjs(order.created_at).format("YYYY-MM-DD");
      if (periodCounts[orderDate] !== undefined) {
        periodCounts[orderDate].count++;
        const status = order.status || "unknown"; 
        periodCounts[orderDate].statuses[status]++;
      }
    });

    // Convertir en tableau pour le graphique
    return Object.entries(periodCounts).map(([period, { count, statuses }]) => ({
      period,
      count,
      statuses,
    }));
  };

  const handleDateChange: RangePickerProps["onChange"] = (dates) => {
    if (dates) {
      const [start, end] = dates;
      const startDatePicker = start?.format("YYYY-MM-DD") || "";
      const endDatePicker = end?.format("YYYY-MM-DD") || "";
      setStartDate(startDatePicker);
      setEndDate(endDatePicker);
      fetchOrdersByDate(startDatePicker, endDatePicker);
    }
  };

  // Utiliser les dates sélectionnées pour filtrer les données
  const data = orderData.length > 0 ? getOrdersByPeriod(orderData, startDate, endDate) : [];

  // Préparer les données pour Plotly
  const plotlyData: Data[] = [
    {
      type: 'bar' as const,
      x: data.map((item) => item.period),
      y: data.map((item) => item.count),
      name: 'Nombre d\'orders',
      marker: { color: mode === "dark" ? "#8884d8" : "#82ca9d" }
    },
    ...Object.keys(data[0]?.statuses || {}).map((status) => ({
      type: 'scatter' as const,
      x: data.map((item) => item.period),
      y: data.map((item) => item.statuses[status] || 0),
      mode: 'lines+markers' as const,
      name: status,
      line: { shape: 'spline' as const, smoothing: 1.3 }, // La couleur sera attribuée automatiquement
      marker: {} // La couleur sera attribuée automatiquement
    }))
  ];

  const layout = {
    title: 'Évolution des commandes',
    xaxis: { title: 'Période' },
    yaxis: { title: 'Nombre de commandes' },
    plot_bgcolor: mode === "dark" ? "#333" : "#fff",
    paper_bgcolor: mode === "dark" ? "#333" : "#fff",
    font: { color: mode === "dark" ? "#fff" : "#000" },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <RangePicker onChange={handleDateChange} />
      {loading ? (
        <Spin tip="Loading..." />
      ) : (
        <Plot
          data={plotlyData}
          layout={layout}
        />
      )}
    </div>
  );
};

export default OrderEvolutionBarChart;