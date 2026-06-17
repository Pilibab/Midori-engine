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
    evaluation: { color: "green" | "yellow" | "red"; closestIndex: number; error: string | null }
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
    maxIndexReached: number,
    isFirstFrames: boolean
): LiveEvaluationResult => {
    let minDistance = Infinity;
    let closestIndex = 0;

    // --- PHASE 1: EUCLIDEAN PROXIMITY SEARCH ---
    // Scan the template timeline to find the point closest to the user's cursor
    for (let i = 0; i < templateStroke.length; i++) {
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

    // --- PHASE 2: POSITION AND DIRECTION GATEKEEPING ---

    // Rule A: Wrong Start Position
    // If it's one of the first few frames, the cursor must be near the beginning of the timeline (index 0).
    // If they touch down further along the line (e.g., past index 12), flag an error.
    const START_INDEX_THRESHOLD = 12; 
    if (isFirstFrames && closestIndex > START_INDEX_THRESHOLD) {
        return {
            color: "red",
            closestIndex,
            error: "WRONG_START"
        };
    }

    // Rule B: Directional Timeline Validation (The Key to Overcoming the Field Defect)
    // Hand-shaking and micro-jitters are normal, so we allow a padding threshold (e.g., 10 points).
    // But if their closest matched index falls significantly behind their historical maximum,
    // they are physically drawing the stroke in reverse.
    const BACKWARDS_PADDING = 10;
    if (closestIndex < maxIndexReached - BACKWARDS_PADDING) {
        return {
            color: "red",
            closestIndex,
            error: "BACKWARDS"
        };
    }

    // --- PHASE 3: DYNAMIC COLOR DISTANCE THRESHOLDS ---
    // Establish absolute tracking tolerances in pixels
    const GREEN_TOLERANCE = 16;  // Within 16px: Highly accurate tracking
    const YELLOW_TOLERANCE = 36; // Within 36px: Out of balance, needs adjustment

    let color: "green" | "yellow" | "red" = "green";

    if (minDistance <= GREEN_TOLERANCE) {
        color = "green";
    } else if (minDistance <= YELLOW_TOLERANCE) {
        color = "yellow";
    } else {
        color = "red"; // Way off track
    }

    return {
        color,
        closestIndex,
        error: null
    };
};