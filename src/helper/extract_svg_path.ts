import { StrokeComponent } from "@/types"

export const extract_svg_path = (svg: StrokeComponent[]) => {
    const strokeStr = svg.map((data, _)=>{

        return data.strokes.map((stroke, _)=> {
            return stroke.path 
        })
    })

    // fatten the stroke to 1 array
    return strokeStr.flat()
} 