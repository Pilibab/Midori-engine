import { ComponentPoint, StrokePoint } from "../types.ts";


export const isComponent = (strokes: StrokePoint | ComponentPoint): strokes is ComponentPoint =>  {
    // We check if the first element exists and is an array of points
    // Ts doesnt trust a check using stroke && stroke.length > 0 && Array.isArray(stroke[0])
    // so we make a function that checks it and returns an assertion of the parameter with the type 
    return Array.isArray(strokes[0]);
}
