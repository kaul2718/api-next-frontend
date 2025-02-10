"use client"; // Necesario para usar hooks en Next.js App Router

import "bootstrap/dist/css/bootstrap.min.css";
import { signOut, useSession } from "next-auth/react";
import { Dropdown } from "react-bootstrap";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Importar useRouter

const Header = () => {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter(); // Instancia de useRouter para redirección

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSignOut = async () => {
    await signOut();
    router.push("/"); // Redirige a la página de inicio después de cerrar sesión
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>No tienes sesión iniciada.</p>;
  }

  return (
    <nav
      className="d-flex align-items-center justify-content-between bg-dark text-white shadow px-4 py-2"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1050,
      }}
    >
      <div className="d-flex align-items-center">
        <Link href="/" className="d-flex align-items-center text-white text-decoration-none">
          <Image src="/logohdc.png" alt="Hospital del Computador" width={40} height={40} />
          <span className="fw-bold fs-5 ms-2">Hospital del Computador</span>
        </Link>
      </div>

      <Dropdown show={isOpen} onToggle={handleToggle}>
        <Dropdown.Toggle
          variant="link"
          id="dropdown-custom-components"
          className="text-white d-flex align-items-center"
        >
          <i className="bi bi-person-fill" style={{ fontSize: "35px" }}></i>
          <div className="ms-2 text-start">
            <span className="d-block fw-bold">
              {session?.user?.user.nombre || "Usuario"}
            </span>
            <small className="text-light">{session?.user?.user.role || "Sin rol"}</small>
          </div>
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item as={Link} href="/perfil">
            Mi Perfil
          </Dropdown.Item>
          <Dropdown.Item as="button" onClick={handleSignOut} className="text-danger">
            Cerrar sesión
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

    </nav>
  );
};

export default Header;
