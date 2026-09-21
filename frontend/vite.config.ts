import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // redirect.html é a página de retorno do login Microsoft (popup),
      // separada do app — ver src/redirect.ts.
      input: {
        main: resolve(__dirname, 'index.html'),
        redirect: resolve(__dirname, 'redirect.html'),
      },
    },
  },
})
