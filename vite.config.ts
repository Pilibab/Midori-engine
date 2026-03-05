import { defineConfig, ConfigEnv, UserConfig } from 'vite'; // Added types
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

// Using the ConfigEnv type fixes the 'command' implicitly has any type error
export default defineConfig(({ command }: ConfigEnv): UserConfig => {
  if (command === 'serve') {
    return {
      root: resolve(__dirname, 'example'), // Added resolve for safety
      plugins: [react()],
      server: { port: 3000 }
    };
  } else {
    return {
      plugins: [dts({ rollupTypes: true })],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'MidoriEngine',
          fileName: 'midori-engine',
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
            },
          },
        },
      },
    };
  }
});