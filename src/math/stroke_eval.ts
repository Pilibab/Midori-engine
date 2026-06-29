// src/math/scoring_engine.ts
import { LiveEvaluationResult, Point, StrokePoint, StrokeTelemetry } from "@/types";

export const createInitialTelemetry = (): StrokeTelemetry => ({
    totalFramesTracked: 0,
    greenFrames: 0,
    yellowFrames: 0,
    redFrames: 0,
    maxIndexReached: 0,
    directionViolations: 0,
    startedCorrectly: true,
});

/**
 * Aggregates a live frame's evaluation data into the tracking bucket.
 */
export const updateTelemetry = (
    currentTelemetry: StrokeTelemetry,
    evaluation: { color: string; closestIndex: number; error: string | null },

): StrokeTelemetry => {


    const updated = { ...currentTelemetry };
    
    updated.totalFramesTracked += 1;
    
    // Track furthest point reached along the timeline
    if (evaluation.closestIndex > updated.maxIndexReached) {
        updated.maxIndexReached = evaluation.closestIndex;
    }

    // Process positional and tracking errors
    if (evaluation.error === "WRONG_START" && updated.totalFramesTracked <= 3) {
        updated.startedCorrectly = false;
        updated.redFrames += 1;
        return updated;
    }

    if (evaluation.error === "BACKWARDS") {
        updated.directionViolations += 1;
        updated.redFrames += 1;
        return updated;
    }

    // Process proximity colors
    if (evaluation.color === "green") updated.greenFrames += 1;
    else if (evaluation.color === "yellow") updated.yellowFrames += 1;
    else updated.redFrames += 1;

    return updated;
};

/**
 * Calculates the final macro score (0-100) when the user lifts their pen.
 */
export const calculateFinalStrokeScore = (
    telemetry: StrokeTelemetry,
    templateStroke: StrokePoint
): { finalScore: number; passing: boolean; feedback: string } => {
    if (telemetry.totalFramesTracked === 0) {
        return { finalScore: 0, passing: false, feedback: "No stroke detected." };
    }

    // 1. Calculate foundational precision score
    const weightedFrames = (telemetry.greenFrames * 1.0) + (telemetry.yellowFrames * 0.5);
    let score = (weightedFrames / telemetry.totalFramesTracked) * 100;

    // 2. Evaluate Completeness (Did they draw the full length of the path timeline?)
    const completionRatio = telemetry.maxIndexReached / (templateStroke.length - 1);
    if (completionRatio < 0.80) {
        return { 
            finalScore: Math.max(0, Math.round(score * completionRatio)), 
            passing: false, 
            feedback: "Stroke was cut too short!" 
        };
    }

    // 3. Apply Penalties
    if (!telemetry.startedCorrectly) {
        score -= 25; // Strict penalty for starting on the wrong side
    }

    // Deduct points for jagged backward strokes / shaky direction changes
    const directionPenalty = telemetry.directionViolations * 4;
    score -= directionPenalty;

    // Clamp absolute final score between 0 and 100
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    
    // Determine pass state (e.g., requiring at least a 70% accuracy)
    const passing = finalScore >= 70;
    
    let feedback = "Excellent control!";
    if (finalScore < 70) feedback = "Watch your alignment and stroke balance.";
    if (!telemetry.startedCorrectly) feedback = "Wrong starting point. Pay attention to the stroke direction indicators.";

    return { finalScore, passing, feedback };
};


/**
 * Evaluates a single live pointer coordinate against an ordered template path.
 * * @param userPoint The live {x, y} coordinate from the pointermove event
 * @param templateStroke The pre-sampled array of ordered points representing the ideal stroke
 * @param maxIndexReached The highest index matched by the user in this stroke session so far
 * @param isFirstFrames True if the stroke just began (used to validate the start position)
 */
export const evaluateLivePoint = (
    userPoint: Point,
    templateStroke: Point[],        
    maxIndexReached: number,        // previous index
    isFirstFrames: boolean, 
    forwardTolerance: number = 25, 
    backwardTolerance: number = 5
): LiveEvaluationResult => {
    let minDistance = Infinity;
    let closestIndex = 0;
    const modelSize = templateStroke.length;

    // set bounds 
    let min = (maxIndexReached <= backwardTolerance) ? 0 : maxIndexReached - backwardTolerance;
    let max = (maxIndexReached >= modelSize - forwardTolerance) ? modelSize: maxIndexReached + forwardTolerance;  
    // Scan the template timeline to find the point closest to the user's cursor
    for (let i = min; i < max; i++) {
        const templatePoint = templateStroke[i];
        // Compute standard Euclidean distance: d = sqrt((x2-x1)^2 + (y2-y1)^2)
        const dx = userPoint.x - templatePoint.x;
        const dy = userPoint.y - templatePoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
        }
    }

    const HARD_RED = "rgba(255, 0, 0, 1)";

    if (isFirstFrames && closestIndex > 12) {
        console.log("WRONG_START");
        return { color: HARD_RED, closestIndex, error: "WRONG_START" };
    }

    if (closestIndex < maxIndexReached - 10) {
        console.log("BACKWARDS");
        return { color: HARD_RED, closestIndex, error: "BACKWARDS" };
    }

    // --- PHASE 3: DYNAMIC EXPONENTIAL GRADIENT ---
    const MAX_TOLERANCE = 36; // Beyond 36px is pure red
    
    // 1. Normalize the distance into a 0.0 to 1.0 ratio
    const linearRatio = Math.min(minDistance / MAX_TOLERANCE, 1.0);
    
    // 2. Apply an exponential power curve (Exponent > 1 creates a forgiveness cushion)
    const exponentialRatio = Math.pow(linearRatio, 1.5); 

    // 3. Map to Hue spectrum (120 down to 0)
    const hue = Math.round(120 * (1 - exponentialRatio));
    const dynamicColor = `hsla(${hue}, 100%, 45%, 1)`;

    return {
        color: dynamicColor,
        closestIndex,
        error: null
    };
};