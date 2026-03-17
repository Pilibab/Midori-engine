import type { pointsVal, StrokeComponent } from "../types.ts";
import { extract_svg_path } from "../helper/extract_svg_path.ts";

import { svgPathProperties } from "svg-path-properties";
import { sampleDataKanji } from "../test-data/sample-kanji.ts";


export const normalize_model = (svg: StrokeComponent[], numPoints: number = 100) => {
    // numPoints tells us how many points are we going to use for each stroke in a kanji
    // the higher the number the more accurate
    // think of using points to graph something
    const paths = extract_svg_path(svg);

    // ? why does using flatMap here causes an error SyntaxError: Expression expected after the for loop in the inner map? 
    return paths.map((component) => (
        // switch to flatmap since 
        component.flatMap((path) => {
        // extracts the stroke
        const svgAtt = new svgPathProperties(path);
        const points: pointsVal[] = [];
        const totalLength = svgAtt.getTotalLength();
        
        // extract points for current stroke 
        for (let i = 0; i < numPoints; i++) {
            const frac = i / numPoints;

            const point = svgAtt.getPointAtLength(frac * totalLength);
        
            // append point
            points.push({
                x: Math.round(point.x * 100) / 100, // Round for clean data
                y: Math.round(point.y * 100) / 100
            });
        }
        return points;
        })
    ));
}

