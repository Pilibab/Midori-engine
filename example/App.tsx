// example/App.tsx
import { useEffect, useRef, useState } from 'react';
import { MidoriEngine, StrokeTelemetry } from '../src/index'; // Adjust path based on your vite config
import { sampleDataKanji } from '../src/test-data/sample-kanji.ts';
import { generate_point_interpolations } from '../src/helper/svg-parser.ts';

import { displayDots } from '../src/helper/display_dots.ts';



function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MidoriEngine | null>(null);
    // React state properties to display engine calculations to the user
  const [scoreDisplay, setScoreDisplay] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("Draw the first stroke to begin.");
  const [isPassing, setIsPassing] = useState<boolean | null>(null);
  // converts stroke to pts 
  const points = generate_point_interpolations(sampleDataKanji.stroke_components);
  
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      const engine = new MidoriEngine(canvasRef.current);
      engine.setupHighDPI();
      engine.setTargetModelPoints(points)

      // Listen for when the user completes an full manual gesture sequence
      engine.onStrokeCompleted = (result) => {
        setScoreDisplay(result.finalScore);
        setFeedbackMessage(result.feedback);
        setIsPassing(result.passing);

        // Re-render guidelines if a clear event wiped them
        const canvasCtx = canvasRef.current?.getContext("2d");
        // if (canvasCtx) displayDots(points, canvasCtx);
      };

      const canvasCtx = canvasRef.current.getContext("2d");
      engineRef.current = engine;
      displayDots(engine.interpolatedModelPoints, canvasCtx);
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <h1>Midori Evaluation Engine</h1>
      
      {/* Dynamic Performance HUD Board */}
      <div style={{ marginBottom: '20px', textAlign: 'center', minHeight: '80px' }}>
        {scoreDisplay !== null && (
          <h2 style={{ color: isPassing ? '#4caf50' : '#f44336', margin: '5px 0' }}>
            Score: {scoreDisplay}% {isPassing ? '✓' : '✗'}
          </h2>
        )}
        <p style={{ color: '#555', fontSize: '1.1rem' }}>{feedbackMessage}</p>
      </div>

      <canvas 
        ref={canvasRef} 
        style={{ 
          border: '2px solid #333', 
          borderRadius: '8px',
          width: '209px', 
          height: '209px', 
          touchAction: 'none',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          cursor: 'crosshair'
        }} 
      />
    </div>
  );
}

export default App;

