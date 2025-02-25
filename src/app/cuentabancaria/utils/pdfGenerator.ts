import { jsPDF } from "jspdf";

export const generatePDF = (order: any, logoBase64: string) => {
  const doc = new jsPDF();
  const marginLeft = 14;
  let y = 20; // Posición inicial

  // Agregar logo en la parte superior
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", marginLeft, 10, 30, 30); // Ajusta la posición y el tamaño
  }

  // Encabezado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ORDEN DE TRABAJO", 80, 25); // Centrando el título
  doc.setFontSize(14);
  y += 20;
  doc.text(`Número: ${order.workOrderNumber}`, marginLeft, y);

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y + 2, 190, y + 2);
  y += 10;

  // Información del Cliente
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Información del Cliente", marginLeft, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(`Nombre: ${order.client.nombre}`, marginLeft, y);
  y += 6;
  doc.text(`Cédula: ${order.client.cedula}`, marginLeft, y);
  y += 6;
  doc.text(`Correo: ${order.client.correo}`, marginLeft, y);
  y += 6;
  doc.text(`Teléfono: ${order.client.telefono}`, marginLeft, y);
  y += 6;
  doc.text(`Dirección: ${order.client.direccion}`, marginLeft, y);
  y += 6;
  doc.text(`Ciudad: ${order.client.ciudad}`, marginLeft, y);
  y += 10;

  // Información del Técnico
  doc.setFont("helvetica", "bold");
  doc.text("Técnico Asignado", marginLeft, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(`Técnico: ${order.technician.nombre}`, marginLeft, y);
  y += 6;
  doc.text(`Rol: ${order.technician.role}`, marginLeft, y);
  y += 10;

  // Detalles de la Orden
  doc.setFont("helvetica", "bold");
  doc.text("Detalles de la Orden", marginLeft, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(`Estado: ${order.estado}`, marginLeft, y);
  y += 6;
  doc.text("Problema Reportado:", marginLeft, y);
  y += 6;
  doc.text(order.problemaReportado, marginLeft + 5, y, { maxWidth: 170 });
  y += 10;
  doc.text(`Fecha de Ingreso: ${new Date(order.fechaIngreso).toLocaleDateString()}`, marginLeft, y);
  y += 10;

  // Presupuesto
  if (order.presupuesto) {
    doc.setFont("helvetica", "bold");
    doc.text("Presupuesto", marginLeft, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Costo Mano de Obra: $${order.presupuesto.costoManoObra ? Number(order.presupuesto.costoManoObra).toFixed(2) : 'No disponible'}`, marginLeft, y);
    y += 6;
    doc.text(`Costo Repuesto: $${order.presupuesto.costoRepuesto ? Number(order.presupuesto.costoRepuesto).toFixed(2) : 'No disponible'}`, marginLeft, y);
    y += 6;
    doc.text(`Costo Total: $${order.presupuesto.costoTotal ? Number(order.presupuesto.costoTotal).toFixed(2) : 'No disponible'}`, marginLeft, y);
    y += 10;
  }

  // Línea separadora final
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, 190, y);
  y += 10;

  // Firma
  doc.text("__________________________", marginLeft, y + 10);
  doc.text("Firma del Técnico", marginLeft, y + 18);

  // Mostrar el PDF para imprimir
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
};
