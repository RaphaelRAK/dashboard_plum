import React, { useContext, useState } from "react";
import { DatePicker, Spin, Select } from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import Plot from "react-plotly.js";
import { Data } from "plotly.js";
import { ColorModeContext } from "../../contexts/color-mode";

const { RangePicker } = DatePicker;
const { Option } = Select;

export interface ChartSeries {
  name: string;
  data: any[];
  type: "bar" | "scatter" | "pie" | "line";
  color?: string;
}

interface CombinedChartProps {
  title: string;
  fetchDataFunctions: {
    [key: string]: (startDate: string, endDate: string) => Promise<any[]>;
  };
  prepareDataFunction: (data: { [key: string]: any[] }) => Data[];
  xAxisTitle?: string;
  yAxisTitle?: string;
  useLogScale?: boolean;
}

const CombinedChart: React.FC<CombinedChartProps> = ({
  title,
  fetchDataFunctions,
  prepareDataFunction,
  xAxisTitle = "Date",
  yAxisTitle = "Nombre",
  useLogScale = false,
}) => {
  const { mode } = useContext(ColorModeContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{ [key: string]: any[] }>({});

  const fetchAllData = async (startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);
    
    const newData: { [key: string]: any[] } = {};
    const fetchPromises = Object.entries(fetchDataFunctions).map(async ([key, fetchFunc]) => {
      try {
        const data = await fetchFunc(startDate, endDate);
        newData[key] = data;
      } catch (error) {
        console.error(`Error fetching ${key} data:`, error);
        setError(`Échec lors de la récupération des données ${key}. Veuillez réessayer.`);
      }
    });

    await Promise.all(fetchPromises);
    setChartData(newData);
    setIsLoading(false);
  };

  const handleDateChange: RangePickerProps["onChange"] = (dates) => {
    if (dates) {
      const [start, end] = dates;
      const startDatePicker = start?.format("YYYY-MM-DD") || "";
      const endDatePicker = end?.format("YYYY-MM-DD") || "";
      setStartDate(startDatePicker);
      setEndDate(endDatePicker);
      fetchAllData(startDatePicker, endDatePicker);
    }
  };

  const plotlyData = Object.keys(chartData).length > 0 
    ? prepareDataFunction(chartData) 
    : [];

  const layout = {
    title: title,
    xaxis: {
      title: xAxisTitle,
      type: "category" as const,
    },
    yaxis: {
      title: yAxisTitle,
      type: useLogScale ? "log" as const : "linear" as const,
    },
    plot_bgcolor: mode === "light" ? "#fff" : "#333",
    paper_bgcolor: mode === "light" ? "#fff" : "#333",
    font: { color: mode === "light" ? "#000" : "#fff" },
    barmode: "overlay" as const,
    legend: {
      orientation: "h" as const,
      y: -0.2,
    },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div style={{ marginBottom: "20px", width: "100%", display: "flex", justifyContent: "center" }}>
        <RangePicker onChange={handleDateChange} />
      </div>
      {isLoading ? (
        <Spin tip="Chargement..." />
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

export default CombinedChart; 