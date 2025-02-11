import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const BarChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: "Órdenes",
        data: data.map(d => d.value),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Órdenes por Cliente",
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};