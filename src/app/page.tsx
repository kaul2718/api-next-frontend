"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [correo, setCorreo] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

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

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center">
      <div
        className="d-flex w-75 shadow-lg rounded-4 overflow-hidden"
        style={{ boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.3)" }}
      >
        {/* Sección izquierda (Formulario de login) */}
        <div
          className="d-flex flex-column justify-content-center align-items-center w-50 bg-light p-4"
          style={{
            height: "50vh",
            borderTopLeftRadius: "20px",
            borderBottomLeftRadius: "20px",
            boxShadow: "inset 5px 5px 10px rgba(0, 0, 0, 0.2)",
          }}
        >
          <h2 className="mb-3">Iniciar sesión</h2>

          <form className="w-75" onSubmit={handleSubmit}>
            {/* Campo de correo con icono */}
            <div className="mb-3 position-relative">
              <label className="form-label">Correo electrónico</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Ingresa tu correo"
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
                />
              </div>
            </div>

            {/* Campo de contraseña con icono y botón de mostrar/ocultar */}
            <div className="mb-3 position-relative">
              <label className="form-label">Contraseña</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            {/* Enlace para recuperar contraseña */}
            <div className="d-flex justify-content-between">
              <a href="#" className="text-primary">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón de login */}
            <button type="submit" className="btn btn-dark w-100 mt-3">
              Iniciar sesión
            </button>
          </form>

          {/* Mensajes de error */}
          {errors.length > 0 && (
            <div className="alert alert-danger mt-2">
              <ul className="mb-0">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Enlace para registrarse */}
          <p className="mt-3">
            ¿No tienes una cuenta?{" "}
            <a href="/register" className="text-primary">
              Crea una cuenta
            </a>
          </p>
        </div>

        {/* Sección derecha (Información adicional) */}
        <div
          className="w-50 d-flex flex-column justify-content-center align-items-center bg-dark text-white p-4"
          style={{
            height: "50vh",
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

export default LoginPage;
