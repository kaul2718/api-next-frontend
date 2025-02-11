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
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const role = useUserRole();

  useEffect(() => {
    if (!session?.user?.token || !role) {
      return;
    }

    const fetchOrders = async () => {
      try {
        let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders`;

        if (role === "Técnico") {
          url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/tecnico`;
        } else if (role === "Cliente") {
          url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/cliente`;
        }

        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Error fetching orders: ${res.status}`);
        }

        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [session?.user?.token, role]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Datos para gráficos y métricas
  const orderCount = orders.length;
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.estado] = (acc[order.estado] || 0) + 1;
    return acc;
  }, {});

  const ordersByClient = orders.reduce((acc, order) => {
    const clientName = order.technician?.nombre || "Cliente no disponible";
    acc[clientName] = (acc[clientName] || 0) + 1;
    return acc;
  }, {});

  // Datos para el gráfico de barras (Órdenes por Cliente)
  const barChartData = {
    labels: Object.keys(ordersByClient),
    datasets: [
      {
        label: "Órdenes",
        data: Object.values(ordersByClient),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  // Datos para el gráfico de pastel (Órdenes por Estado)
  const pieChartData = {
    labels: Object.keys(ordersByStatus),
    datasets: [
      {
        label: "Órdenes",
        data: Object.values(ordersByStatus),
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
                  <h5 className="card-title mb-0">Total Órdenes</h5>
                </div>
                <div className="card-body">
                  <h2 className="card-text">{orderCount}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header bg-success text-white">
                  <h5 className="card-title mb-0">Órdenes por Estado</h5>
                </div>
                <div className="card-body">
                  <Pie data={pieChartData} />
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header bg-warning text-white">
                  <h5 className="card-title mb-0">Órdenes por Técnico</h5>
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
                  <h5 className="card-title mb-0">Actividad Reciente</h5>
                </div>
                <div className="card-body">
                  {/* Aquí puedes agregar una tabla de actividades recientes */}
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Orden de Trabajo</th>
                        <th>Cliente</th>
                        <th>Fecha de Ingreso</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id}>
                          <td>{order.workOrderNumber}</td>
                          <td>{order.client?.nombre || "Cliente no disponible"}</td>
                          <td>{new Date(order.fechaIngreso).toLocaleDateString()}</td>
                          <td>{order.estado}</td>
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