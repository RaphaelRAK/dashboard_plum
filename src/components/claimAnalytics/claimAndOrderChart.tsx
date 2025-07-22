import { DatePicker, Spin } from "antd";
import { useContext } from "react";
import { Claim } from "../../types/claim";
import { useState } from "react";
import { Order } from "../../types/orderTypes";
import { ColorModeContext } from "../../contexts/color-mode";
import { fetchAllOrderInPeriod } from "../../services/analytics/order/allOrderApi";
import { fetchAllClaimInPeriod } from "../../services/claims/claimApi";
import { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import Plot from "react-plotly.js";
import { Data } from "plotly.js";

const { RangePicker } = DatePicker;

const ClaimAndOrderChart: React.FC = () => {
    const { mode } = useContext(ColorModeContext);
    const [isOrderLoading, setIsOrderLoading] = useState<boolean>(false);
    const [isClaimLoading, setIsClaimLoading] = useState<boolean>(false);
    const [orderData, setOrderData] = useState<Date[]>([]);
    const [claimData, setClaimData] = useState<Date[]>([]);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    // Fonction pour récupérer les commandes
    const fetchOrdersByDate = async (startDate: string, endDate: string) => {
        setIsOrderLoading(true);
        setError(null);
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

      const fetchClaimsByDate = async (startDate: string, endDate: string) => {
        setIsClaimLoading(true);
        setError(null);
        try {
            const claims = await fetchAllClaimInPeriod(startDate, endDate);
            setClaimData(claims); // claims est de type Claim[]
        } catch (error) {
            console.error("------ Error on fetch claim by date (claimAndOrderChart): ", error);
            setError("Failed to fetch claims. Please try again.");
        } finally {
            setIsClaimLoading(false);
        }
    };

      const handleDateChange: RangePickerProps["onChange"] = (dates) => {
        if (dates) {
          const [start, end] = dates;
          const startDatePicker = start?.format("YYYY-MM-DD") || "";
          const endDatePicker = end?.format("YYYY-MM-DD") || "";
          setStartDate(startDatePicker);
          setEndDate(endDatePicker);

          // Appeler les fonctions pour récupérer les données
          fetchOrdersByDate(startDatePicker, endDatePicker);
          fetchClaimsByDate(startDatePicker, endDatePicker);
        }
      };

      // Préparer les données pour l'histogramme des recherches et les points des commandes
      const preparePlotlyData = (
        orders: Date[],
        claims: Date[]
      ): Data[] => {

        // Filtrer les dates invalides
        const validOrders = claims.filter((date) => dayjs(date).isValid());

        // Combiner toutes les dates uniques des recherches et des commandes
        
        const allDates = [
          ...validOrders.map((date) => dayjs(date).format("YYYY-MM-DD")), // Convertir les dates en format YYYY-MM-DD
          ...orders.map((order) => dayjs(order).format("YYYY-MM-DD")), // Convertir les dates en format YYYY-MM-DD
        ];

        // Créer un ensemble de dates uniques et les trier
        // ici Set permet de supprimer les doublons
        const uniqueDates = Array.from(new Set(allDates)).sort(); 

        // Compter le nombre de réclamations et de commandes pour chaque date
        const claimCounts = uniqueDates.map((date) => {
          // ici filter permet de filtrer les dates qui sont égales à la date de la réclamation
          return claims.filter((claimDate) => dayjs(claimDate).format("YYYY-MM-DD") === date).length;
        });

        const orderCounts = uniqueDates.map((date) => {
          return orders.filter((order) => dayjs(order).format("YYYY-MM-DD") === date).length;
        });

        console.log("Unique Dates:", uniqueDates); 
        console.log("Claim Counts:", claimCounts); 
        console.log("Order Counts:", orderCounts); 

        return [
            {
                type: "bar",
                x: uniqueDates,
                y: orderCounts,
                name: "Commandes",
                marker: { color: "#8884d8" },
              },
              {
                type: "scatter",
                x: uniqueDates,
                y: claimCounts,
                mode: "lines+markers",
                name: "Réclamations",
                line: { color: "#82ca9d", shape: "spline" },
                marker: { color: "#82ca9d", size: 10 },
              },
        ];
    };

    const plotlyData = preparePlotlyData(orderData || [], claimData || []);

    const layout = {
        title: "Réclamations et Commandes par période",
        xaxis: { 
            title: "Date", 
            type: "category" as const, 
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
            {isOrderLoading || isClaimLoading ? (
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


export default ClaimAndOrderChart;
