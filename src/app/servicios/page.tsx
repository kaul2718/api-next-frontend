"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import useUserRole from "@/hooks/useUserRole"; // Importa el hook

// DTO para Servicios
interface Servicio {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    costo: number;
}

const Servicios = () => {
    const { data: session, status } = useSession(); // status para verificar el estado de la sesión
    const role = useUserRole(); // Obtiene el rol del usuario
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [filteredServicios, setFilteredServicios] = useState<Servicio[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Estados para el formulario
    const [codigo, setCodigo] = useState("");
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [costo, setCosto] = useState<number | "">(0);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);


    // Cargar servicios solo cuando la sesión esté disponible
    useEffect(() => {
        if (status === "authenticated" && session?.user?.token) {
            fetchServicios();
        }
    }, [status, session]); // Dependencia en status y session


    const fetchServicios = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/servicios`, {
                headers: {
                    Authorization: `Bearer ${session?.user?.token || ""}`
                },
            });

            if (!res.ok) throw new Error("Error al cargar servicios");
            const data = await res.json();
            setServicios(data);
            setFilteredServicios(data);
        } catch (error) {
            console.error(error);
            toast.error("No se pudieron cargar los servicios.");
        }
    };

    useEffect(() => {
        const filtered = servicios.filter((servicio) => {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            return (
                servicio.codigo.toLowerCase().includes(lowercasedSearchTerm) ||
                servicio.nombre.toLowerCase().includes(lowercasedSearchTerm) ||
                servicio.descripcion.toLowerCase().includes(lowercasedSearchTerm)
            );
        });

        setFilteredServicios(filtered);
        setCurrentPage(1);
    }, [searchTerm, servicios]);

    const handleSaveServicio = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors([]);

        if (!session?.user?.token) {
            toast.error("No estás autenticado.");
            return;
        }

        const servicioData = {
            codigo,
            nombre,
            descripcion,
            costo: Number(costo)
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/servicios${editingId ? `/${editingId}` : ""}`, {
                method: editingId ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.user.token}`,
                },
                body: JSON.stringify(servicioData),
            });

            if (!res.ok) {
                const responseAPI = await res.json();
                setErrors(Array.isArray(responseAPI.message) ? responseAPI.message : [responseAPI.message]);
                return;
            }

            toast.success(
                `Servicio ${editingId ? "actualizado" : "registrado"} con éxito! ✅`
            );
            setEditingId(null);
            fetchServicios();
            resetForm();
            setShowModal(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el servicio.");
        }
    };

    const handleEdit = (servicio: Servicio) => {
        setEditingId(servicio.id);
        setCodigo(servicio.codigo);
        setNombre(servicio.nombre);
        setDescripcion(servicio.descripcion);
        setCosto(servicio.costo);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este servicio?")) return;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/servicios/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${session?.user?.token || ""}`
                    },
                }
            );

            if (res.ok) {
                toast.success("Servicio eliminado con éxito! ✅");
                fetchServicios();
            } else {
                toast.error("Error al eliminar el servicio.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar el servicio.");
        }
    };

    const handleViewDetails = (repuesto: Servicio) => {
        setSelectedServicio(repuesto);
        setShowDetailsModal(true);
    };

    const resetForm = () => {
        setCodigo("");
        setNombre("");
        setDescripcion("");
        setCosto(0);
        setEditingId(null);
    };

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(1);
    };

    const indexOfLastServicio = currentPage * itemsPerPage;
    const indexOfFirstServicio = indexOfLastServicio - itemsPerPage;
    const currentServicios = filteredServicios.slice(
        indexOfFirstServicio,
        indexOfLastServicio
    );

    return (
        <div className="d-flex flex-column vh-100">
            <Sidebar />
            <ToastContainer position="top-right" autoClose={5000} />
            <div className="content flex-grow-1 pt-5">
                <Header />
                <div className="container mt-4">
                    <h2>Gestión de Servicios</h2>

                    {/* Contenedor en forma de recuadro */}
                    <div className="border p-3 rounded shadow-sm bg-light">
                        {/* Título */}
                        <h5 className="mb-3">Filtros de Búsqueda</h5>

                        {/* Barra de búsqueda */}
                        <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control me-3"
                                placeholder="Buscar por código, nombre o descripción"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="btn btn-outline-primary">
                                <i className="bi bi-search"></i> Buscar
                            </button>
                        </div>
                    </div>

                    {/* Botón para abrir el modal de agregar servicio */}
                    {role === "Administrador" ? (

                        <button
                            className="btn btn-primary mb-4"
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                        >
                            <i className="bi bi-plus"></i> Agregar Servicio
                        </button>
                    ) : null}

                    {/* Tabla de servicios */}
                    <table className="table table-bordered table-hover mt-4">
                        <thead className="table-dark">
                            <tr>
                                <th><i className="bi bi-barcode"></i> ID</th>
                                <th><i className="bi bi-hash"></i> Código</th>
                                <th><i className="bi bi-tag"></i> Nombre</th>
                                <th><i className="bi bi-file-earmark-text"></i> Descripción</th>
                                <th><i className="bi bi-cash"></i> Costo</th>
                                <th><i className="bi bi-gear"></i> Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentServicios.map((servicio) => (
                                <tr key={servicio.id}>
                                    <td>{servicio.id}</td>
                                    <td>{servicio.codigo}</td>
                                    <td>{servicio.nombre}</td>
                                    <td>{servicio.descripcion}</td>
                                    <td>{servicio.costo}</td>
                                    <td>
                                        <div className="d-flex justify-content-center gap-2">

                                            <button className="btn btn-primary" onClick={() => handleViewDetails(servicio)}>
                                                <i className="bi bi-eye"></i> Ver detalles
                                            </button>
                                            {role === "Administrador" ? (

                                                <button
                                                    className="btn btn-warning me-2"
                                                    onClick={() => handleEdit(servicio)}
                                                >
                                                    <i className="bi bi-pencil"></i> Editar
                                                </button>
                                            ) : null}
                                            {role === "Administrador" ? (

                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleDelete(servicio.id)}
                                                >
                                                    <i className="bi bi-trash"></i> Eliminar
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Paginación y selector de cantidad de datos */}
                    <div className="d-flex align-items-center justify-content-between mt-4">
                        <nav aria-label="Page navigation" className="me-4">
                            <ul className="pagination">
                                <li
                                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                >
                                    <button className="page-link">Previous</button>
                                </li>
                                {Array.from(
                                    { length: Math.ceil(filteredServicios.length / itemsPerPage) },
                                    (_, index) => (
                                        <li
                                            key={index + 1}
                                            className={`page-item ${currentPage === index + 1 ? "active" : ""
                                                }`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(index + 1)}
                                            >
                                                {index + 1}
                                            </button>
                                        </li>
                                    )
                                )}
                                <li
                                    className={`page-item ${currentPage === Math.ceil(filteredServicios.length / itemsPerPage)
                                        ? "disabled"
                                        : ""
                                        }`}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                >
                                    <button className="page-link">Next</button>
                                </li>
                            </ul>
                        </nav>

                        <div className="d-flex align-items-center">
                            <label htmlFor="itemsPerPage" className="me-2">
                                Mostrar
                            </label>
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
                            <span className="ms-2">servicios por página</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fondo difuso cuando el modal está abierto */}
            {(showModal || showDetailsModal) && (
                <div className="backdrop"></div>
            )}
            {/* Modal para agregar/editar servicios */}
            {showModal && (
                <div className={`modal fade ${showModal ? "show" : ""}`} style={{ display: showModal ? "block" : "none" }}>
                    <div className="modal-dialog modal-lg" style={{ marginTop: "200px" }}>
                        <div className="modal-content">
                            <div className="modal-header bg-dark text-white">
                                <h5 className="modal-title">
                                    {editingId ? "Editar Servicio" : "Agregar Servicio"}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSaveServicio}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <label>Código</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={codigo}
                                                onChange={(e) => setCodigo(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label>Nombre</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="row mt-3">
                                        <div className="col-md-12">
                                            <label>Descripción</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={descripcion}
                                                onChange={(e) => setDescripcion(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="row mt-3">
                                        <div className="col-md-12">
                                            <label>Costo</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={costo}
                                                onChange={(e) => setCosto(Number(e.target.value))}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-end mt-4">
                                        <button type="submit" className="btn btn-primary">
                                            {editingId ? "Actualizar Servicio" : "Registrar Servicio"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para ver detalles del repuesto */}
            <div className={`modal fade ${showDetailsModal ? "show" : ""}`} style={{ display: showDetailsModal ? "block" : "none" }}>
                <div className="modal-dialog modal-lg" style={{ marginTop: "200px" }}>
                    <div className="modal-content">
                        <div className="modal-header bg-dark text-white">
                            <h5 className="modal-title">Detalles del Repuesto</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => setShowDetailsModal(false)}
                            ></button>
                        </div>
                        <div className="modal-body">
                            {selectedServicio && (
                                <div>
                                    <p><strong>ID:</strong> {selectedServicio.id}</p>
                                    <p><strong>Código:</strong> {selectedServicio.codigo}</p>
                                    <p><strong>Nombre:</strong> {selectedServicio.nombre}</p>
                                    <p><strong>Descripción:</strong> {selectedServicio.descripcion}</p>
                                    <p><strong>Precio:</strong> {selectedServicio.costo}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                Cerrar
                            </button>
                        </div>
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
        z-index: 1040;
    }
`}</style>

        </div>
    );
};

export default Servicios;