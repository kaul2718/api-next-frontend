"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import useUserRole from "@/hooks/useUserRole"; // Importa el hook

interface Repuesto {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    precioVenta: number;
    stockActual: number;
    stockMinimo: number;
}

const Repuestos = () => {
    const { data: session, status } = useSession(); // status para verificar el estado de la sesión
    const role = useUserRole(); // Obtiene el rol del usuario

    const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
    const [filteredRepuestos, setFilteredRepuestos] = useState<Repuesto[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [codigo, setCodigo] = useState("");
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [precioVenta, setPrecioVenta] = useState<number | "">("");
    const [stockActual, setStockActual] = useState<number | "">("");
    const [stockMinimo, setStockMinimo] = useState<number | "">("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRepuesto, setSelectedRepuesto] = useState<Repuesto | null>(null);


    // Cargar repuestos solo cuando la sesión esté disponible
    useEffect(() => {
        if (status === "authenticated" && session?.user?.token) {
            fetchRepuestos();
        }
    }, [status, session]); // Dependencia en status y session

    const fetchRepuestos = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos`, {
                headers: { Authorization: `Bearer ${session?.user?.token || ""}` },
            });
            if (!res.ok) throw new Error("Error al cargar repuestos");
            const data = await res.json();
            setRepuestos(data);
            setFilteredRepuestos(data);
        } catch (error) {
            console.error(error);
            toast.error("No se pudo cargar los repuestos.");
        }
    };

    useEffect(() => {
        const filtered = repuestos.filter((repuesto) => {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            return (
                repuesto.codigo.toLowerCase().includes(lowercasedSearchTerm) ||
                repuesto.nombre.toLowerCase().includes(lowercasedSearchTerm) ||
                repuesto.descripcion.toLowerCase().includes(lowercasedSearchTerm)
            );
        });
        setFilteredRepuestos(filtered);
        setCurrentPage(1);
    }, [searchTerm, repuestos]);

    const handleSaveRepuesto = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors([]);

        if (!session?.user?.token) {
            toast.error("No estás autenticado.");
            return;
        }

        const repuestoData = {
            codigo,
            nombre,
            descripcion,
            precioVenta: Number(precioVenta),
            stockActual: Number(stockActual),
            stockMinimo: Number(stockMinimo),
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos${editingId ? `/${editingId}` : ""}`, {
                method: editingId ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.user.token}`,
                },
                body: JSON.stringify(repuestoData),
            });

            if (!res.ok) {
                const responseAPI = await res.json();
                setErrors(Array.isArray(responseAPI.message) ? responseAPI.message : [responseAPI.message]);
                return;
            }

            toast.success(`Repuesto ${editingId ? "actualizado" : "registrado"} con éxito! ✅`);
            setEditingId(null);
            fetchRepuestos();
            resetForm();
            setShowModal(false); // Cerrar el modal después de guardar
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el repuesto.");
        }
    };

    const handleEdit = (repuesto: Repuesto) => {
        setEditingId(repuesto.id);
        setCodigo(repuesto.codigo);
        setNombre(repuesto.nombre);
        setDescripcion(repuesto.descripcion);
        setPrecioVenta(repuesto.precioVenta);
        setStockActual(repuesto.stockActual);
        setStockMinimo(repuesto.stockMinimo);
        setShowModal(true); // Abrir el modal para editar
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este repuesto?")) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/repuestos/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session?.user?.token || ""}` },
            });

            if (res.ok) {
                toast.success("Repuesto eliminado con éxito! ✅");
                fetchRepuestos();
            } else {
                toast.error("Error al eliminar el repuesto.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar el repuesto.");
        }
    };

    const handleViewDetails = (repuesto: Repuesto) => {
        setSelectedRepuesto(repuesto);
        setShowDetailsModal(true);
    };

    const resetForm = () => {
        setCodigo("");
        setNombre("");
        setDescripcion("");
        setPrecioVenta("");
        setStockActual("");
        setStockMinimo("");
        setEditingId(null);
    };

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(1);
    };

    const indexOfLastRepuesto = currentPage * itemsPerPage;
    const indexOfFirstRepuesto = indexOfLastRepuesto - itemsPerPage;
    const currentRepuestos = filteredRepuestos.slice(indexOfFirstRepuesto, indexOfLastRepuesto);

    return (
        <div className="d-flex flex-column vh-100">
            <Sidebar />
            <div className="content flex-grow-1 pt-5">
                <Header />
                <div className="container mt-4">
                    <h2>Gestión de Repuestos</h2>

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

                    {/* Botón para abrir el modal de agregar repuesto, solo visible para Administradores y Técnicos */}
                    {role === "Administrador" ? (
                        <button
                            className="btn btn-primary mb-4"
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                        >
                            <i className="bi bi-plus"></i> Agregar Repuesto
                        </button>
                    ) : null}

                    {/* Tabla de repuestos */}
                    <table className="table table-bordered table-hover mt-4">
                        <thead className="table-dark">
                            <tr>
                                <th><i className="bi bi-barcode"></i> ID</th>
                                <th><i className="bi bi-hash"></i> Código</th>
                                <th><i className="bi bi-tag"></i> Nombre</th>
                                <th><i className="bi bi-file-earmark-text"></i> Descripción</th>
                                <th><i className="bi bi-cash"></i> Precio</th>
                                <th><i className="bi bi-box"></i> Stock</th>
                                <th><i className="bi bi-gear"></i> Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRepuestos.map((repuesto) => (
                                <tr key={repuesto.id}>
                                    <td>{repuesto.id}</td>
                                    <td>{repuesto.codigo}</td>
                                    <td>{repuesto.nombre}</td>
                                    <td>{repuesto.descripcion}</td>
                                    <td>{repuesto.precioVenta}</td>
                                    <td>{repuesto.stockActual}</td>
                                    <td>
                                        <div className="d-flex justify-content-center gap-2">

                                            <button className="btn btn-primary" onClick={() => handleViewDetails(repuesto)}>
                                                <i className="bi bi-eye"></i> Ver detalles
                                            </button>
                                            {role === "Administrador" ? (

                                                <button className="btn btn-warning me-2" onClick={() => handleEdit(repuesto)}>
                                                    <i className="bi bi-pencil"></i> Editar
                                                </button>
                                            ) : null}
                                            {role === "Administrador" ? (

                                                <button className="btn btn-danger" onClick={() => handleDelete(repuesto.id)}>
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
                                {Array.from({ length: Math.ceil(filteredRepuestos.length / itemsPerPage) }, (_, index) => (
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
                                    className={`page-item ${currentPage === Math.ceil(filteredRepuestos.length / itemsPerPage) ? "disabled" : ""}`}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                >
                                    <button className="page-link">Next</button>
                                </li>
                            </ul>
                        </nav>

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
                            <span className="ms-2">repuestos por página</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fondo difuso cuando el modal está abierto */}
            {(showModal || showDetailsModal) && (
                <div className="backdrop"></div>
            )}

            {/* Modal para agregar/editar repuestos */}
            <div className={`modal fade ${showModal ? "show" : ""}`} style={{ display: showModal ? "block" : "none" }}>
                <div className="modal-dialog modal-lg" style={{ marginTop: "200px" }}>
                    <div className="modal-content">
                        <div className="modal-header bg-dark text-white">
                            <h5 className="modal-title">
                                {editingId ? "Editar Repuesto" : "Agregar Repuesto"}
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
                            <form onSubmit={handleSaveRepuesto}>
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
                                    <div className="col-md-4">
                                        <label>Precio</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={precioVenta}
                                            onChange={(e) => setPrecioVenta(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label>Stock Actual</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={stockActual}
                                            onChange={(e) => setStockActual(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label>Stock Mínimo</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={stockMinimo}
                                            onChange={(e) => setStockMinimo(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer mt-3">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                    >
                                        Cerrar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

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
                            {selectedRepuesto && (
                                <div>
                                    <p><strong>ID:</strong> {selectedRepuesto.id}</p>
                                    <p><strong>Código:</strong> {selectedRepuesto.codigo}</p>
                                    <p><strong>Nombre:</strong> {selectedRepuesto.nombre}</p>
                                    <p><strong>Descripción:</strong> {selectedRepuesto.descripcion}</p>
                                    <p><strong>Precio:</strong> {selectedRepuesto.precioVenta}</p>
                                    <p><strong>Stock Actual:</strong> {selectedRepuesto.stockActual}</p>
                                    <p><strong>Stock Mínimo:</strong> {selectedRepuesto.stockMinimo}</p>
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
                    z-index: 1040; /* Asegúrate de que el fondo esté debajo del modal */
                }

                .modal {
                    z-index: 1050; /* Asegúrate de que el modal esté por encima del fondo difuso */
                }
            `}</style>
        </div>
    );
};

export default Repuestos;