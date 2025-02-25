"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

interface ValidationError {
  field: string;
  message: string;
}

const RegisterPage = () => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [nombre, setNombre] = useState<string>("");
  const [correo, setCorreo] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  // Validación en tiempo real de campos individuales
  const validateField = (field: string, value: string): ValidationError | null => {
    switch (field) {
      case "nombre":
        return !value.trim() ? { field, message: "El nombre es obligatorio" } : null;
      case "correo":
        if (!value.trim()) {
          return { field, message: "El correo es obligatorio" };
        }
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        return !emailPattern.test(value) ? { field, message: "Formato de correo inválido" } : null;
      case "password":
        if (!value.trim()) {
          return { field, message: "La contraseña es obligatoria" };
        }
        if (value.length < 6 || value.length > 20) {
          return { field, message: "La contraseña debe tener entre 6 y 20 caracteres" };
        }
        return null;
      case "confirmPassword":
        if (!value.trim()) {
          return { field, message: "La confirmación es obligatoria" };
        }
        if (value !== password) {
          return { field, message: "Las contraseñas no coinciden" };
        }
        return null;
      default:
        return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    // Validación completa del formulario
    const validationResults = [
      validateField("nombre", nombre),
      validateField("correo", correo),
      validateField("password", password),
      validateField("confirmPassword", confirmPassword)
    ].filter(Boolean) as ValidationError[];

    if (validationResults.length > 0) {
      setErrors(validationResults);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre,
          correo,
          password,
          role: "Contador"
        })
      });

      const responseAPI = await res.json();

      if (!res.ok) {
        setErrors(Array.isArray(responseAPI.message)
          ? responseAPI.message.map((msg: string) => ({ field: "server", message: msg }))
          : [{ field: "server", message: responseAPI.message }]);
        return;
      }

      const responseNextAuth = await signIn("credentials", {
        correo,
        password,
        redirect: false
      });

      if (responseNextAuth?.error) {
        setErrors([{ field: "auth", message: responseNextAuth.error }]);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setErrors([{ field: "server", message: "Error del servidor. Intente nuevamente." }]);
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center">
      <div className="d-flex w-75 shadow-lg rounded-4 overflow-hidden">
        {/* Sección izquierda (Formulario de registro) */}
        <div className="d-flex flex-column justify-content-center align-items-center w-50 bg-light p-4">
          <h2 className="mb-3">Registro</h2>
          <form className="w-75" onSubmit={handleSubmit}>
            {/* Campo de nombre */}
            <div className={`mb-2 position-relative ${errors.some(e => e.field === "nombre") ? "has-error" : ""}`}>
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className={`form-control ${errors.some(e => e.field === "nombre") ? "border-danger" : ""}`}
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  const error = validateField("nombre", e.target.value);
                  if (error) {
                    setErrors(prev => [...prev.filter(e => e.field !== "nombre"), error]);
                  } else {
                    setErrors(prev => prev.filter(e => e.field !== "nombre"));
                  }
                }}
              />
              {errors.some(e => e.field === "nombre") && (
                <div className="invalid-feedback d-block">
                  {errors.find(e => e.field === "nombre")?.message}
                </div>
              )}
            </div>

            {/* Campo de correo */}
            <div className={`mb-2 position-relative ${errors.some(e => e.field === "correo") ? "has-error" : ""}`}>
              <label className="form-label">Correo</label>
              <input
                type="email"
                className={`form-control ${errors.some(e => e.field === "correo") ? "border-danger" : ""}`}
                placeholder="Correo"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  const error = validateField("correo", e.target.value);
                  if (error) {
                    setErrors(prev => [...prev.filter(e => e.field !== "correo"), error]);
                  } else {
                    setErrors(prev => prev.filter(e => e.field !== "correo"));
                  }
                }}
              />
              {errors.some(e => e.field === "correo") && (
                <div className="invalid-feedback d-block">
                  {errors.find(e => e.field === "correo")?.message}
                </div>
              )}
            </div>

            {/* Campo de contraseña */}
            <div className={`mb-2 position-relative ${errors.some(e => e.field === "password") ? "has-error" : ""}`}>
              <label className="form-label">Contraseña</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`form-control ${errors.some(e => e.field === "password") ? "border-danger" : ""}`}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    const error = validateField("password", e.target.value);
                    if (error) {
                      setErrors(prev => [...prev.filter(e => e.field !== "password"), error]);
                    } else {
                      setErrors(prev => prev.filter(e => e.field !== "password"));
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
              {errors.some(e => e.field === "password") && (
                <div className="invalid-feedback d-block">
                  {errors.find(e => e.field === "password")?.message}
                </div>
              )}
            </div>

            {/* Campo de confirmación de contraseña */}
            <div className={`mb-2 position-relative ${errors.some(e => e.field === "confirmPassword") ? "has-error" : ""}`}>
              <label className="form-label">Confirmar Contraseña</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-control ${errors.some(e => e.field === "confirmPassword") ? "border-danger" : ""}`}
                  placeholder="Confirmar Contraseña"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    const error = validateField("confirmPassword", e.target.value);
                    if (error) {
                      setErrors(prev => [...prev.filter(e => e.field !== "confirmPassword"), error]);
                    } else {
                      setErrors(prev => prev.filter(e => e.field !== "confirmPassword"));
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
              {errors.some(e => e.field === "confirmPassword") && (
                <div className="invalid-feedback d-block">
                  {errors.find(e => e.field === "confirmPassword")?.message}
                </div>
              )}
            </div>

            {/* Botón de registro */}
            <button
              type="submit"
              className={`btn btn-dark w-100 mt-3 ${errors.length > 0 ? "shake-animation" : ""}`}
            >
              Registrarse
            </button>
          </form>

          {/* Errores generales */}
          {errors.some(e => ["server", "auth"].includes(e.field)) && (
            <div className="alert alert-danger mt-2 w-75">
              {errors
                .filter(e => ["server", "auth"].includes(e.field))
                .map((error, index) => (
                  <p key={index} className="mb-1">{error.message}</p>
                ))}
            </div>
          )}

          <p className="mt-3">
            ¿Ya tienes una cuenta? <a href="/" className="text-primary">Inicia sesión</a>
          </p>
        </div>

        {/* Sección derecha (Información adicional) */}
        <div className="w-50 d-flex flex-column justify-content-center align-items-center bg-dark text-white p-4">
          <img src="/banco.png" alt="Logo" className="mb-3" style={{ width: "250px" }} />
          <h3>Hospital del Computador</h3>
          <p>Tu equipo en nuestras manos</p>
        </div>
      </div>

      {/* Estilos adicionales */}
      <style jsx>{`
        .shake-animation {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .has-error {
          animation: pulse 0.5s ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(220,53,69,0.2); }
          50% { box-shadow: 0 0 0 4px rgba(220,53,69,0.3); }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;