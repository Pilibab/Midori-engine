// example/App.tsx
import { useEffect, useRef } from 'react';
import { MidoriEngine } from '../src/index'; // Adjust path based on your vite config

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MidoriEngine | null>(null);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      // 1. Initialize the engine
      engineRef.current = new MidoriEngine(canvasRef.current);
      
      // 2. Setup High DPI
      engineRef.current.setupHighDPI();
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1>Midori Engine</h1>
      <canvas 
        ref={canvasRef} 
        style={{ 
          border: '1px solid black', 
          width: '800px', // Display size
          height: '600px', 
          touchAction: 'none' // CRITICAL: prevents browser scrolling while drawing
        }} 
      />
    </div>
  );
}

export default App;