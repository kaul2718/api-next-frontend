"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import useUserRole from "@/hooks/useUserRole";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  const pathname = usePathname();
  const role = useUserRole();

  if (!role) return null;

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: "bi-speedometer2", roles: ["Administrador", "Técnico", "Cliente"] },
    {
      label: "Órdenes",
      icon: "bi-journal-text",
      roles: ["Administrador", "Técnico", "Cliente"],
      subItems: [
        { href: "/ordenes", label: "Ver Órdenes", icon: "bi-list-task" },
        { href: "/ordenes/agregar", label: "Agregar Orden", icon: "bi-plus-circle" },
      ],
    },
    { href: "/clientes", label: "Clientes", icon: "bi-person-badge", roles: ["Administrador"] },
    { href: "/repuestos", label: "Repuestos", icon: "bi-tools", roles: ["Administrador", "Técnico"] },
    { href: "/servicios", label: "Servicios", icon: "bi-briefcase-fill", roles: ["Administrador", "Técnico"] },
    { href: "/casilleros", label: "Casilleros", icon: "bi-box-seam", roles: ["Administrador"] },
    { href: "/configuracion", label: "Configuración", icon: "bi-gear-wide-connected", roles: ["Administrador", "Técnico"] },
  ];

  return (
    <div
      className="bg-dark text-white vh-100 d-flex flex-column align-items-start"
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        width: isCollapsed ? "80px" : "300px",
        transition: "width 0.3s ease",
        padding: "1rem",
        zIndex: 1040,
        marginTop: "60px",
      }}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <button
        className="btn btn-outline-light mb-3 w-100 text-start"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? "☰" : "✖ Cerrar"}
      </button>

      <ul className="nav flex-column w-100">
        {menuItems
          .filter(({ roles }) => role && roles.includes(role))
          .map(({ href, label, icon, subItems }) => (
            <li className="nav-item" key={label}>
              {subItems ? (
                <>
                  <button
                    className="nav-link btn w-100 text-start d-flex align-items-center"
                    onClick={() => setIsOrdersOpen(!isOrdersOpen)}
                  >
                    <i className={`bi ${icon} fs-5 me-2`}></i>
                    {!isCollapsed && label}
                    <i className={`bi ms-auto ${isOrdersOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                  </button>
                  {isOrdersOpen && (
                    <ul className="nav flex-column ms-3">
                      {subItems.map(({ href, label, icon }) => (
                        <li key={href} className="nav-item">
                          <Link href={href} className={`nav-link text-white ${pathname === href ? "active" : ""}`}>
                            <i className={`bi ${icon} fs-6 me-2`}></i> {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link href={href} className={`nav-link d-flex align-items-center ${pathname === href ? "active" : "text-white"}`}>
                  <i className={`bi ${icon} fs-5 me-2`}></i>
                  {!isCollapsed && label}
                </Link>
              )}
            </li>
          ))}
      </ul>

      <style jsx>{`
        .nav-link {
          transition: all 0.3s ease;
        }
        .nav-link:hover {
          background-color: #444;
          color: #f8f9fa;
        }
        .active {
          background-color: #007bff;
          color: white;
          font-weight: bold;
        }
        .nav-item ul {
          padding-left: 1rem;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
