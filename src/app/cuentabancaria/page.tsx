"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import useUserRole from "@/hooks/useUserRole";
import Link from "next/link";

const CuentasBancariasPage = () => {
  const { data: session } = useSession();
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [filteredCuentas, setFilteredCuentas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCuenta, setSelectedCuenta] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCuenta, setEditCuenta] = useState<any>({});
  const role = useUserRole();

  useEffect(() => {
    if (!session?.user?.token || !role) {
      console.log("⚠️ Token o rol no definido. No se hace la petición.");
      return;
    }

    const getCuentas = async () => {
      try {
        console.log("🔍 Enviando solicitud a:", `${process.env.NEXT_PUBLIC_BACKEND_URL}/cuentabancaria`);
        console.log("🔑 Token enviado:", session.user.token);
        console.log("🛂 Rol del usuario:", role);

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cuentabancaria`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error al obtener cuentas: ${response.status}`);
        }

        const data = await response.json();
        setCuentas(data);
        setFilteredCuentas(data); // Inicializar filteredCuentas con todos los datos
        console.log("✅ Cuentas obtenidas correctamente:", data);
      } catch (error) {
        console.error("❌ Error al obtener cuentas:", error);
      }
    };

    getCuentas();
  }, [session?.user?.token, role]);


  useEffect(() => {
    const filtered = cuentas.filter((cuenta) => {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      // Asegúrate de que el campo de fecha sea correcto
      const fechaCreacion = cuenta.fechaCreacion ? new Date(cuenta.fechaCreacion) :
        cuenta.creado_en ? new Date(cuenta.creado_en) : new Date();

      const isWithinDateRange =
        (!startDate || fechaCreacion >= new Date(startDate)) &&
        (!endDate || fechaCreacion <= new Date(endDate));

      return (
        isWithinDateRange &&
        ((cuenta.nombre_banco?.toLowerCase()?.includes(lowercasedSearchTerm) || false) ||
          (cuenta.tipo?.toLowerCase()?.includes(lowercasedSearchTerm) || false) ||
          (cuenta.numero_cuenta?.toLowerCase()?.includes(lowercasedSearchTerm) || false))

      );
    });

    setFilteredCuentas(filtered);
    console.log("Filtered Cuentas:", filtered);
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, cuentas]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handleViewDetails = (cuenta: any) => {
    setSelectedCuenta(cuenta);
    setShowModal(true);
  };

  const handleEditCuenta = (cuenta: any) => {
    setSelectedCuenta(cuenta);
    setEditCuenta(cuenta);
    setShowEditModal(true);
  };

  const handleSaveChanges = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cuentabancaria/${selectedCuenta.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify(editCuenta),
      });

      // Actualizar la lista de cuentas
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/cuentabancaria`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
      });
      const data = await response.json();
      setCuentas(data);
      setShowEditModal(false);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    }
  };

  const indexOfLastCuenta = currentPage * itemsPerPage;
  const indexOfFirstCuenta = indexOfLastCuenta - itemsPerPage;
  const currentCuentas = filteredCuentas.slice(indexOfFirstCuenta, indexOfLastCuenta);

  return (
    <div className="d-flex flex-column vh-100">
      <Sidebar />
      <div className="content flex-grow-1 pt-5">
        <Header />
        <div className="container mt-4">
          <h1 className="mb-4">Cuentas Bancarias</h1>
          <div className="d-flex flex-wrap align-items-center mb-4 gap-3">
            <div className="d-flex align-items-center w-100 w-md-auto">
              <input
                type="text"
                className="form-control me-3"
                placeholder="Buscar por cuenta, titular o estado"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-outline-primary">
                <i className="bi bi-search"></i> Buscar
              </button>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center">
                <label htmlFor="startDate" className="me-2 mb-0">Fecha de inicio</label>
                <input
                  type="date"
                  id="startDate"
                  className="form-control w-auto"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="d-flex align-items-center">
                <label htmlFor="endDate" className="me-2 mb-0">Fecha de fin</label>
                <input
                  type="date"
                  id="endDate"
                  className="form-control w-auto"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {(role === "Administrador" || role === "Contador") && (
            <Link href="/cuentas/nueva">
              <button className="btn btn-primary mb-4">
                <i className="bi bi-plus"></i> Nueva Cuenta
              </button>
            </Link>
          )}

          <table className="table table-bordered table-hover mt-4">
            <thead className="table-dark">
              <tr>
                <th><i className="bi bi-bank"></i> Número de Cuenta</th>
                <th><i className="bi bi-person"></i> Banco</th>
                <th><i className="bi bi-wallet"></i> Saldo</th>
                <th><i className="bi bi-calendar-date"></i> Fecha de Creación</th>
                <th><i className="bi bi-credit-card"></i> Tipo de Cuenta</th>
                <th><i className="bi bi-gear"></i> Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentCuentas.length > 0 ? (
                currentCuentas.map((cuenta) => (
                  <tr key={cuenta.id}>
                    <td>{cuenta.numero_cuenta}</td>
                    <td>{cuenta.nombre_banco}</td>
                    <td>${cuenta.saldo}</td>
                    <td>{new Date(cuenta.fechaCreacion || cuenta.creado_en).toLocaleDateString()}</td>
                    <td>{cuenta.tipo}</td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button className="btn btn-primary" onClick={() => handleViewDetails(cuenta)}>
                          <i className="bi bi-eye"></i> Ver detalles
                        </button>
                        {(role === "Administrador" || role === "Contador") && (
                          <button className="btn btn-warning" onClick={() => handleEditCuenta(cuenta)}>
                            <i className="bi bi-pencil"></i> Editar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center">No se encontraron cuentas bancarias</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Modal de detalles */}
          {showModal && selectedCuenta && (
            <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} aria-modal="true">
              <div className="modal-dialog modal-xl">
                <div className="modal-content">
                  <div className="modal-header bg-dark text-white">
                    <h5 className="modal-title">
                      <i className="bi bi-bank"></i> Detalles de la Cuenta <strong>{selectedCuenta.numeroCuenta}</strong>
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
                              <h6 className="text-primary"><i className="bi bi-bank"></i> Detalles de la Cuenta</h6>
                            </div>
                            <div className="card-body">
                              <p><strong>Número de Cuenta:</strong> {selectedCuenta.numero_cuenta}</p>
                              <p><strong>Saldo Actual:</strong> {selectedCuenta.saldo}</p>
                              <p><strong>Tipo de Cuenta:</strong> {selectedCuenta.tipo}</p>
                              <p><strong>Fecha de Creación:</strong> {new Date(selectedCuenta.fechaCreacion || selectedCuenta.creado_en).toLocaleDateString()}</p>
                              <p><strong>Última Actualización:</strong> {selectedCuenta.fechaActualizacion ? new Date(selectedCuenta.fechaActualizacion).toLocaleDateString() : "N/A"}</p>
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

          {/* Modal de edición */}
          {showEditModal && selectedCuenta && (
            <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} aria-modal="true">
              <div className="modal-dialog modal-xl">
                <div className="modal-content">
                  <div className="modal-header bg-dark text-white">
                    <h5 className="modal-title">
                      <i className="bi bi-bank"></i> Editar Cuenta <strong>{selectedCuenta.numeroCuenta}</strong>
                    </h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowEditModal(false)}>
                      <i className="bi bi-x-circle" style={{ color: 'white' }}></i>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="container-fluid">
                      <div className="row mb-3">
                        <div className="col-12">
                          <div className="card">
                            <div className="card-header text-dark">
                              <h6 className="text-primary"><i className="bi bi-bank"></i> Detalles de la Cuenta</h6>
                            </div>
                            <div className="card-body">
                              <div className="mb-3">
                                <label htmlFor="tipoCuenta" className="form-label">Tipo de Cuenta</label>
                                <select
                                  className="form-select"
                                  id="tipoCuenta"
                                  value={editCuenta.tipoCuenta || ''}
                                  onChange={(e) => setEditCuenta({ ...editCuenta, tipo: e.target.value })}
                                >
                                  <option value="AHORRO">Ahorro</option>
                                  <option value="CORRIENTE">Corriente</option>
                                  <option value="PLAZO FIJO">Plazo Fijo</option>
                                </select>
                              </div>
                              
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                      <i className="bi bi-x-circle"></i> Cancelar
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleSaveChanges}>
                      <i className="bi bi-save"></i> Guardar cambios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


          <div className="d-flex align-items-center justify-content-between mt-4">
            <nav aria-label="Page navigation" className="me-4">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}>
                  <button className="page-link">Anterior</button>
                </li>
                {Array.from({ length: Math.ceil(filteredCuentas.length / itemsPerPage) || 1 }, (_, index) => (
                  <li key={index + 1}
                    className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                    onClick={() => handlePageChange(index + 1)}>
                    <button className="page-link">{index + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === Math.ceil(filteredCuentas.length / itemsPerPage) || filteredCuentas.length === 0 ? "disabled" : ""}`}
                  onClick={() => currentPage < Math.ceil(filteredCuentas.length / itemsPerPage) && handlePageChange(currentPage + 1)}>
                  <button className="page-link">Siguiente</button>
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
              <span className="ms-2">cuentas por página</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuentasBancariasPage;