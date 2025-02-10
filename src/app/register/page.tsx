"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/footer"; // Asegúrate de importar correctamente
import Header from "@/components/Header";


const RegisterPage = () => {
  const [errors, setErrors] = useState<string[]>([]);
  const [cedula, setCedula] = useState<string>("");
  const [nombre, setNombre] = useState<string>("");
  const [correo, setCorreo] = useState<string>("");
  const [telefono, setTelefono] = useState<string>("");
  const [direccion, setDireccion] = useState<string>("");
  const [ciudad, setCiudad] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cedula,
        nombre,
        correo,
        telefono,
        direccion,
        ciudad,
        password,
        role: "Cliente", // 👈 Se agrega explícitamente el rol
      }),
    });

    const responseAPI = await res.json();

    if (!res.ok) {
      setErrors(Array.isArray(responseAPI.message) ? responseAPI.message : [responseAPI.message]);
      return;
    }

    const responseNextAuth = await signIn("credentials", {
      correo,
      password,
      redirect: false,
    });

    if (responseNextAuth?.error) {
      setErrors(responseNextAuth.error.split(","));
      return;
    }

    router.push("/dashboard");
  };
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center">
      <div
        className="d-flex w-75 shadow-lg rounded-4 overflow-hidden"
        style={{ boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.3)" }}
      >
        {/* Sección izquierda (Formulario de registro) */}
        <div
          className="d-flex flex-column justify-content-center align-items-center w-50 bg-light p-4"
          style={{
            height: "80vh",
            borderTopLeftRadius: "20px",
            borderBottomLeftRadius: "20px",
            boxShadow: "inset 5px 5px 10px rgba(0, 0, 0, 0.2)",
          }}
        >
          <h2 className="mb-3">Registro</h2>
          <form className="w-75" onSubmit={handleSubmit}>
            {[
              { label: "Cédula", value: cedula, setter: setCedula, icon: "bi-person-vcard" },
              { label: "Nombre", value: nombre, setter: setNombre, icon: "bi-person" },
              { label: "Correo", value: correo, setter: setCorreo, icon: "bi-envelope", type: "email" },
              { label: "Teléfono", value: telefono, setter: setTelefono, icon: "bi-telephone" },
              { label: "Dirección", value: direccion, setter: setDireccion, icon: "bi-geo-alt" },
              { label: "Ciudad", value: ciudad, setter: setCiudad, icon: "bi-buildings" },
            ].map(({ label, value, setter, icon, type = "text" }, index) => (
              <div className="mb-2 position-relative" key={index}>
                <label className="form-label">{label}</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className={`bi ${icon}`}></i>
                  </span>
                  <input
                    type={type}
                    className="form-control"
                    placeholder={label}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                  />
                </div>
              </div>
            ))}

            {/* Campo de contraseña con botón de mostrar/ocultar */}
            <div className="mb-2 position-relative">
              <label className="form-label">Contraseña</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-dark w-100 mt-3">
              Registrarse
            </button>
          </form>
          {errors.length > 0 && (
            <div className="alert alert-danger mt-2 w-75">
              <ul className="mb-0">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3">
            ¿Ya tienes una cuenta? <a href="/" className="text-primary">Inicia sesión</a>
          </p>
        </div>

        {/* Sección derecha (Información adicional) */}
        <div
          className="w-50 d-flex flex-column justify-content-center align-items-center bg-dark text-white p-4"
          style={{
            height: "80vh",
            borderTopRightRadius: "20px",
            borderBottomRightRadius: "20px",
            boxShadow: "inset -5px -5px 10px rgba(255, 255, 255, 0.2)",
          }}
        >
          <img src="/logohdc.png" alt="Logo" className="mb-3" style={{ width: "100px" }} />
          <h3>Hospital del Computador</h3>
          <p>Tu equipo en nuestras manos</p>
        </div>
      </div>
    </div>
  );
};



export default RegisterPage;
