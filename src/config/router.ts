import { createBrowserRouter } from 'react-router-dom';

// Configuración de React Router con banderas futuras para eliminar advertencias
export const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
};

// Función para crear el router con configuración
export const createRouter = () => {
  return createBrowserRouter([], routerConfig);
};
