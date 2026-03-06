export interface Point {
    x: number;
    y: number;
    timestamp?: number; // Optional: used for speed-based stroke thinning
    pressure?: number;  // Optional: for Apple Pencil/Wacom support
}
