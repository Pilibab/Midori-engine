// example/App.tsx
import { useEffect, useRef } from 'react';
import { MidoriEngine } from '../src/index'; // Adjust path based on your vite config

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MidoriEngine | null>(null);

useEffect(() => {
  if (canvasRef.current && !engineRef.current) {
    const engine = new MidoriEngine(canvasRef.current);
    engine.setupHighDPI();

    // Attach a listener that React can use
    engine.onPointAdded = (point, allPoints) => {
      console.log("New point in React:", point);
       // Here you could update a React state, calculate a score, etc.
    };

    engineRef.current = engine;
  }
}, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1>Midori Engine</h1>
      <canvas 
        ref={canvasRef} 
        style={{ 
          border: '1px solid black', 
          width: '400px', // Display size
          height: '300px', 
          touchAction: 'none' // CRITICAL: prevents browser scrolling while drawing
        }} 
      />
    </div>
  );
}

export default App;