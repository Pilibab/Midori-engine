// Inside src/math/stroke_scale.ts
import { isComponent } from "@/helper"; 
import { ComponentPoint, Point, StrokePoint  } from "@/types";

// 
const stroke_scale = (first_stroke: StrokePoint, model_stroke:  StrokePoint) => {

    // const model_first_stroke :  StrokePoint = model_stroke[0];

    // const s_canvas = ratio(calculate_Distance(model_first_stroke), calculate_Distance(model_stroke))
} 

const calculate_scale = () => {
    // $$S_{final} = (w \cdot S_{user}) + ((1 - w) \cdot S_{canvas})$$

}

const ratio = (x: number, y: number) => {
    // note that the L_svg and L_user is only for the first stroke 
    return x / y;
}

const resolve_stroke_distance = (strokes:  StrokePoint | ComponentPoint) => {
    let totalDistance = 0.0;

    // check if array is multi dimentional 
    if (isComponent(strokes)) {
        // if true we flatten because we are getting the entire distance of the component
        // summation ( l_component_1, l_component_2, l_component_3, ..., l_component_n )
        strokes.map((stroke) => {
            totalDistance += calculate_Distance(stroke)
        });
    } else {
        // point is in 1d 
        totalDistance = calculate_Distance(strokes);
    }
}

const calculate_Distance = (stroke:  StrokePoint ) => {
    let totalDistance = 0.0;
    let prevPoint: Point | null =  null;

    stroke.forEach((point_instance) => {

        const{ x: current_x, y: current_y} = point_instance; 
        // if prev is null means first point 
        // set it as (0,0)
        if  (prevPoint === null) {
            prevPoint = {
                x: 0, y: 0 
            }
        }   
        
        const delta_x = current_x - prevPoint.x;
        const delta_y = current_y - prevPoint.y;

        totalDistance += Math.sqrt((delta_x ** 2) + (delta_y ** 2));

        prevPoint = point_instance;
    })

    return totalDistance
}
