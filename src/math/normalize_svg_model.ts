
import { sampleDataKanji } from "../test-data/sample-kanji.ts";
import type { StrokeComponent } from "../types.ts";
import { extract_svg_path } from "@/helper/extract_svg_path.ts";

import { svgPathProperties } from "svg-path-properties";


const normalize_model = (svg: StrokeComponent[]) => {

    const paths = extract_svg_path(svg)


    
    console.log(paths);


}

normalize_model(sampleDataKanji.stroke_components)


