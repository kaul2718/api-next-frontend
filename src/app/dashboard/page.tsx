"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import useUserRole from "@/hooks/useUserRole";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const DashboardPage = () => {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const role = useUserRole();

  useEffect(() => {
    if (!session?.user?.token || !role) {
      return;
    }

    const fetchTransactions = async () => {
      try {
        let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions`;

        if (role === "Administrador") {
          url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/admin`;
        } else if (role === "Cliente") {
          url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/transactions/cliente`;
        }

        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Error fetching transactions: ${res.status}`);
        }

        const data = await res.json();
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [session?.user?.token, role]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Datos para gráficos y métricas
  const transactionCount = transactions.length;
  const transactionsByStatus = transactions.reduce((acc, transaction) => {
    acc[transaction.estado] = (acc[transaction.estado] || 0) + 1;
    return acc;
  }, {});

  const transactionsByAccount = transactions.reduce((acc, transaction) => {
    const accountName = transaction.cuenta?.nombre || "Cuenta no disponible";
    acc[accountName] = (acc[accountName] || 0) + 1;
    return acc;
  }, {});

  // Datos para el gráfico de barras (Transacciones por Cuenta)
  const barChartData = {
    labels: Object.keys(transactionsByAccount),
    datasets: [
      {
        label: "Transacciones",
        data: Object.values(transactionsByAccount),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  // Datos para el gráfico de pastel (Transacciones por Estado)
  const pieChartData = {
    labels: Object.keys(transactionsByStatus),
    datasets: [
      {
        label: "Transacciones",
        data: Object.values(transactionsByStatus),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
      },
    ],
  };

  return (
    <div className="d-flex flex-column vh-100">
      <Sidebar />
      <div className="content flex-grow-1 pt-5">
        <Header />
        <div className="container mt-4">
          <h1 className="mb-4">Dashboard</h1>

          {/* Tarjetas de métricas */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="card-title mb-0">Total Transacciones</h5>
                </div>
                <div className="card-body">
                  <h2 className="card-text">{transactionCount}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header bg-success text-white">
                  <h5 className="card-title mb-0">Transacciones por Estado</h5>
                </div>
                <div className="card-body">
                  <Pie data={pieChartData} />
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header bg-warning text-white">
                  <h5 className="card-title mb-0">Transacciones por Cuenta</h5>
                </div>
                <div className="card-body">
                  <Bar data={barChartData} options={{ responsive: true }} />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header bg-info text-white">
                  <h5 className="card-title mb-0">Transacciones Recientes</h5>
                </div>
                <div className="card-body">
                  {/* Aquí puedes agregar una tabla de transacciones recientes */}
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Transacción</th>
                        <th>Cuenta</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 5).map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{transaction.transactionNumber}</td>
                          <td>{transaction.cuenta?.nombre || "Cuenta no disponible"}</td>
                          <td>{new Date(transaction.fecha).toLocaleDateString()}</td>
                          <td>{transaction.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
