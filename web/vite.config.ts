// vite.config.js

import { loadEnv, defineConfig } from 'vite'
import { ngrok } from 'vite-plugin-ngrok'

export default defineConfig({
  // Note you should not store your ngrok token in your code/repo. Make sure to move this to 
  // a more secure place before sharing your project.
  plugins: [
    ngrok({
      domain: 'mongoose-generous-thankfully.ngrok-free.app',
      compression: false,
      authtoken: '2g9eHZgmkDbJxtYj4tBMJ7fbwpK_2BeKcoMZ7MALzqByHj1im'
    }),
  ],

  server: {
    host: '0.0.0.0',
    port: 3000,
    // https: {
    //  key: './localhost.key',
    //  cert: './localhost.crt',
    // },
    // Use ngrok for development
   hmr: {
     protocol: 'ws',
     //host: 'mongoose-generous-thankfully.ngrok-free.app',
     port: 80,
   },
  },
});


