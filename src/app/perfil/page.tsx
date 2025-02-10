"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Perfil = () => {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  const [editData, setEditData] = useState({});

  // Cargar la información del usuario desde la sesión
  useEffect(() => {
    if (session?.user) {
      setUserData(session.user.user);
      setEditData(session.user.user); // Cargar los datos en el formulario
    }
  }, [session]);

  // Mostrar un toast cuando el estado esté cargando
  useEffect(() => {
    if (status === "loading" || !userData) {
      toast.info("Cargando...");
    }
  }, [status, userData]);

  // Si está cargando, mostrar un mensaje en la interfaz
  if (status === "loading" || !userData) {
    return (
      <div className="d-flex vh-100">
        <Sidebar />
        <div className="d-flex flex-column flex-grow-1">
          <Header />
          <div className="container mt-5 flex-grow-1 p-4">
            <h2 className="text-center mb-4">Cargando perfil...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Manejo de cambios en el formulario de edición
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  // Enviar los datos al backend (ajustar la ruta según la API)
  const handleSaveChanges = async () => {
    try {
      const userId = session?.user?.user.id; // Asegúrate de que el `id` esté disponible en la sesión
      if (!userId) {
        alert("No se pudo encontrar el ID del usuario.");
        return;
      }
      const { id, ...updateData } = editData; // Excluir 'id'
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token || ""}`, // Añadir el Bearer Token aquí
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();  // Asegúrate de obtener los datos actualizados desde el backend
        setUserData(updatedUser);  // Actualiza userData con los datos más recientes
        toast.success('Cliente actualizado con éxito! ✅');
      } else {
        toast.error("¡Error al actualizar!");
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  return (
    <div className="d-flex vh-100">
      <Sidebar />
      <ToastContainer position="top-right" autoClose={5000} />

      <div className="d-flex flex-column flex-grow-1">
        <Header />

        <div className="container mt-5 flex-grow-1 p-4">
          <h2 className="text-center mb-4">Mi Perfil</h2>

          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card shadow-lg rounded">
                <div className="card-header bg-dark text-white text-center">
                  <h5 className="mb-0"><i className="bi bi-person-circle"></i> Información del Usuario</h5>
                </div>
                <div className="card-body">
                  <table className="table table-hover table-striped">
                    <tbody>
                      <tr><td><i className="bi bi-person"></i> Nombre</td><td>{userData.nombre}</td></tr>
                      <tr><td><i className="bi bi-envelope"></i> Email</td><td>{userData.correo}</td></tr>
                      <tr><td><i className="bi bi-telephone"></i> Teléfono</td><td>{userData.telefono}</td></tr>
                      <tr><td><i className="bi bi-house-door"></i> Dirección</td><td>{userData.direccion}</td></tr>
                      <tr><td><i className="bi bi-building"></i> Ciudad</td><td>{userData.ciudad}</td></tr>
                      <tr><td><i className="bi bi-person-badge"></i> Role</td><td>{userData.role}</td></tr>
                    </tbody>
                  </table>

                  <button
                    className="btn btn-primary w-100 mt-3"
                    data-bs-toggle="modal"
                    data-bs-target="#editProfileModal"
                  >
                    <i className="bi bi-pencil-square"></i> Editar Perfil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL PARA EDITAR PERFIL */}
        <div className="modal fade" id="editProfileModal" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-pencil-fill"></i> Editar Perfil</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body">
                <label className="form-label"><i className="bi bi-person"></i> Nombre</label>
                <input type="text" className="form-control" name="nombre" value={editData.nombre} onChange={handleChange} />

                <label className="form-label mt-2"><i className="bi bi-envelope"></i> Email</label>
                <input type="email" className="form-control" name="correo" value={editData.correo} onChange={handleChange} disabled />

                <label className="form-label mt-2"><i className="bi bi-telephone"></i> Teléfono</label>
                <input type="text" className="form-control" name="telefono" value={editData.telefono} onChange={handleChange} />

                <label className="form-label mt-2"><i className="bi bi-house-door"></i> Dirección</label>
                <input type="text" className="form-control" name="direccion" value={editData.direccion} onChange={handleChange} />

                <label className="form-label mt-2"><i className="bi bi-building"></i> Ciudad</label>
                <input type="text" className="form-control" name="ciudad" value={editData.ciudad} onChange={handleChange} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal"><i className="bi bi-x-circle"></i> Cancelar</button>
                <button type="button" className="btn btn-success" onClick={handleSaveChanges} data-bs-dismiss="modal"><i className="bi bi-check-circle"></i> Guardar Cambios</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Perfil;