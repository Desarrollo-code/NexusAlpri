
// Este script ayuda a depurar las variables de entorno durante el despliegue en Render.
console.log("--- Checking Environment Variables ---");
console.log("DATABASE_URL is set:", !!process.env.DATABASE_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("------------------------------------");

