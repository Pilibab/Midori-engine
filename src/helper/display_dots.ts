import { pointsVal } from "@/types";

export const displayDots = (kanji_pts: pointsVal[][], ctx: CanvasRenderingContext2D | null) => {
    if (!ctx) return;

    ctx.fillStyle = 'red';
    
    kanji_pts.forEach(stroke_pts => {

        stroke_pts.forEach(pts => {
        ctx.beginPath();
        // Use a small radius so you can see the individual samples
        ctx.arc(pts.x, pts.y, 1, 0, Math.PI * 2);
        ctx.fill();
        });
    });
}