// Scoring model for Hero mode. Timing is judged in absolute milliseconds (independent of the
// chart's bpm), so the windows below feel the same at any scroll speed.

export type Judgement = "perfect" | "good" | "miss";

// Half-widths (± ms) around a note's exact time. A press within `perfect` scores Perfect; within
// `good`, Good; anything later — or a note that reaches the hit-line with no press — is a Miss.
export const timingWindows = {
	perfect: 55,
	good: 130,
} as const;

// Coyote time: a forgiveness window that only extends the *late* side of the Good window, so a
// press (or the auto-miss cull) that lands just after a note passed the line still counts as a
// hit. Flip `enabled` off for a stricter, un-forgiving feel. Early presses are never extended —
// coyote time is about catching a note you were a hair too slow on.
export const coyoteTime: {enabled: boolean; extraMs: number} = {
	enabled: true,
	extraMs: 70,
};

// The extra late grace currently in effect (0 when coyote time is disabled).
export const coyoteGraceMs = coyoteTime.enabled ? coyoteTime.extraMs : 0;

// The point value of each judgement, before the combo multiplier.
export const judgementPoints: Record<Judgement, number> = {
	perfect: 100,
	good: 50,
	miss: 0,
};

// How much each judgement counts toward the accuracy percentage (Perfect = full credit).
const accuracyWeights: Record<Judgement, number> = {
	perfect: 1,
	good: 0.5,
	miss: 0,
};

// Classify a press by its signed timing error (ms from the note's exact time; positive = the press
// was late). Returns null when the press is outside every window, so it isn't consumed by the note.
// A late press beyond the Good window still lands as Good while it's within the coyote grace.
export function judgePress(errorMs: number): Judgement | null {
	const absErrorMs = Math.abs(errorMs);
	if (absErrorMs <= timingWindows.perfect) return "perfect";
	if (absErrorMs <= timingWindows.good) return "good";
	if (errorMs > 0 && errorMs <= timingWindows.good + coyoteGraceMs) return "good";
	return null;
}

// Points a judgement earns, given the combo *after* it lands. Longer combos are worth more, capped
// so the multiplier can't run away (matching the feel of the genre).
export function pointsFor(judgement: Judgement, combo: number): number {
	const multiplier = Math.min(1 + Math.floor(combo / 10), 4);
	return judgementPoints[judgement] * multiplier;
}

// Presentation for each judgement, shared by the highway feedback and the summary breakdown.
export const judgementColor: Record<Judgement, string> = {
	perfect: "#41ee4b",
	good: "#61aef6",
	miss: "#f13a39",
};
export const judgementLabel: Record<Judgement, string> = {
	perfect: "Perfect",
	good: "Good",
	miss: "Miss",
};

export type Grade = "S" | "A" | "B" | "C" | "D";

// The letter grade for a run's accuracy (0–1).
export function gradeFor(accuracy: number): Grade {
	if (accuracy >= 0.95) return "S";
	if (accuracy >= 0.85) return "A";
	if (accuracy >= 0.7) return "B";
	if (accuracy >= 0.5) return "C";
	return "D";
}

// A run's accuracy (0–1): the weighted sum of judgements over the total number of notes.
export function accuracyOf(counts: Record<Judgement, number>): number {
	const total = counts.perfect + counts.good + counts.miss;
	if (total === 0) return 0;
	const weighted =
		counts.perfect * accuracyWeights.perfect +
		counts.good * accuracyWeights.good +
		counts.miss * accuracyWeights.miss;
	return weighted / total;
}
