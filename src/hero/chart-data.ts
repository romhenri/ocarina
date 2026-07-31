import {NoteName, SongId} from "@/data/song-data";

// A single charted note: which ocarina button to press, and *when* — `beat` is its position in
// quarter-note beats from the start of the chart (beat 0 is the first playable beat). Fractional
// beats place eighth notes (x.5) and finer subdivisions.
export type ChartNote = {readonly note: NoteName; readonly beat: number};

export type HeroChart = {
	readonly songId: SongId;
	/** Quarter-note beats per minute — sets both the scroll speed and the beat→time conversion. */
	readonly bpm: number;
	/** Silent count-in (in beats) before the first note reaches the hit-line, so the player can ready. */
	readonly leadInBeats: number;
	/** Notes in ascending `beat` order. */
	readonly notes: readonly ChartNote[];
};

// Saria's Song (a.k.a. the Lost Woods theme). Built from its in-game phrase C-down, C-right, C-left
// = F, A, B (`d, r, l`), stated straight, then repeated with a rising tail and tightened into
// eighth-note runs toward the end so the performance builds in intensity. Every note stays within
// the ocarina's 5-button palette (a=D-low, d=F, r=A, l=B, u=D-high).
const sariasSong: HeroChart = {
	songId: "sarias-song",
	bpm: 120,
	leadInBeats: 4,
	notes: [
		// The F–A–B hook, stated twice (quarter notes).
		{beat: 0, note: "d"},
		{beat: 1, note: "r"},
		{beat: 2, note: "l"},
		{beat: 4, note: "d"},
		{beat: 5, note: "r"},
		{beat: 6, note: "l"},
		// Hook again, this time rising up to the high D.
		{beat: 8, note: "d"},
		{beat: 9, note: "r"},
		{beat: 10, note: "l"},
		{beat: 11, note: "u"},
		// Descend B–A–F and settle on the low D.
		{beat: 12, note: "l"},
		{beat: 13, note: "r"},
		{beat: 14, note: "d"},
		{beat: 15, note: "a"},
		// The hook tightened into eighth notes, twice.
		{beat: 16, note: "d"},
		{beat: 16.5, note: "r"},
		{beat: 17, note: "l"},
		{beat: 18, note: "d"},
		{beat: 18.5, note: "r"},
		{beat: 19, note: "l"},
		// A rising-then-falling run.
		{beat: 20, note: "d"},
		{beat: 20.5, note: "r"},
		{beat: 21, note: "l"},
		{beat: 21.5, note: "u"},
		{beat: 22, note: "l"},
		{beat: 22.5, note: "r"},
		{beat: 23, note: "d"},
		// Final flourish: rapid F–A–B twice, landing on the high D.
		{beat: 24, note: "d"},
		{beat: 24.5, note: "r"},
		{beat: 25, note: "l"},
		{beat: 25.5, note: "d"},
		{beat: 26, note: "r"},
		{beat: 26.5, note: "l"},
		{beat: 27, note: "u"},
	],
};

// Only songs with an authored chart are playable in Hero mode; the rest show as "coming soon".
export const heroCharts: Partial<Record<SongId, HeroChart>> = {
	"sarias-song": sariasSong,
};

export function hasChart(id: SongId): boolean {
	return id in heroCharts;
}
