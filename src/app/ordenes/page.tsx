"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { generatePDF } from "./utils/pdfGenerator";
import useUserRole from "@/hooks/useUserRole";
import Link from "next/link";

const OrdersPage = () => {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPresupuesto, setEditPresupuesto] = useState<any>({});
  const [editCasillero, setEditCasillero] = useState<any>({});
  const [editActividades, setEditActividades] = useState<any[]>([]);
  const role = useUserRole();

  useEffect(() => {
    if (!session?.user?.token || !role) return;

    const getOrders = async () => {
      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders`;

      if (role === "Técnico") {
        url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/tecnico`;
      } else if (role === "Cliente") {
        url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/cliente`;
      }

      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.token}`,
          },
        });

        if (res.status === 401) return;

        if (!res.ok) throw new Error(`Error en fetch: ${res.status}`);

        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error("❌ Error al obtener órdenes:", error);
      }
    };

    getOrders();
  }, [session?.user?.token, role]);

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      const orderDate = new Date(order.fechaIngreso);
      const isWithinDateRange =
        (!startDate || orderDate >= new Date(startDate)) &&
        (!endDate || orderDate <= new Date(endDate));

      return (
        isWithinDateRange &&
        (order.workOrderNumber.toLowerCase().includes(lowercasedSearchTerm) ||
          order.client.nombre.toLowerCase().includes(lowercasedSearchTerm) ||
          order.technician.nombre.toLowerCase().includes(lowercasedSearchTerm) ||
          order.estado.toLowerCase().includes(lowercasedSearchTerm))
      );
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, orders]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setEditPresupuesto(order.presupuesto || {});
    setEditCasillero(order.casillero || {});
    setEditActividades(order.actividades || []);
    setShowEditModal(true);
  };

  const handleSaveChanges = async () => {
    try {
      // Guardar cambios en el presupuesto
      if (editPresupuesto) {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/presupuestos/${selectedOrder.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.token}`,
          },
          body: JSON.stringify(editPresupuesto),
        });
      }

      // Guardar cambios en el casillero
      if (editCasillero) {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/casilleros/${editCasillero.numero}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.token}`,
          },
          body: JSON.stringify(editCasillero),
        });
      }

      // Guardar cambios en las actividades técnicas
      for (const actividad of editActividades) {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/actividades-tecnicas/${actividad.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.token}`,
          },
          body: JSON.stringify(actividad),
        });
      }

      setShowEditModal(false);
      // Recargar las órdenes para reflejar los cambios
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
      });
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
    }
  };

  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  return (
    <div className="d-flex flex-column vh-100">
      <Sidebar />
      <div className="content flex-grow-1 pt-5">
        <Header />
        <div className="container mt-4">
          <h1 className="mb-4">Órdenes</h1>
          <div className="d-flex flex-wrap align-items-center mb-4 gap-3">
            <div className="d-flex align-items-center w-100 w-md-auto">
              <input
                type="text"
                className="form-control me-3"
                placeholder="Buscar por orden, cliente, técnico, fecha o estado"
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
          {(role === "Administrador" || role === "Técnico") && (
            <Link href="/ordenes/agregar">
              <button className="btn btn-primary mb-4">
                <i className="bi bi-plus"></i> Agregar Orden
              </button>
            </Link>
          )}
          <table className="table table-bordered table-hover mt-4">
            <thead className="table-dark">
              <tr>
                <th><i className="bi bi-file-earmark-text"></i> Orden de trabajo</th>
                <th><i className="bi bi-person-circle"></i> Cliente</th>
                <th><i className="bi bi-person-workspace"></i> Técnico</th>
                <th><i className="bi bi-calendar-date"></i> Fecha de ingreso</th>
                <th><i className="bi bi-clock"></i> Estado</th>
                <th><i className="bi bi-gear"></i> Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.workOrderNumber}</td>
                  <td>{order.client ? order.client.nombre : "Cliente no disponible"}</td>
                  <td>{order.technician ? order.technician.nombre : "Técnico no disponible"}</td>
                  <td>{new Date(order.fechaIngreso).toLocaleDateString()}</td>
                  <td>{order.estado}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <button className="btn btn-primary" onClick={() => handleViewDetails(order)}>
                        <i className="bi bi-eye"></i> Ver detalles
                      </button>
                      <button className="btn btn-warning" onClick={() => handleEditOrder(order)}>
                        <i className="bi bi-pencil"></i> Editar
                      </button>
                      <button className="btn btn-success" onClick={() => generatePDF(order)}>
                        <i className="bi bi-file-earmark-pdf"></i> Generar PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showModal && selectedOrder && (
            <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} aria-modal="true">
              <div className="modal-dialog modal-xl">
                <div className="modal-content">
                  <div className="modal-header bg-dark text-white">
                    <h5 className="modal-title">
                      <i className="bi bi-card-checklist"></i> Detalles de la Orden <strong>{selectedOrder.workOrderNumber}</strong>
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
                              <h6 className="text-primary"><i className="bi bi-person"></i> Información del Cliente</h6>
                            </div>
                            <div className="card-body">
                              <p><strong>Cliente:</strong> {selectedOrder.client?.nombre || "No disponible"}</p>
                              <p><strong>Cédula:</strong> {selectedOrder.client?.cedula || "No disponible"}</p>
                              <p><strong>Correo:</strong> {selectedOrder.client?.correo || "No disponible"}</p>
                              <p><strong>Teléfono:</strong> {selectedOrder.client?.telefono || "No disponible"}</p>
                              <p><strong>Dirección:</strong> {selectedOrder.client?.direccion || "No disponible"}</p>
                              <p><strong>Ciudad:</strong> {selectedOrder.client?.ciudad || "No disponible"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-12 col-md-6">
                          <div className="card">
                            <div className="card-header text-dark">
                              <h6 className="text-primary"><i className="bi bi-person-workspace"></i> Detalles del Técnico</h6>
                            </div>
                            <div className="card-body">
                              <p><strong>Técnico:</strong> {selectedOrder.technician.nombre}</p>
                              <p><strong>Ciudad:</strong> {selectedOrder.technician.ciudad}</p>
                              <p><strong>Rol:</strong> {selectedOrder.technician.role}</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="card">
                            <div className="card-header text-dark">
                              <h6 className="text-primary"><i className="bi bi-file-earmark-text"></i> Detalles de la Orden</h6>
                            </div>
                            <div className="card-body">
                              <p><strong>Estado:</strong> {selectedOrder.estado}</p>
                              <p><strong>Estado Final:</strong> {selectedOrder.estadoFinal}</p>
                              <p><strong>Fecha de Ingreso:</strong> {new Date(selectedOrder.fechaIngreso).toLocaleDateString()}</p>
                              <p><strong>Problema Reportado:</strong> {selectedOrder.problemaReportado}</p>
                              <p><strong>Accesorios Dejados:</strong> {selectedOrder.accesorios.join(', ')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-12 col-md-6">
                          <div className="card">
                            <div className="card-header text-dark">
                              <h6 className="text-primary"><i className="bi bi-calendar-check"></i> Fechas y Tareas</h6>
                            </div>
                            <div className="card-body">
                              <p><strong>Tarea a Realizar:</strong> {selectedOrder.tareaRealizar}</p>
                              <p><strong>Fecha Prometida de Entrega:</strong> {new Date(selectedOrder.fechaPrometidaEntrega).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="card">
                            <div className="card-header text-dark">
                              <h6 className="text-primary"><i className="bi bi-cash-stack"></i> Presupuesto</h6>
                            </div>
                            <div className="card-body">
                              <p><strong>Fecha de Emisión:</strong> {selectedOrder?.presupuesto?.fechaEmision ? new Date(selectedOrder.presupuesto.fechaEmision).toLocaleDateString() : 'No disponible'}</p>
                              <p><strong>Costo Mano de Obra:</strong> ${selectedOrder?.presupuesto?.costoManoObra || 'No disponible'}</p>
                              <p><strong>Costo Repuesto:</strong> ${selectedOrder?.presupuesto?.costoRepuesto || 'No disponible'}</p>
                              <p><strong>Costo Total:</strong> ${selectedOrder?.presupuesto?.costoTotal || 'No disponible'}</p>
                              <p><strong>Estado:</strong> {selectedOrder?.presupuesto?.estado || 'No disponible'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-12">
                          <div className="card">
                            <div className="card-header text-dark">
                              <h6 className="text-primary"><i className="bi bi-box"></i> Casillero</h6>
                            </div>
                            <div className="card-body">
                              <p><strong>Casillero:</strong> {selectedOrder?.casillero?.numero || 'No disponible'}</p>
                              <p><strong>Estado:</strong> {selectedOrder?.casillero?.estado || 'No disponible'}</p>
                              <p><strong>Descripción:</strong> {selectedOrder?.casillero?.descripcion || 'No disponible'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-12">
                          <div className="card">
                            <div className="card-header text-dark">
                              <h6 className="text-primary"><i className="bi bi-clipboard-data"></i> Actividades Técnicas</h6>
                            </div>
                            <div className="card-body">
                              {selectedOrder.actividades.map((actividad, index) => (
                                <div key={index} className="mb-2">
                                  <p><strong>Fecha:</strong> {new Date(actividad.fecha).toLocaleDateString()}</p>
                                  <p><strong>Descripción:</strong> {actividad.descripcion || 'No disponible'}</p>
                                  <p><strong>Diagnóstico:</strong> {actividad.diagnostico || 'No disponible'}</p>
                                  <p><strong>Trabajo Realizado:</strong> {actividad.trabajoRealizado || 'No disponible'}</p>
                                </div>
                              ))}
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
          {showEditModal && selectedOrder && (
            <div className="modal fade show" tabIndex={-1} style={{ display: 'block' }} aria-modal="true">
              <div className="modal-dialog modal-xl">
                <div className="modal-content">
                  <div className="modal-header bg-dark text-white">
                    <h5 className="modal-title">
                      <i className="bi bi-card-checklist"></i> Editar Orden <strong>{selectedOrder.workOrderNumber}</strong>
                    </h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowEditModal(false)}>
                      <i className="bi bi-x-circle" style={{ color: 'white' }}></i>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="container-fluid">
                      <div className="row mb-3">
                        <div className="col-12 col-md-6">
                          <div className="card">
                            <div className="card-header text-dark">
                              <h6 className="text-primary"><i className="bi bi-cash-stack"></i> Presupuesto</h6>
                            </div>
                            <div className="card-body">
                              <div className="mb-3">
                                <label htmlFor="fechaEmision" className="form-label">Fecha de Emisión</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  id="fechaEmision"
                                  value={editPresupuesto.fechaEmision ? new Date(editPresupuesto.fechaEmision).toISOString().split('T')[0] : ''}
                                  onChange={(e) => setEditPresupuesto({ ...editPresupuesto, fechaEmision: e.target.value })}
                                />
                              </div>
                              <div className="mb-3">
                                <label htmlFor="costoManoObra" className="form-label">Costo Mano de Obra</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  id="costoManoObra"
                                  value={editPresupuesto.costoManoObra || ''}
                                  onChange={(e) => setEditPresupuesto({ ...editPresupuesto, costoManoObra: parseFloat(e.target.value) })}
                                />
                              </div>
                              <div className="mb-3">
                                <label htmlFor="costoRepuesto" className="form-label">Costo Repuesto</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  id="costoRepuesto"
                                  value={editPresupuesto.costoRepuesto || ''}
                                  onChange={(e) => setEditPresupuesto({ ...editPresupuesto, costoRepuesto: parseFloat(e.target.value) })}
                                />
                              </div>
                              <div className="mb-3">
                                <label htmlFor="costoTotal" className="form-label">Costo Total</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  id="costoTotal"
                                  value={editPresupuesto.costoTotal || ''}
                                  onChange={(e) => setEditPresupuesto({ ...editPresupuesto, costoTotal: parseFloat(e.target.value) })}
                                />
                              </div>
                              <div className="mb-3">
                                <label htmlFor="estadoPresupuesto" className="form-label">Estado</label>
                                <select
                                  className="form-select"
                                  id="estadoPresupuesto"
                                  value={editPresupuesto.estado || ''}
                                  onChange={(e) => setEditPresupuesto({ ...editPresupuesto, estado: e.target.value })}
                                >
                                  <option value="PENDIENTE">Pendiente</option>
                                  <option value="APROBADO">Aprobado</option>
                                  <option value="RECHAZADO">Rechazado</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="card">
                            <div className="card-header text-dark">
                              <h6 className="text-primary"><i className="bi bi-box"></i> Casillero</h6>
                            </div>
                            <div className="card-body">
                              <div className="mb-3">
                                <label htmlFor="numeroCasillero" className="form-label">Número de Casillero</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  id="numeroCasillero"
                                  value={editCasillero.numero || ''}
                                  onChange={(e) => setEditCasillero({ ...editCasillero, numero: e.target.value })}
                                />
                              </div>
                              <div className="mb-3">
                                <label htmlFor="estadoCasillero" className="form-label">Estado</label>
                                <select
                                  className="form-select"
                                  id="estadoCasillero"
                                  value={editCasillero.estado || ''}
                                  onChange={(e) => setEditCasillero({ ...editCasillero, estado: e.target.value })}
                                >
                                  <option value="DISPONIBLE">Disponible</option>
                                  <option value="OCUPADO">Ocupado</option>
                                  <option value="MANTENIMIENTO">En mantenimiento</option>
                                </select>
                              </div>
                              <div className="mb-3">
                                <label htmlFor="descripcionCasillero" className="form-label">Descripción</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  id="descripcionCasillero"
                                  value={editCasillero.descripcion || ''}
                                  onChange={(e) => setEditCasillero({ ...editCasillero, descripcion: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-12">
                          <div className="card">
                            <div className="card-header text-dark">
                              <h6 className="text-primary"><i className="bi bi-clipboard-data"></i> Actividades Técnicas</h6>
                            </div>
                            <div className="card-body">
                              {editActividades.map((actividad, index) => (
                                <div key={index} className="mb-3">
                                  <div className="mb-3">
                                    <label htmlFor={`fechaActividad-${index}`} className="form-label">Fecha</label>
                                    <input
                                      type="date"
                                      className="form-control"
                                      id={`fechaActividad-${index}`}
                                      value={actividad.fecha ? new Date(actividad.fecha).toISOString().split('T')[0] : ''}
                                      onChange={(e) => {
                                        const newActividades = [...editActividades];
                                        newActividades[index].fecha = e.target.value;
                                        setEditActividades(newActividades);
                                      }}
                                    />
                                  </div>
                                  <div className="mb-3">
                                    <label htmlFor={`descripcionActividad-${index}`} className="form-label">Descripción</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      id={`descripcionActividad-${index}`}
                                      value={actividad.descripcion || ''}
                                      onChange={(e) => {
                                        const newActividades = [...editActividades];
                                        newActividades[index].descripcion = e.target.value;
                                        setEditActividades(newActividades);
                                      }}
                                    />
                                  </div>
                                  <div className="mb-3">
                                    <label htmlFor={`diagnosticoActividad-${index}`} className="form-label">Diagnóstico</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      id={`diagnosticoActividad-${index}`}
                                      value={actividad.diagnostico || ''}
                                      onChange={(e) => {
                                        const newActividades = [...editActividades];
                                        newActividades[index].diagnostico = e.target.value;
                                        setEditActividades(newActividades);
                                      }}
                                    />
                                  </div>
                                  <div className="mb-3">
                                    <label htmlFor={`trabajoRealizadoActividad-${index}`} className="form-label">Trabajo Realizado</label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      id={`trabajoRealizadoActividad-${index}`}
                                      value={actividad.trabajoRealizado || ''}
                                      onChange={(e) => {
                                        const newActividades = [...editActividades];
                                        newActividades[index].trabajoRealizado = e.target.value;
                                        setEditActividades(newActividades);
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
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
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <button className="page-link">Previous</button>
                </li>
                {Array.from({ length: Math.ceil(filteredOrders.length / itemsPerPage) }, (_, index) => (
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
                  className={`page-item ${currentPage === Math.ceil(filteredOrders.length / itemsPerPage) ? "disabled" : ""}`}
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
              <span className="ms-2">órdenes por página</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;