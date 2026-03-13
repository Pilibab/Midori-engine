// example/App.tsx
import { useEffect, useRef } from 'react';
import { MidoriEngine } from '../src/index'; // Adjust path based on your vite config
import { normalize_model } from '../src/math/normalize_svg_model.ts';
import { sampleDataKanji } from '../src/test-data/sample-kanji.ts';
interface pointsVal {
    x: number;
    y: number;
}
const displayDots = (points: pointsVal[], ctx: CanvasRenderingContext2D | null) => {
  if (!ctx) return;

  ctx.fillStyle = 'red';
  
  points.forEach(point => {
    ctx.beginPath();
    // Use a small radius so you can see the individual samples
    ctx.arc(point.x, point.y, 1, 0, Math.PI * 2);
    ctx.fill();
  });

}
function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MidoriEngine | null>(null);

  const points = normalize_model(sampleDataKanji.stroke_components);

  console.log(points);
  
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      const engine = new MidoriEngine(canvasRef.current);
      engine.setupHighDPI();

      // Attach a listener that React can use
      engine.onPointAdded = (point, allPoints) => {
        console.log("New point in React:", point);
        // Here you could update a React state, calculate a score, etc.
      };

      const canvasCtx = canvasRef.current.getContext("2d");
      engineRef.current = engine;

      displayDots(points, canvasCtx)
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1>Midori Engine</h1>
      <canvas 
        ref={canvasRef} 
        style={{ 
          border: '1px solid black', 
          width: '109px', // Display size
          height: '109px', 
          touchAction: 'none' // CRITICAL: prevents browser scrolling while drawing
        }} 
      />
      <div>

      </div>
    </div>
  );
}

export default App;

