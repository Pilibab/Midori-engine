import type { Point, Stroke } from "../types.ts";

export class MidoriEngine {
    // provides a way to manipulate the properties and method of canvas 
    private canvas: HTMLCanvasElement;

    //  provides the 2D rendering context for the drawing surface of a <canvas> element
    private ctx: CanvasRenderingContext2D;

    private isDrawing : boolean = false; 
    private points:  Stroke[] = []; 
    private anchor: Point | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.init();
    }

    private init() {
        this.canvas.addEventListener("pointerdown", (e) => this.startDrawing);
        this.canvas.addEventListener("pointermove", (e) => this.draw);
        window.addEventListener("pointerup", (e) => this.stopDrawing);
    }

    private startDrawing(e : PointerEvent) {

        if (!this.isDrawing || !this.anchor) return;

        this.isDrawing = true;
        const coords= this.getCoords(e);

        // if we havent set anchor 
        this.ctx.beginPath();
        this.ctx.moveTo(coords.x, coords.y);

        this.anchor = coords;
    }

    private draw (e : PointerEvent) {
        if (!this.isDrawing) return;
    }

    private stopDrawing(e : PointerEvent) {

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

    setupHighDPI() {
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
    }


}