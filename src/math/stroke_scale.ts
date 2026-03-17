import type { pointsVal } from "../types.ts";


// 
const stroke_scale = (first_stroke: pointsVal[], model_stroke:  pointsVal[]) => {

    const model_first_stroke = model_stroke[0];

} 

const calculate_scale = () => {
    // $$S_{final} = (w \cdot S_{user}) + ((1 - w) \cdot S_{canvas})$$

}

const ratio = (x: number, y: number) => {
    // note that the L_svg and L_user is only for the first stroke 
    return x / y;
}

const calculate_Distance = (stroke:  pointsVal[]) => {
    let totalDistance = 0.0;
    let prevPoint: pointsVal | null =  null;
    let stroke_component: pointsVal[] | null  = null;

    // check if array is multi dimentional 
    if (stroke && stroke.length > 0 && Array.isArray(stroke[0])) {
        // if true we flatten because we are getting the entire distance of the component
        // summation ( l_component_1, l_component_2, l_component_3, ..., l_component_n )
        stroke_component = stroke.flat();
    } else {
        stroke_component = stroke;
    }

    stroke_component.forEach((point_instance) => {

        const{ x: current_x, y: current_y}= point_instance; 
        // if prev is null means first point 
        // set it as (0,0)
        if  (prevPoint === null) {
            prevPoint = {
                x: 0, y: 0 
            }
        }   else {
            prevPoint = point_instance;
        }

        const delta_x = current_x - prevPoint.x;
        const delta_y = current_y - prevPoint.y;

        totalDistance += (delta_x ** 2) + (delta_y ** 2);
    })

    return totalDistance
}
