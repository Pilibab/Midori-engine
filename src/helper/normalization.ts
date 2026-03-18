// this file is for setting the first point of the stroke as the origin so that both stroke will have the same starting point 
import type { StrokePoint } from "../types.ts";

export const shift_point = (points: StrokePoint) => {
    // if points is singular return 
    if (points.length == 0) return 

    // get the x, y of the first point 
    const {x: shiftX, y: shiftY} = points[0]

    const shiftedPoints = points.map((point, _) => {
        const {x, y} = point;

        // export shifter points 
        return {
            x: x - shiftX,
            y: y - shiftY
        }
    })
    return shiftedPoints;
} 

