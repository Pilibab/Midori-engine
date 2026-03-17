export interface Point {
    x: number;
    y: number;
    timestamp?: number; // Optional: used for speed-based stroke thinning
    pressure?: number;  // Optional: for Apple Pencil/Wacom support
}

export interface Stroke {
    index: number
    path: string
    type: string
}

export interface StrokeComponent {
    element: string | null
    position: string | null
    radical: string | null
    original: string | null
    strokes: Stroke[]
}
// points for stroke 
export type StrokePoint = Point[]; 

// group of stroke 
export type ComponentPoint = Point[][]

// group of component
export type KanjiePoint = Point[][][] 

