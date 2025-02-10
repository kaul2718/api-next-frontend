"use client";

import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/footer"; // Asegúrate de importar correctamente
import Header from "@/components/Header";

const Dashboard = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  console.log(session?.user?.token);

  const getOrder = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user?.token}` || "",
      },
    });
    const data = await res.json();
    console.log(data);
  };

  return (
    <div className="d-flex vh-100">
      {/* Sidebar a la izquierda */}
      <Sidebar />

      {/* Contenedor principal con Header, contenido y Footer */}
      <div className="d-flex flex-column flex-grow-1">
        <Header />
        <div className="p-4 flex-grow-1">
          <h1>Dashboard</h1>
          <button onClick={getOrder} className="btn btn-primary">
            Get Orders
          </button>
          <pre>
            <code>{JSON.stringify(session, null, 2)}</code>
          </pre>
        </div>
        
        {/* Footer fijo abajo */}
      </div>
    </div>
  );
};

export default Dashboard;
