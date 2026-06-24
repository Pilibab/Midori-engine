import type { Point, StrokeComponent, StrokeTelemetry } from "../types.ts";
import { 
    createInitialTelemetry, 
    updateTelemetry, 
    calculateFinalStrokeScore,
    evaluateLivePoint
} from "../math/stroke_eval.ts";

export class MidoriEngine {
    // provides a way to manipulate the properties and method of canvas 
    private canvas: HTMLCanvasElement;
    //  provides the 2D rendering context for the drawing surface of a <canvas> element
    private ctx: CanvasRenderingContext2D;
    private isDrawing : boolean = false; 

    // stores the stroke being drawn by user to perform comparison
    private currentStroke: Point[] = [];
    private anchor: Point | null = null;


    // Matrix Telemetry Tracking Properties
    private interpolatedModelPoints: Point[][] = []; 
    private activeStrokeIndex: number = 0;
    private currentTelemetry: StrokeTelemetry | null = null;
    private maxIndexReached: number = 0;
    private frameCount: number = 0;
    // React Callbacks
    public onPointAdded?: (point: Point, allPoints: Point[]) => void;
    public onStrokeCompleted?: (result: { finalScore: number; passing: boolean; feedback: string }) => void;

    // private svgMOdel: StrokeComponent | null = null; 

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.currentStroke; 
        this.init();
    }

    private init() {
        this.canvas.addEventListener("pointerdown", (e) => this.startDrawing(e));
        this.canvas.addEventListener("pointermove", (e) => this.draw(e));
        window.addEventListener("pointerup", () => this.stopDrawing());

        // Standard high-quality brush properties
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.lineWidth = 4;
    }

    private startDrawing(e : PointerEvent) {
        // Guard check: Ensure a model is loaded and we aren't out of strokes
        if (this.interpolatedModelPoints.length === 0 || this.activeStrokeIndex >= this.interpolatedModelPoints.length) return;

        this.isDrawing = true;
        const coords= this.getCoords(e);        

        this.ctx.beginPath();
        this.ctx.moveTo(coords.x, coords.y);

        this.currentStroke = [coords];
        this.anchor = coords;

        // Reset Telemetry Tracking for the new stroke attempt
        this.currentTelemetry = createInitialTelemetry();
        this.maxIndexReached = 0;
        this.frameCount = 0;
    }

    private draw (e : PointerEvent) {
        if (!this.isDrawing || !this.anchor || !this.currentTelemetry) return;

        const currentPoint = this.getCoords(e);

        // ADD TO DATA STREAM
        this.currentStroke.push(currentPoint);
        this.frameCount++;

        // Get the specific stroke target the user is supposed to be drawing
        const targetStrokeTemplate = this.interpolatedModelPoints[this.activeStrokeIndex];

        // MATH EVALUATION ENGINE RUNS HERE
        const isFirstFrames = this.frameCount <= 5;
        const evaluation = evaluateLivePoint(
            currentPoint, 
            targetStrokeTemplate, 
            this.maxIndexReached, 
            isFirstFrames
        );
        
        // Update active thresholds
        if (evaluation.closestIndex > this.maxIndexReached) {
            this.maxIndexReached = evaluation.closestIndex;
        }

        // Stream frame data into the telemetry bucket
        this.currentTelemetry = updateTelemetry(this.currentTelemetry, evaluation);
        // dynamic coloring for each point 
        this.ctx.strokeStyle = evaluation.color
        // Draw the segment from the LAST point (anchor) to the CURRENT point
        this.ctx.beginPath();
        this.ctx.moveTo(this.anchor.x, this.anchor.y);
        this.ctx.lineTo(currentPoint.x, currentPoint.y);
        this.ctx.stroke();


        // Call the callback if it exists
        if (this.onPointAdded) {
            this.onPointAdded(currentPoint, this.currentStroke);
        }
        // Append to your current stroke collection
        // Note: You'll need a way to track the current active stroke!
        
        // Update the anchor for the NEXT move event (The Leapfrog)
        this.anchor = currentPoint;
    }

    private stopDrawing() {
        this.isDrawing = false;

                const targetStrokeTemplate = this.interpolatedModelPoints[this.activeStrokeIndex];

        if (this.currentTelemetry && targetStrokeTemplate) {
            // 3. MACRO EVALUATION RUNS HERE ON PEN-UP
            const evaluationResult = calculateFinalStrokeScore(this.currentTelemetry, targetStrokeTemplate);

            // Notify React view layer of performance metrics
            if (this.onStrokeCompleted) {
                this.onStrokeCompleted(evaluationResult);
            }

            // If the user performed well enough, unlock and increment to the next stroke path
            if (evaluationResult.passing) {
                this.activeStrokeIndex++;
            } else {
                // Optional: Clear or reset the failed drawn path from canvas so they can try again
                this.clearCanvasAndRedrawTemplate();
            }
        }

        this.currentTelemetry = null;
        this.anchor = null;
    }

    private clearCanvasAndRedrawTemplate() {
        // Basic canvas clearing strategy. In a real build, you would trigger
        // a canvas reload or push an event back up to React to call displayDots again.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private getCoords(e : PointerEvent) : Point {
        // get screen size 
        const {left, top} = this.canvas.getBoundingClientRect()
        
        return {
            x: e.clientX - left,
            y: e.clientY - top,
            pressure: e.pressure,
            timestamp: e.timeStamp
        }
    }

    public setupHighDPI() {
        const devicePxRatio = window.devicePixelRatio || 1;

        // getBoundingClientRect() returns the size of the element
        // in CSS pixels (the layout size on the page).
        const { width, height } = this.canvas.getBoundingClientRect();

        // canvas.width and canvas.height control the size of the
        // internal drawing buffer (the bitmap resolution).
        // They are NOT automatically tied to device pixels.
        // If the canvas is styled with CSS so that its display
        // size differs from its internal buffer size, the browser
        // will scale the bitmap to fit the layout box.
        //
        // Example:
        // CSS size: 800×600
        // canvas.width: 400×300
        // → browser stretches the bitmap → blurry rendering.

        // To avoid this on high-DPI displays, we increase the
        // internal buffer resolution to match the device density.
        this.canvas.height = height * devicePxRatio;
        this.canvas.width  = width * devicePxRatio;

        // Device Pixel Ratio (DPR) is the ratio between
        // physical device pixels and CSS pixels.
        //
        // Example:
        // DPR = 2
        // 1 CSS pixel = 2×2 device pixels

        // If the canvas CSS size is 400×300 and the internal
        // buffer is also 400×300 on a DPR=2 screen, the browser
        // must stretch the bitmap to 800×600 device pixels,
        // which causes blur.

        // By enlarging the buffer we ensure there are enough
        // pixels to render sharply on high-DPI displays.

        // However, after enlarging the buffer, the canvas drawing
        // coordinate system is now in the larger pixel space.
        //
        // Example:
        // buffer = 800×600
        // drawing (100,100) would now appear half as large visually.
        //
        // Scaling the context maps drawing coordinates back to
        // CSS pixel space so drawing code can still use CSS units.
        this.ctx.scale(devicePxRatio, devicePxRatio)

        // * my analogy 
        // If the canvas bitmap is too small, the browser stretches each pixel (button) 
        // to fill the screen, which makes the image blurry.
        // Instead of enlarging the buttons, we increase the number of buttons (pixels) in the canvas 
        // so each screen pixel can display a real pixel from the buffer.

        // Re-apply styles after buffer resolution shifts]
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.lineWidth = 4;
    }

    public setTargetModelPoints(points: Point[][]) {
        this.interpolatedModelPoints = points;
        this.activeStrokeIndex = 0; // Reset level progress
    }
}