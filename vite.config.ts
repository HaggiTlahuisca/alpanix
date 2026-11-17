import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// Configuración independiente: el proyecto no necesita recursos internos de Figma.
export default defineConfig({plugins:[react(),tailwindcss()],base:'/',build:{sourcemap:false}});
