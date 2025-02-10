"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ClientsPage = () => {
    const { data: session } = useSession();
    const [users, setClients] = useState<any[]>([]);
    const [filteredClients, setFilteredClients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda
    const [itemsPerPage, setItemsPerPage] = useState(10); // Número de clientes por página
    const [currentPage, setCurrentPage] = useState(1); // Página actual
    const [selectedClient, setSelectedClient] = useState<any | null>(null); // Estado para el cliente seleccionado
    const [showModal, setShowModal] = useState(false); // Estado para controlar la visibilidad del modal
    const [editModal, setEditModal] = useState(false); // Estado para controlar el modal de edición
    const [addModal, setAddModal] = useState(false); // Estado para controlar el modal de agregar cliente
    const [formData, setFormData] = useState<any>({}); // Datos del formulario de edición
    const [newClientData, setNewClientData] = useState<any>({}); // Datos del formulario de creación
    const [emailError, setEmailError] = useState(""); // Estado para el error de correo
    const [cedulaError, setCedulaError] = useState(""); // Estado para el error de cédula
    const [telefonoError, setTelefonoError] = useState(""); // Estado para el error de teléfono

    useEffect(() => {
        const getClients = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/all?page=1&limit=10`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.token}` || "",
                    },
                });

                if (!res.ok) {
                    throw new Error("Error al cargar los clientes");
                }

                const data = await res.json();
                if (Array.isArray(data)) {
                    setClients(data);
                    setFilteredClients(data);
                } else {
                    console.error("La respuesta no es un array:", data);
                    toast.error("La respuesta del servidor no es válida.");
                }
            } catch (error) {
                console.error("Error al cargar los clientes:", error);
                toast.error("No se pudieron cargar los clientes.");
            }
        };

        if (session?.user?.token) {
            getClients();
        }
    }, [session?.user?.token]);

    useEffect(() => {
        if (Array.isArray(users)) {
            const filtered = users.filter((user) => {
                const lowercasedSearchTerm = searchTerm.toLowerCase();
                return (
                    user.nombre.toLowerCase().includes(lowercasedSearchTerm) ||
                    user.cedula.toLowerCase().includes(lowercasedSearchTerm) ||
                    user.correo.toLowerCase().includes(lowercasedSearchTerm) ||
                    user.role.toLowerCase().includes(lowercasedSearchTerm)
                );
            });

            setFilteredClients(filtered);
            setCurrentPage(1); // Resetear la página a 1 cuando se hace un nuevo filtro
        }
    }, [searchTerm, users]);


    // Función para validar si el correo ya existe
    const validateEmail = (email: string) => {
        const emailExists = users.some((user) => user.correo === email);
        if (emailExists) {
            setEmailError("El correo ya está registrado.");
        } else {
            setEmailError("");
        }
    };

    // Función para validar si la cédula ya existe
    const validateCedula = (cedula: string) => {
        const cedulaExists = users.some((user) => user.cedula === cedula);
        if (cedulaExists) {
            setCedulaError("La cédula ya está registrada.");
        } else {
            setCedulaError("");
        }
    };

    // Función para validar si el teléfono ya existe
    const validateTelefono = (telefono: string) => {
        const telefonoExists = users.some((user) => user.telefono === telefono);
        if (telefonoExists) {
            setTelefonoError("El teléfono ya está registrado.");
        } else {
            setTelefonoError("");
        }
    };

    // Función para manejar cambios en el formulario de creación
    const handleAddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewClientData({
            ...newClientData,
            [name]: value,
        });

        // Validar en tiempo real
        if (name === "correo") {
            validateEmail(value);
        } else if (name === "cedula") {
            validateCedula(value);
        } else if (name === "telefono") {
            validateTelefono(value);
        }
    };
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(1); // Resetear la página a 1 cuando se cambian los elementos por página
    };

    // Función que abrirá el modal y cargará los detalles del cliente seleccionado
    const handleViewDetails = (user: any) => {
        setSelectedClient(user); // Guardamos el cliente seleccionado
        setShowModal(true); // Mostramos el modal
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleEditClient = (user: any) => {
        setFormData(user); // Cargamos los datos del usuario seleccionado en el formulario
        setEditModal(true); // Mostramos el modal de edición
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.id) {
            console.error("Error: ID no definido.");
            return;
        }

        // Desestructurar y eliminar campos no permitidos
        const { resetPasswordToken, deletedAt, id, ...dataToSend } = formData;

        // Eliminar campos adicionales si es necesario
        delete dataToSend.resetPasswordToken; // Asegúrate de eliminar resetPasswordToken

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.user?.token || ""}`,
            },
            body: JSON.stringify(dataToSend),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Error al actualizar:", res.status, errorText);
            return;
        }

        const updatedClient = await res.json();
        setClients((prevClients) =>
            prevClients.map((user) => (user.id === updatedClient.id ? updatedClient : user))
        );
        setEditModal(false);
        // Mostrar notificación de éxito
        toast.success('Cliente editado con éxito! ✅');
    };

    const handleDeleteClient = async (id: number) => {
        if (!id) {
            console.error("Error: ID no definido.");
            return;
        }

        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este cliente?");
        if (!confirmDelete) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.token || ""}`,
                },
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Error al eliminar:", res.status, errorText);
                toast.error("Error al eliminar el cliente ");
                return;
            }

            setClients((prevClients) => prevClients.filter((user) => user.id !== id));
            toast.success("Cliente eliminado con éxito ✅");
        } catch (error) {
            console.error("Error en la solicitud de eliminación:", error);
            toast.error("Error al procesar la solicitud ");
        }
    };



    // Función para agregar un nuevo cliente
    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();

        // Verificar si hay errores de validación
        if (emailError || cedulaError || telefonoError) {
            toast.error("Por favor, corrige los errores antes de enviar.");
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.token || ""}`,
                },
                body: JSON.stringify(newClientData),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Error al agregar:", res.status, errorText);
                toast.error("Error al agregar el cliente");
                return;
            }

            // Después de crear exitosamente
            await reloadClients();
            setAddModal(false);
            setNewClientData({});
            toast.success("Cliente agregado con éxito ✅");
        } catch (error) {
            console.error("Error en la solicitud de agregar:", error);
            toast.error("Error al procesar la solicitud");
        }
    };

    const reloadClients = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/all?page=1&limit=10`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.token}` || "",
                },
            });

            if (!res.ok) {
                throw new Error("Error al cargar los clientes");
            }

            const data = await res.json();
            setClients(data);
            setFilteredClients(data);
        } catch (error) {
            console.error("Error al cargar los clientes:", error);
            toast.error("No se pudieron cargar los clientes.");
        }
    };
    // Lógica para la paginación
    const indexOfLastClient = currentPage * itemsPerPage;
    const indexOfFirstClient = indexOfLastClient - itemsPerPage;
    const currentClients = Array.isArray(filteredClients) ? filteredClients.slice(indexOfFirstClient, indexOfLastClient) : [];
    return (
        <div className="d-flex flex-column vh-100">
            {/* Sidebar */}
            <Sidebar />
            <ToastContainer position="top-right" autoClose={5000} />
            <div className="content flex-grow-1 pt-5">
                {/* Header */}
                <Header />
                <div className="container mt-4">
                    <h1 className="mb-4">Usuarios</h1>

                    {/* Barra de búsqueda y botón para agregar cliente */}
                    <div className="border p-3 rounded shadow-sm bg-light">
                        <h5 className="mb-3">Filtros de Búsqueda</h5>
                        <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control me-3"
                                placeholder="Buscar por nombre, cédula o correo, rol"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="btn btn-outline-primary">
                                <i className="bi bi-search"></i> Buscar
                            </button>
                        </div>
                    </div>
                    <button
                        className="btn btn-primary mb-4"
                        onClick={() => setAddModal(true)}
                    >
                        <i className="bi bi-plus"></i> Agregar Cliente
                    </button>
                </div>

                {/* Tabla de clientes */}
                <table className="table table-bordered table-hover mt-4">
                    <thead className="table-dark">
                        <tr>
                            <th><i className="bi bi-person-circle"></i> Nombre</th>
                            <th><i className="bi bi-person-badge"></i> Cédula</th>
                            <th><i className="bi bi-envelope"></i> Correo</th>
                            <th><i className="bi bi-envelope"></i> Rol</th>
                            <th><i className="bi bi-gear"></i> Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(currentClients) && currentClients.length > 0 ? (
                            currentClients
                                .filter((user) => user && user.id) // Filtra objetos inválidos
                                .map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.nombre}</td>
                                        <td>{user.cedula}</td>
                                        <td>{user.correo}</td>
                                        <td>{user.role}</td>
                                        <td>
                                            <div className="d-flex justify-content-center gap-2">
                                                <button className="btn btn-primary" onClick={() => handleViewDetails(user)}>
                                                    <i className="bi bi-eye"></i> Ver detalles
                                                </button>
                                                <button className="btn btn-warning" onClick={() => handleEditClient(user)}>
                                                    <i className="bi bi-pencil"></i> Editar
                                                </button>
                                                <button className="btn btn-danger" onClick={() => handleDeleteClient(user.id)}>
                                                    <i className="bi bi-trash"></i> Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center">
                                    No hay clientes para mostrar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Fondo difuso cuando cualquier modal está abierto */}
                {(showModal || editModal || addModal) && (
                    <div className="backdrop"></div>
                )}

                {/* Modal para ver los detalles del cliente */}
                {showModal && selectedClient && (
                    <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} aria-modal="true">
                        <div className="modal-dialog modal-lg" style={{ marginTop: "200px" }}>
                            <div className="modal-content">
                                <div className="modal-header bg-dark text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-person"></i> Detalles del Usuario <strong>{selectedClient.nombre}</strong>
                                    </h5>
                                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowModal(false)}>
                                        <i className="bi bi-x-circle" style={{ color: 'white' }}></i>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="container-fluid">
                                        <div className="row mb-3">
                                            <div className="col-12">
                                                <div className="card">
                                                    <div className="card-header text-dark">
                                                        <h6 className="text-primary"><i className="bi bi-person"></i> Información del Usuario</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <p><strong>Nombre:</strong> {selectedClient.nombre}</p>
                                                        <p><strong>Cédula:</strong> {selectedClient.cedula}</p>
                                                        <p><strong>Correo:</strong> {selectedClient.correo}</p>
                                                        <p><strong>Teléfono:</strong> {selectedClient.telefono}</p>
                                                        <p><strong>Dirección:</strong> {selectedClient.direccion}</p>
                                                        <p><strong>Ciudad:</strong> {selectedClient.ciudad}</p>
                                                        <p><strong>Rol:</strong> {selectedClient.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        <i className="bi bi-x-circle"></i> Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal para editar usuario */}
                {editModal && (
                    <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} aria-modal="true">
                        <div className="modal-dialog modal-lg" style={{ marginTop: "80px" }}>
                            <div className="modal-content">
                                <div className="modal-header bg-dark text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-pencil"></i> Editar Usuario
                                    </h5>
                                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setEditModal(false)}></button>
                                </div>
                                <form onSubmit={handleEditSubmit}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label htmlFor="nombre" className="form-label">Nombre</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="nombre"
                                                name="nombre"
                                                value={formData.nombre || ""}
                                                onChange={handleEditChange}
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
                                                value={formData.cedula || ""}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="correo" className="form-label">Correo</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="correo"
                                                name="correo"
                                                value={formData.correo || ""}
                                                onChange={handleEditChange}
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
                                                value={formData.telefono || ""}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="direccion" className="form-label">Dirección</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="direccion"
                                                name="direccion"
                                                value={formData.direccion || ""}
                                                onChange={handleEditChange}
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
                                                value={formData.ciudad || ""}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="role" className="form-label">Rol</label>
                                            <select
                                                className="form-control"
                                                id="role"
                                                name="role"
                                                value={formData.role || " "}
                                                onChange={handleEditChange}
                                                required
                                            >
                                                <option value="">{formData.role || " "}</option>
                                                <option value="Administrador">Administrador</option>
                                                <option value="Técnico">Técnico</option>
                                                <option value="Cliente">Cliente</option>
                                                <option value="Recepcionista">Recepcionista</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>
                                            <i className="bi bi-x-circle"></i> Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={handleEditSubmit} // Acción al guardar
                                            data-bs-dismiss="modal" // Cerrar el modal al hacer clic
                                        >
                                            <i className="bi bi-check-circle"></i> Guardar Cambios
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal para agregar cliente */}
                {addModal && (
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
                                        <div className="mb-3">
                                            <label htmlFor="role" className="form-label">Rol</label>
                                            <select
                                                className="form-control"
                                                id="role"
                                                name="role"
                                                value={newClientData.role || ""}
                                                onChange={handleAddChange}
                                                required
                                            >
                                                <option value="">Seleccionar rol</option>
                                                <option value="Administrador">Administrador</option>
                                                <option value="Técnico">Técnico</option>
                                                <option value="Cliente">Cliente</option>
                                                <option value="Recepcionista">Recepcionista</option>
                                            </select>
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
                )}

                {/* Paginación y selector de cantidad de datos en una sola línea */}
                <div className="d-flex align-items-center justify-content-between mt-4">
                    {/* Paginación */}
                    <nav aria-label="Page navigation" className="me-4">
                        <ul className="pagination">
                            <li
                                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                <button className="page-link">Previous</button>
                            </li>
                            {Array.from({ length: Math.ceil(filteredClients.length / itemsPerPage) }, (_, index) => (
                                <li
                                    key={index + 1}
                                    className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(index + 1)}
                                    >
                                        {index + 1}
                                    </button>
                                </li>
                            ))}
                            <li
                                className={`page-item ${currentPage === Math.ceil(filteredClients.length / itemsPerPage) ? "disabled" : ""}`}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                <button className="page-link">Next</button>
                            </li>
                        </ul>
                    </nav>

                    {/* Selector de cantidad de datos por página */}
                    <div className="d-flex align-items-center">
                        <label htmlFor="itemsPerPage" className="me-2">Mostrar</label>
                        <select
                            id="itemsPerPage"
                            className="form-select d-inline w-auto"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                        </select>
                        <span className="ms-2">órdenes por página</span>
                    </div>
                </div>

            </div>
            {/* Estilos para el fondo difuso */}
            <style jsx>{`
    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
        z-index: 1040; /* Asegúrate de que el fondo esté debajo del modal */
    }
`}</style>
        </div>
    );
};

export default ClientsPage;