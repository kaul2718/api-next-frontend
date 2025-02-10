// src/components/BootstrapClient.tsx

"use client"; // Esta directiva asegura que el componente solo se ejecute en el cliente

import { useEffect } from "react";

const BootstrapClient = () => {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null; // Este componente no renderiza nada en el DOM
};

export default BootstrapClient;
