"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CasillerosPage = () => {
    const { data: session } = useSession();
    const [casilleros, setCasilleros] = useState<any[]>([]);
    const [filteredCasilleros, setFilteredCasilleros] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCasillero, setSelectedCasillero] = useState<any | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [addModal, setAddModal] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [newCasilleroData, setNewCasilleroData] = useState<any>({});

    useEffect(() => {
        const getCasilleros = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.token}` || "",
                    },
                });

                if (!res.ok) {
                    throw new Error("Error al cargar los casilleros");
                }

                const data = await res.json();
                setCasilleros(data);
                setFilteredCasilleros(data);
            } catch (error) {
                console.error("Error al cargar los casilleros:", error);
                toast.error("No se pudieron cargar los casilleros.");
            }
        };

        if (session?.user?.token) {
            getCasilleros();
        }
    }, [session?.user?.token]);

    useEffect(() => {
        const filtered = casilleros.filter((casillero) => {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            return (
                casillero.numero.toLowerCase().includes(lowercasedSearchTerm) ||
                casillero.estado.toLowerCase().includes(lowercasedSearchTerm) ||
                casillero.descripcion.toLowerCase().includes(lowercasedSearchTerm)
            );
        });

        setFilteredCasilleros(filtered);
        setCurrentPage(1);
    }, [searchTerm, casilleros]);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(1);
    };

    const handleViewDetails = (casillero: any) => {
        setSelectedCasillero(casillero);
        setShowModal(true);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleEditCasillero = (casillero: any) => {
        setFormData(casillero);
        setEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.id) {
            console.error("Error: ID no definido.");
            return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/${formData.numero}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.user?.token || ""}`,
            },
            body: JSON.stringify(formData),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Error al actualizar:", res.status, errorText);
            return;
        }

        const updatedCasillero = await res.json();
        setCasilleros((prevCasilleros) =>
            prevCasilleros.map((casillero) => (casillero.id === updatedCasillero.id ? updatedCasillero : casillero))
        );
        setEditModal(false);
        toast.success('Casillero editado con éxito! ✅');
    };

    const handleDeleteCasillero = async (numero: string) => {
        if (!numero) {
            console.error("Error: Número de casillero no definido.");
            return;
        }

        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este casillero?");
        if (!confirmDelete) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/${numero}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.token || ""}`,
                },
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Error al eliminar:", res.status, errorText);
                toast.error("Error al eliminar el casillero ");
                return;
            }

            setCasilleros((prevCasilleros) => prevCasilleros.filter((casillero) => casillero.numero !== numero));
            toast.success("Casillero eliminado con éxito ✅");
        } catch (error) {
            console.error("Error en la solicitud de eliminación:", error);
            toast.error("Error al procesar la solicitud ");
        }
    };

    const handleAddCasillero = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.token || ""}`,
                },
                body: JSON.stringify(newCasilleroData),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Error al agregar:", res.status, errorText);
                toast.error("Error al agregar el casillero");
                return;
            }

            const newCasillero = await res.json();
            setCasilleros((prevCasilleros) => [...prevCasilleros, newCasillero]);
            setAddModal(false);
            setNewCasilleroData({});
            toast.success("Casillero agregado con éxito ✅");
        } catch (error) {
            console.error("Error en la solicitud de agregar:", error);
            toast.error("Error al procesar la solicitud");
        }
    };

    const indexOfLastCasillero = currentPage * itemsPerPage;
    const indexOfFirstCasillero = indexOfLastCasillero - itemsPerPage;
    const currentCasilleros = Array.isArray(filteredCasilleros) ? filteredCasilleros.slice(indexOfFirstCasillero, indexOfLastCasillero) : [];

    return (
        <div className="d-flex flex-column vh-100">
            <Sidebar />
            <ToastContainer position="top-right" autoClose={5000} />
            <div className="content flex-grow-1 pt-5">
                <Header />
                <div className="container mt-4">
                    <h1 className="mb-4">Casilleros</h1>

                    <div className="border p-3 rounded shadow-sm bg-light">
                        <h5 className="mb-3">Filtros de Búsqueda</h5>
                        <div className="d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control me-3"
                                placeholder="Buscar por número, estado o descripción"
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
                        <i className="bi bi-plus"></i> Agregar Casillero
                    </button>
                </div>

                <table className="table table-bordered table-hover mt-4">
                    <thead className="table-dark">
                        <tr>
                            <th><i className="bi bi-hash"></i> Número</th>
                            <th><i className="bi bi-info-circle"></i> Estado</th>
                            <th><i className="bi bi-card-text"></i> Descripción</th>
                            <th><i className="bi bi-file-earmark-text"></i> Orden de Servicio</th>
                            <th><i className="bi bi-gear"></i> Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(currentCasilleros) && currentCasilleros.length > 0 ? (
                            currentCasilleros
                                .filter((casillero) => casillero && casillero.id)
                                .map((casillero) => (
                                    <tr key={casillero.id}>
                                        <td>{casillero.numero}</td>
                                        <td>{casillero.estado}</td>
                                        <td>{casillero.descripcion}</td>
                                        <td>{casillero.orderId}</td>

                                        <td>
                                            <div className="d-flex justify-content-center gap-2">
                                                <button className="btn btn-primary" onClick={() => handleViewDetails(casillero)}>
                                                    <i className="bi bi-eye"></i> Ver detalles
                                                </button>
                                                <button className="btn btn-warning" onClick={() => handleEditCasillero(casillero)}>
                                                    <i className="bi bi-pencil"></i> Editar
                                                </button>
                                                <button className="btn btn-danger" onClick={() => handleDeleteCasillero(casillero.numero)}>
                                                    <i className="bi bi-trash"></i> Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center">
                                    No hay casilleros para mostrar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {(showModal || editModal || addModal) && (
                    <div className="backdrop"></div>
                )}

                {showModal && selectedCasillero && (
                    <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} aria-modal="true">
                        <div className="modal-dialog modal-lg" style={{ marginTop: "200px" }}>
                            <div className="modal-content">
                                <div className="modal-header bg-dark text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-box"></i> Detalles del Casillero <strong>{selectedCasillero.numero}</strong>
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
                                                        <h6 className="text-primary"><i className="bi bi-info-circle"></i> Información del Casillero</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <p><strong>Número:</strong> {selectedCasillero.numero}</p>
                                                        <p><strong>Estado:</strong> {selectedCasillero.estado}</p>
                                                        <p><strong>Descripción:</strong> {selectedCasillero.descripcion}</p>
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

                {editModal && (
                    <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} aria-modal="true">
                        <div className="modal-dialog modal-lg" style={{ marginTop: "80px" }}>
                            <div className="modal-content">
                                <div className="modal-header bg-dark text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-pencil"></i> Editar Casillero
                                    </h5>
                                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setEditModal(false)}></button>
                                </div>
                                <form onSubmit={handleEditSubmit}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label htmlFor="numero" className="form-label">Número</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="numero"
                                                name="numero"
                                                value={formData.numero || ""}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="estado" className="form-label">Estado</label>
                                            <select
                                                className="form-control"
                                                id="estado"
                                                name="estado"
                                                value={formData.estado || ""}
                                                onChange={handleEditChange}
                                                required
                                            >
                                                <option value="">Seleccionar estado</option>
                                                <option value="Disponible">Disponible</option>
                                                <option value="Ocupado">Ocupado</option>
                                                <option value="Mantenimiento">Mantenimiento</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="descripcion" className="form-label">Descripción</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="descripcion"
                                                name="descripcion"
                                                value={formData.descripcion || ""}
                                                onChange={handleEditChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>
                                            <i className="bi bi-x-circle"></i> Cancelar
                                        </button>
                                        <button type="submit" className="btn btn-success">
                                            <i className="bi bi-check-circle"></i> Guardar Cambios
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {addModal && (
                    <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} aria-modal="true">
                        <div className="modal-dialog modal-lg" style={{ marginTop: "80px" }}>
                            <div className="modal-content">
                                <div className="modal-header bg-dark text-white">
                                    <h5 className="modal-title">
                                        <i className="bi bi-plus"></i> Agregar Casillero
                                    </h5>
                                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setAddModal(false)}></button>
                                </div>
                                <form onSubmit={handleAddCasillero}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label htmlFor="numero" className="form-label">Número</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="numero"
                                                name="numero"
                                                value={newCasilleroData.numero || ""}
                                                onChange={(e) => setNewCasilleroData({ ...newCasilleroData, numero: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="estado" className="form-label">Estado</label>
                                            <select
                                                className="form-control"
                                                id="estado"
                                                name="estado"
                                                value={newCasilleroData.estado || ""}
                                                onChange={(e) => setNewCasilleroData({ ...newCasilleroData, estado: e.target.value })}
                                                required
                                            >
                                                <option value="">Seleccionar estado</option>
                                                <option value="Disponible">Disponible</option>
                                                <option value="Ocupado">Ocupado</option>
                                                <option value="Mantenimiento">Mantenimiento</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="descripcion" className="form-label">Descripción</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="descripcion"
                                                name="descripcion"
                                                value={newCasilleroData.descripcion || ""}
                                                onChange={(e) => setNewCasilleroData({ ...newCasilleroData, descripcion: e.target.value })}
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
                )}

                <div className="d-flex align-items-center justify-content-between mt-4">
                    <nav aria-label="Page navigation" className="me-4">
                        <ul className="pagination">
                            <li
                                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                <button className="page-link">Previous</button>
                            </li>
                            {Array.from({ length: Math.ceil(filteredCasilleros.length / itemsPerPage) }, (_, index) => (
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
                                className={`page-item ${currentPage === Math.ceil(filteredCasilleros.length / itemsPerPage) ? "disabled" : ""}`}
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
                        <span className="ms-2">casilleros por página</span>
                    </div>
                </div>

            </div>
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

export default CasillerosPage;