import React, { useContext, useState } from "react";
import { DatePicker, Spin } from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import Plot from "react-plotly.js";
import { Data } from "plotly.js";
import { Order } from "../../types/orderTypes";
import { ColorModeContext } from "../../contexts/color-mode";
import { fetchAllOrderInPeriod } from "../../services/analytics/order/allOrderApi";
import { fetchSearchAnalyticsByPeriod } from "../../services/search/searchApi";

const { RangePicker } = DatePicker;

const SearchAndOrdersChart: React.FC = () => {
  const { mode } = useContext(ColorModeContext);
  const [isOrderLoading, setIsOrderLoading] = useState<boolean>(false);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<Date[]>([]);
  const [searchData, setSearchData] = useState<Date[]>([]); 
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour récupérer les commandes par date.
   */
   const fetchOrdersByDate = async (startDate: string, endDate: string) => {
    setIsOrderLoading(true);
    setError(null);
    console.log("🛑🛑🛑🛑🛑🛑🛑🛑");
    console.log("Fetching orders for period:", startDate, endDate);
    try {
      const orders = await fetchAllOrderInPeriod(startDate, endDate);
      setOrderData(orders);
    } catch (error) {
      console.error("------ Error on fetch order by date (allOrderComponent): ", error);
      setError("Failed to fetch orders. Please try again.");
    } finally {
      setIsOrderLoading(false);
    }
  };

  // Fonction pour récupérer les recherches
  const fetchSearchByDate = async (startDate: string, endDate: string) => {
    setIsSearchLoading(true);
    setError(null);
    try {
      const searches = await fetchSearchAnalyticsByPeriod(startDate, endDate);
      //console.log("Search Data:", searches); // Log pour vérifier les données des recherches
      setSearchData(searches);
    } catch (error) {
      console.error("------ Error on fetch search by date (searchCircle): ", error);
      setError("Failed to fetch search data. Please try again.");
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Gestion du changement de date
  const handleDateChange: RangePickerProps["onChange"] = (dates) => {
    if (dates) {
      const [start, end] = dates;
      const startDatePicker = start?.format("YYYY-MM-DD") || "";
      const endDatePicker = end?.format("YYYY-MM-DD") || "";
      setStartDate(startDatePicker);
      setEndDate(endDatePicker);

      // Appeler les fonctions pour récupérer les données
      fetchOrdersByDate(startDatePicker, endDatePicker);
      fetchSearchByDate(startDatePicker, endDatePicker);
    }
  };

  // Préparer les données pour Plotly
  const preparePlotlyData = (
    searchDates: Date[], // Tableau de dates
    orders: Date[]
  ): Data[] => {
    // Filtrer les dates invalides
    const validSearchDates = searchDates.filter((date) => dayjs(date).isValid());

    // Combiner toutes les dates uniques des recherches et des commandes
    const allDates = [
      ...validSearchDates.map((date) => dayjs(date).format("YYYY-MM-DD")), // Convertir les dates en format YYYY-MM-DD
      ...orders.map((order) => dayjs(order).format("YYYY-MM-DD")), // Convertir les dates en format YYYY-MM-DD
    ];

    // Créer un ensemble de dates uniques et les trier
    const uniqueDates = Array.from(new Set(allDates)).sort();

    // Compter le nombre de recherches pour chaque date
    const searchCounts = uniqueDates.map((date) => {
      return validSearchDates.filter((searchDate) => dayjs(searchDate).format("YYYY-MM-DD") === date).length;
    });

    // Compter le nombre de commandes pour chaque date
    const orderCounts = uniqueDates.map((date) => {
      return orders.filter((order) => dayjs(order).format("YYYY-MM-DD") === date).length;
    });

    console.log("Unique Dates:", uniqueDates); 
    console.log("Search Counts:", searchCounts);
    console.log("Order Counts:", orderCounts); 

    return [
      {
        type: "bar",
        x: uniqueDates,
        y: searchCounts,
        name: "Recherches",
        marker: { color: "#8884d8" },
      },
      {
        type: "scatter",
        x: uniqueDates,
        y: orderCounts,
        mode: "lines+markers",
        name: "Commandes",
        line: { color: "#82ca9d", shape: "spline" },
        marker: { color: "#82ca9d", size: 10 },
      },
    ];
  };

  // Préparer les données pour le graphique
  const plotlyData = preparePlotlyData(searchData || [], orderData || []);

  // Configuration du layout pour Plotly
  const layout = {
    title: "Recherches et Commandes par période",
    xaxis: {
      title: "Date",
    },
    yaxis: {
      title: "Nombre",
      type: "log" as const,
    },
    plot_bgcolor: mode === "light" ? "#fff" : "#333",
    paper_bgcolor: mode === "light" ? "#fff" : "#333",
    font: { color: mode === "light" ? "#000" : "#fff" },
    barmode: "overlay" as const,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <RangePicker onChange={handleDateChange} />
      {isOrderLoading || isSearchLoading ? (
        <Spin tip="Loading..." />
      ) : (
        <Plot
          data={plotlyData}
          layout={layout}
          style={{ width: "100%", height: "400px" }}
        />
      )}
    </div>
  );
};

export default SearchAndOrdersChart;