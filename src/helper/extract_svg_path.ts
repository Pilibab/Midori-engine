import { sampleDataKanji } from "../test-data/sample-kanji.ts"
import type { StrokeComponent } from "../types.ts"

export const extract_svg_path = (svg: StrokeComponent[]) => {
    // returns an array of svg path
    // e.g [['M14,24...], ['M55.77,23.08c1.07,...]]
    return svg.map((data, _)=>{

        return data.strokes.map((stroke, _)=> {
            return stroke.path 
        })
    })
} 