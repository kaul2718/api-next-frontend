"use client";
import Footer from "@/components/footer";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [correo, setCorreo] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();

  // Validación en tiempo real
  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case "correo":
        if (!value.trim()) return "El correo es obligatorio";
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!emailPattern.test(value)) return "Formato de correo inválido";
        return null;
      case "password":
        if (!value.trim()) return "La contraseña es obligatoria";
        if (value.length < 6) return "La contraseña debe tener al menos 6 caracteres";
        return null;
      default:
        return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    // Validación de campos
    const emailError = validateField("correo", correo);
    const passwordError = validateField("password", password);

    if (emailError || passwordError) {
      toast.error("Por favor, revisa los campos marcados en rojo");
      setErrors([emailError || "", passwordError || ""]);
      return;
    }

    try {
      const responseNextAuth = await signIn("credentials", {
        correo,
        password,
        redirect: false,
      });

      if (responseNextAuth?.error) {
        toast.error(responseNextAuth.error);
        setErrors([responseNextAuth.error]);
        return;
      }

      toast.success("¡Sesión iniciada correctamente!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Error al iniciar sesión. Por favor, intenta nuevamente.");
      setErrors(["Error al iniciar sesión"]);
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center">
      <div className="d-flex w-75 shadow-lg rounded-4 overflow-hidden">
        {/* Sección izquierda (Formulario de login) */}
        <div className="d-flex flex-column justify-content-center align-items-center w-50 bg-light p-4">
          <h2 className="mb-3">Iniciar sesión</h2>
          <form className="w-75" onSubmit={handleSubmit}>
            {/* Campo de correo con icono */}
            <div className={`mb-3 position-relative ${errors.includes(validateField("correo", correo)) ? "has-error" : ""}`}>
              <label className="form-label">Correo electrónico</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className={`form-control ${errors.includes(validateField("correo", correo)) ? 'border-danger' : ''}`}
                  placeholder="Ingresa tu correo"
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
                  style={{ fontSize: "16px", color: "black" }}
                />
                {errors.includes(validateField("correo", correo)) && (
                  <div className="invalid-feedback">
                    {validateField("correo", correo)}
                  </div>
                )}
              </div>
            </div>

            {/* Campo de contraseña con icono y botón de mostrar/ocultar */}
            <div className={`mb-3 position-relative ${errors.includes(validateField("password", password)) ? "has-error" : ""}`}>
              <label className="form-label">Contraseña</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`form-control ${errors.includes(validateField("password", password)) ? 'border-danger' : ''}`}
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
              {errors.includes(validateField("password", password)) && (
                <div className="invalid-feedback">
                  {validateField("password", password)}
                </div>
              )}
            </div>

            {/* Enlace para recuperar contraseña */}
            <div className="d-flex justify-content-between">
              <a href="#" className="text-primary">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón de login */}
            <button 
              type="submit" 
              className={`btn btn-dark w-100 mt-3 ${errors.length > 0 ? "shake-animation" : ""}`}
            >
              Iniciar sesión
            </button>
          </form>

          {/* Enlace para registrarse */}
          <p className="mt-3">
            ¿No tienes una cuenta?{" "}
            <a href="/register" className="text-primary">
              Crea una cuenta
            </a>
          </p>
        </div>

        {/* Sección derecha (Información adicional) */}
        <div className="w-50 d-flex flex-column justify-content-center align-items-center bg-dark text-white p-4">
          <img src="/banco.png" alt="Logo" className="mb-3" style={{ width: "250px" }} />
          <h3>Aplicacion Web</h3>
          <p>Conciliaciones Bancarias</p>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer 
        autoClose={3000} 
        position="top-right"
        toastClassName="toast-custom"
      />

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

        .toast-custom {
          background-color: #333;
          color: #fff;
          font-family: 'Arial', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;