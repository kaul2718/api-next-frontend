"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddOrderPage = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        clientId: "",
        technicianId: "",
        workOrderNumber: "",
        equipoId: "",
        problemaReportado: "",
        accesorios: "",
        Estado: "En Revisión",
        tareaRealizar: "",
        fechaPrometidaEntrega: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Estados para el modal de cliente
    const [addModal, setAddModal] = useState(false);
    const [newClientData, setNewClientData] = useState<any>({});

    const [emailError, setEmailError] = useState("");
    const [cedulaError, setCedulaError] = useState("");
    const [telefonoError, setTelefonoError] = useState("");

    // Estados para el modal de equipo
    const [addEquipoModal, setAddEquipoModal] = useState(false);
    const [newEquipoData, setNewEquipoData] = useState({
        tipoEquipo: "",
        marca: "",
        modelo: "",
        numeroSerie: "",
    });

    const fetchClientsAndTechnicians = async () => {
        try {
            const clientsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/all?page=1&limit=10&role=Cliente`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.token}`,
                },
            });

            const techniciansRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/all?page=1&limit=10&role=Técnico`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.token}`,
                },
            });

            if (!clientsRes.ok || !techniciansRes.ok) {
                throw new Error("Error al obtener datos");
            }

            const clientsData = await clientsRes.json();
            const techniciansData = await techniciansRes.json();

            setClients(clientsData);
            setTechnicians(techniciansData);
        } catch (error) {
            console.error("Error:", error);
            setError("Error al cargar los datos. Inténtalo de nuevo.");
        }
    };

    useEffect(() => {
        if (!session?.user?.token) return;
        fetchClientsAndTechnicians();
    }, [session?.user?.token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!session?.user?.token) {
            toast.error("No estás autenticado.");
            return;
        }

        // Convertir accesorios a un array
        const accesoriosArray = formData.accesorios.split(",").map((item) => item.trim());

        // Preparar los datos para enviar al backend
        const orderData = {
            workOrderNumber: formData.workOrderNumber,
            fechaIngreso: new Date().toISOString(),
            problemaReportado: formData.problemaReportado,
            accesorios: accesoriosArray,
            Estado: formData.Estado,
            tareaRealizar: formData.tareaRealizar,
            fechaPrometidaEntrega: new Date(formData.fechaPrometidaEntrega).toISOString(),
            technicianId: parseInt(formData.technicianId, 10),
            clientId: parseInt(formData.clientId, 10),
            equipoId: parseInt(formData.equipoId, 10),
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.user.token}`,
                },
                body: JSON.stringify(orderData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Error al crear la orden:", errorData);
                setError(errorData.message || "Error al guardar la orden");
                return;
            }

            router.push("/orders");
        } catch (error) {
            console.error("Error:", error);
            setError("Error al guardar la orden");
        } finally {
            setLoading(false);
        }
    };

    const handleAddEquipoChange = (e) => {
        const { name, value } = e.target;
        setNewEquipoData({ ...newEquipoData, [name]: value });
    };

    const handleAddEquipo = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/equipos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.token}`,
                },
                body: JSON.stringify(newEquipoData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Error response from server:", errorData);
                throw new Error(errorData.message || "Error al agregar equipo");
            }

            const equipoAgregado = await res.json();

            // Actualizar el estado del formulario con el ID del equipo agregado
            setFormData((prevData) => ({
                ...prevData,
                equipoId: equipoAgregado.id,
            }));

            setAddEquipoModal(false);
            setNewEquipoData({
                tipoEquipo: "",
                marca: "",
                modelo: "",
                numeroSerie: "",
            });
            toast.success("Equipo agregado con éxito ✅");
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al agregar el equipo");
        }
    };

    const handleAddChange = (e) => {
        const { name, value } = e.target;
        setNewClientData({ ...newClientData, [name]: value });

        if (name === "correo") validateEmail(value);
        else if (name === "cedula") validateCedula(value);
        else if (name === "telefono") validateTelefono(value);
    };

    const handleAddClient = async (e) => {
        e.preventDefault();

        if (emailError || cedulaError || telefonoError) {
            toast.error("Por favor, corrige los errores antes de enviar.");
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.token}`,
                },
                body: JSON.stringify({ ...newClientData, role: "Cliente" }),
            });

            if (!res.ok) throw new Error("Error al agregar cliente");

            await fetchClientsAndTechnicians();
            setAddModal(false);
            setNewClientData({});
            toast.success("Cliente agregado con éxito ✅");
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al agregar el cliente");
        }
    };

    const validateEmail = (email) => {
        const emailExists = clients.some((user) => user.correo === email);
        setEmailError(emailExists ? "El correo ya está registrado." : "");
    };

    const validateCedula = (cedula) => {
        const cedulaExists = clients.some((user) => user.cedula === cedula);
        setCedulaError(cedulaExists ? "La cédula ya está registrada." : "");
    };

    const validateTelefono = (telefono) => {
        const telefonoExists = clients.some((user) => user.telefono === telefono);
        setTelefonoError(telefonoExists ? "El teléfono ya está registrado." : "");
    };

    return (
        <div className="d-flex flex-column vh-100">
            <Sidebar />
            <ToastContainer position="top-right" autoClose={5000} />

            <div className="content flex-grow-1 pt-5">
                <Header />

                <div className="container mt-4">
                    <h1 className="mb-4 text-primary">Agregar Nueva Orden</h1>
                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={handleSubmit} className="bg-light p-4 rounded shadow-sm">
                        <div className="mb-3">
                            <label htmlFor="clientId" className="form-label">Cliente</label>
                            <div className="d-flex gap-2">
                                <select
                                    className="form-select"
                                    id="clientId"
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione un cliente</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.nombre}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="btn btn-primary d-flex align-items-center"
                                    onClick={() => setAddModal(true)}
                                >
                                    <i className="bi bi-plus me-2"></i> Crear Cliente
                                </button>
                            </div>
                            {formData.clientId && (
                                <p className="mt-2">
                                    <strong>{clients.find(client => client.id === formData.clientId)?.nombre}</strong>
                                </p>
                            )}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="technicianId" className="form-label">Técnico</label>
                            <select
                                className="form-select"
                                id="technicianId"
                                name="technicianId"
                                value={formData.technicianId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Seleccione un técnico</option>
                                {technicians.map((technician) => (
                                    <option key={technician.id} value={technician.id}>
                                        {technician.nombre}
                                    </option>
                                ))}
                            </select>
                            {formData.technicianId && (
                                <p className="mt-2">
                                    <strong>{technicians.find(technician => technician.id === formData.technicianId)?.nombre}</strong>
                                </p>
                            )}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="workOrderNumber" className="form-label">Número de Orden de Trabajo</label>
                            <input
                                type="text"
                                className="form-control"
                                id="workOrderNumber"
                                name="workOrderNumber"
                                value={formData.workOrderNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="equipoId" className="form-label">Equipo</label>
                            <div className="d-flex gap-2">
                                <input
                                    type="text"
                                    className="form-control"
                                    id="equipoId"
                                    name="equipoId"
                                    value={formData.equipoId}
                                    onChange={handleChange}
                                    placeholder="ID del equipo"
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn btn-primary d-flex align-items-center"
                                    onClick={() => setAddEquipoModal(true)}
                                >
                                    <i className="bi bi-plus me-2"></i> Agregar Equipo
                                </button>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="problemaReportado" className="form-label">Problema Reportado</label>
                            <input
                                type="text"
                                className="form-control"
                                id="problemaReportado"
                                name="problemaReportado"
                                value={formData.problemaReportado}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="accesorios" className="form-label">Accesorios Dejados (separados por comas)</label>
                            <input
                                type="text"
                                className="form-control"
                                id="accesorios"
                                name="accesorios"
                                value={formData.accesorios}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="Estado" className="form-label">Estado</label>
                            <select
                                className="form-control"
                                id="Estado"
                                name="Estado"
                                value={formData.Estado}
                                onChange={handleChange}
                                required
                            >
                                <option value="En Revisión">En Revisión</option>
                                <option value="En Progreso">En Progreso</option>
                                <option value="Completado">Completado</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="tareaRealizar" className="form-label">Tarea a Realizar</label>
                            <input
                                type="text"
                                className="form-control"
                                id="tareaRealizar"
                                name="tareaRealizar"
                                value={formData.tareaRealizar}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="fechaPrometidaEntrega" className="form-label">Fecha Prometida de Entrega</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                id="fechaPrometidaEntrega"
                                name="fechaPrometidaEntrega"
                                value={formData.fechaPrometidaEntrega}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar Orden"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Modal para agregar equipo */}
            {addEquipoModal && (
                <>
                    <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} aria-modal="true">
                        <div className="modal-dialog modal-lg" style={{ marginTop: "80px" }}>
                            <div className="modal-content">
                                <div className="modal-header bg-dark text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-plus"></i> Agregar Equipo
                                    </h5>
                                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setAddEquipoModal(false)}></button>
                                </div>
                                <form onSubmit={handleAddEquipo}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label htmlFor="tipoEquipo" className="form-label">Tipo de Equipo</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="tipoEquipo"
                                                name="tipoEquipo"
                                                value={newEquipoData.tipoEquipo}
                                                onChange={handleAddEquipoChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="marca" className="form-label">Marca</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="marca"
                                                name="marca"
                                                value={newEquipoData.marca}
                                                onChange={handleAddEquipoChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="modelo" className="form-label">Modelo</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="modelo"
                                                name="modelo"
                                                value={newEquipoData.modelo}
                                                onChange={handleAddEquipoChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="numeroSerie" className="form-label">Número de Serie</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="numeroSerie"
                                                name="numeroSerie"
                                                value={newEquipoData.numeroSerie}
                                                onChange={handleAddEquipoChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setAddEquipoModal(false)}>
                                            <i className="bi bi-x-circle"></i> Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-success">
                                            <i className="bi bi-check-circle"></i> Guardar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* Modal para agregar cliente */}
            {addModal && (
                <>
                    <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} aria-modal="true">
                        <div className="modal-dialog modal-lg" style={{ marginTop: "80px" }}>
                            <div className="modal-content">
                                <div className="modal-header bg-dark text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-plus"></i> Agregar Cliente
                                    </h5>
                                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setAddModal(false)}></button>
                                </div>
                                <form onSubmit={handleAddClient}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label htmlFor="nombre" className="form-label">Nombre</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="nombre"
                                                name="nombre"
                                                value={newClientData.nombre || ""}
                                                onChange={handleAddChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="cedula" className="form-label">Cédula</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="cedula"
                                                name="cedula"
                                                value={newClientData.cedula || ""}
                                                onChange={handleAddChange}
                                                required
                                            />
                                            {cedulaError && <div className="text-danger">{cedulaError}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="correo" className="form-label">Correo</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="correo"
                                                name="correo"
                                                value={newClientData.correo || ""}
                                                onChange={handleAddChange}
                                                required
                                            />
                                            {emailError && <div className="text-danger">{emailError}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="password" className="form-label">Contraseña</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="password"
                                                name="password"
                                                value={newClientData.password || ""}
                                                onChange={handleAddChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="telefono" className="form-label">Teléfono</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="telefono"
                                                name="telefono"
                                                value={newClientData.telefono || ""}
                                                onChange={handleAddChange}
                                                required
                                            />
                                            {telefonoError && <div className="text-danger">{telefonoError}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="direccion" className="form-label">Dirección</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="direccion"
                                                name="direccion"
                                                value={newClientData.direccion || ""}
                                                onChange={handleAddChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="ciudad" className="form-label">Ciudad</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="ciudad"
                                                name="ciudad"
                                                value={newClientData.ciudad || ""}
                                                onChange={handleAddChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setAddModal(false)}>
                                            <i className="bi bi-x-circle"></i> Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-success">
                                            <i className="bi bi-check-circle"></i> Guardar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </div>
    );
};

export default AddOrderPage;