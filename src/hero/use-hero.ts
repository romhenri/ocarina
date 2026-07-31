import {NoteName, SongId} from "@/data/song-data";
import {useCallback, useEffect, useRef, useState} from "react";
import {hasChart, heroCharts} from "./chart-data";
import {HeroBest, loadBestScore, saveBestScore} from "./best-scores";
import {
	accuracyOf,
	coyoteGraceMs,
	Grade,
	gradeFor,
	Judgement,
	judgePress,
	pointsFor,
	timingWindows,
} from "./scoring";

// How far ahead of the hit-line (in beats) a note first appears, and how far past it a missed note
// keeps falling before it's culled. These only affect the highway visuals, not timing.
export const lookaheadBeats = 4;
export const trailBeats = 1;
// Beats of silence after the last note before the run is declared finished (lets the final note's
// judgement register and breathe before the summary appears).
const endGraceBeats = 2;

// A chart note plus its live judged state, as rendered on the highway. `id` is the note's index in
// the chart (stable per run); `timeMs` is its exact hit time from the run start (including lead-in).
export type HeroNote = {
	id: number;
	note: NoteName;
	beat: number;
	timeMs: number;
	judged: Judgement | null;
};

// The most recent judgement, with a monotonically increasing `key` so the UI can re-trigger its
// pop animation even when the same judgement lands twice in a row.
export type JudgementFlash = {judgement: Judgement; key: number};

export type HeroResult = {
	score: number;
	accuracy: number;
	grade: Grade;
	maxCombo: number;
	counts: Record<Judgement, number>;
	best: HeroBest;
	isNewBest: boolean;
};

export type HeroPhase = "picking" | "playing" | "finished";

export type Hero = {
	phase: HeroPhase;
	selectedSongId: SongId | null;
	/** The current playhead in beats; negative during the lead-in count-in. */
	nowBeat: number;
	/** Milliseconds per beat for the active chart, so consumers can turn a beat distance into a
	 * timing error (e.g. to tell whether a note is currently within its hittable window). */
	beatMs: number;
	notes: HeroNote[];
	score: number;
	combo: number;
	maxCombo: number;
	counts: Record<Judgement, number>;
	/** Live accuracy (0–1) so far this run. */
	accuracy: number;
	lastFlash: JudgementFlash | null;
	/** Best stored score for the selected song, loaded when the song is picked. */
	best: HeroBest | null;
	/** Populated once the run finishes. */
	result: HeroResult | null;
	selectSong: (songId: SongId) => void;
	/** Register a note press for hit-detection. Returns the judgement, or null for a stray press. */
	pressNote: (note: NoteName) => Judgement | null;
	restart: () => void;
	backToPicker: () => void;
};

const zeroCounts = (): Record<Judgement, number> => ({perfect: 0, good: 0, miss: 0});

/**
 * Owns a Hero-mode run: the beat clock, hit-detection, scoring/combo, and the end-of-run grade.
 * Modeled on {@link useSpeedrun} — all run state lives here so the components stay declarative.
 *
 * Timing is authoritative in refs (mutated synchronously by `pressNote` and the rAF auto-miss
 * sweep) and mirrored into React state for rendering, so a press is judged the instant it happens
 * without waiting for a re-render — the same split the ocarina engine uses for its note buffer.
 */
export function useHero(): Hero {
	const [phase, setPhase] = useState<HeroPhase>("picking");
	const [selectedSongId, setSelectedSongId] = useState<SongId | null>(null);
	const [nowBeat, setNowBeat] = useState(0);
	const [notes, setNotes] = useState<HeroNote[]>([]);
	const [score, setScore] = useState(0);
	const [combo, setCombo] = useState(0);
	const [maxCombo, setMaxCombo] = useState(0);
	const [counts, setCounts] = useState<Record<Judgement, number>>(zeroCounts);
	const [lastFlash, setLastFlash] = useState<JudgementFlash | null>(null);
	const [best, setBest] = useState<HeroBest | null>(null);
	const [result, setResult] = useState<HeroResult | null>(null);

	// Authoritative run state. `notes` above mirrors `notesRef` for rendering; the scalars mirror
	// their refs. `phaseRef` lets `pressNote`/the rAF loop read the current phase without stale
	// closures. `beatMsRef`/`lastBeatRef` describe the active chart's timing.
	const notesRef = useRef<HeroNote[]>([]);
	const phaseRef = useRef<HeroPhase>("picking");
	// The picked song, mirrored into a ref so `finish` (called from the rAF loop) reads the live id.
	const selectedSongIdRef = useRef<SongId | null>(null);
	const startTimeRef = useRef(0);
	const beatMsRef = useRef(500);
	const leadInBeatsRef = useRef(0);
	const lastBeatRef = useRef(0);
	const scoreRef = useRef(0);
	const comboRef = useRef(0);
	const maxComboRef = useRef(0);
	const countsRef = useRef<Record<Judgement, number>>(zeroCounts());
	const prevBestRef = useRef<HeroBest | null>(null);
	const flashKeyRef = useRef(0);
	const rafRef = useRef<number | null>(null);

	const setPhaseBoth = useCallback((next: HeroPhase) => {
		phaseRef.current = next;
		setPhase(next);
	}, []);

	const stopLoop = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
	}, []);

	// Push the current judgement (and derived score/combo/counts) from refs into render state.
	const syncScore = useCallback((flash?: Judgement) => {
		setScore(scoreRef.current);
		setCombo(comboRef.current);
		setMaxCombo(maxComboRef.current);
		setCounts({...countsRef.current});
		setNotes([...notesRef.current]);
		if (flash) setLastFlash({judgement: flash, key: ++flashKeyRef.current});
	}, []);

	const finish = useCallback(() => {
		stopLoop();
		const songId = selectedSongIdRef.current;
		if (songId === null) return;
		const accuracy = accuracyOf(countsRef.current);
		const grade = gradeFor(accuracy);
		const stored = saveBestScore(songId, {
			score: scoreRef.current,
			accuracy,
		});
		const isNewBest =
			prevBestRef.current === null || scoreRef.current > prevBestRef.current.score;
		setBest(stored);
		setResult({
			score: scoreRef.current,
			accuracy,
			grade,
			maxCombo: maxComboRef.current,
			counts: {...countsRef.current},
			best: stored,
			isNewBest,
		});
		setPhaseBoth("finished");
	}, [stopLoop, setPhaseBoth]);

	const tick = useCallback(() => {
		const elapsedMs = performance.now() - startTimeRef.current;
		setNowBeat(elapsedMs / beatMsRef.current - leadInBeatsRef.current);

		// Auto-miss: any unjudged note whose Good window (plus the coyote grace) has fully passed is
		// a miss (breaks combo). The grace keeps a just-late note catchable a beat longer.
		let missed = false;
		for (const note of notesRef.current) {
			if (
				note.judged === null &&
				note.timeMs < elapsedMs - timingWindows.good - coyoteGraceMs
			) {
				note.judged = "miss";
				countsRef.current.miss++;
				comboRef.current = 0;
				missed = true;
			}
		}
		if (missed) syncScore("miss");

		const allJudged = notesRef.current.every((n) => n.judged !== null);
		const pastEnd = elapsedMs / beatMsRef.current - leadInBeatsRef.current >
			lastBeatRef.current + endGraceBeats;
		if (allJudged || pastEnd) {
			finish();
			return;
		}
		rafRef.current = requestAnimationFrame(tick);
	}, [syncScore, finish]);

	const startRun = useCallback(
		(songId: SongId) => {
			const chart = heroCharts[songId];
			if (!chart) return;

			stopLoop();
			beatMsRef.current = 60000 / chart.bpm;
			leadInBeatsRef.current = chart.leadInBeats;
			lastBeatRef.current = chart.notes.reduce((m, n) => Math.max(m, n.beat), 0);
			notesRef.current = chart.notes.map((n, i) => ({
				id: i,
				note: n.note,
				beat: n.beat,
				timeMs: (n.beat + chart.leadInBeats) * beatMsRef.current,
				judged: null,
			}));
			scoreRef.current = 0;
			comboRef.current = 0;
			maxComboRef.current = 0;
			countsRef.current = zeroCounts();

			const stored = loadBestScore(songId);
			prevBestRef.current = stored;
			selectedSongIdRef.current = songId;
			setBest(stored);
			setResult(null);
			setSelectedSongId(songId);
			setScore(0);
			setCombo(0);
			setMaxCombo(0);
			setCounts(zeroCounts());
			setLastFlash(null);
			setNotes([...notesRef.current]);
			setNowBeat(-chart.leadInBeats);

			startTimeRef.current = performance.now();
			setPhaseBoth("playing");
			rafRef.current = requestAnimationFrame(tick);
		},
		[stopLoop, setPhaseBoth, tick]
	);

	const selectSong = useCallback(
		(songId: SongId) => {
			if (hasChart(songId)) startRun(songId);
		},
		[startRun]
	);

	const restart = useCallback(() => {
		if (selectedSongIdRef.current) startRun(selectedSongIdRef.current);
	}, [startRun]);

	const backToPicker = useCallback(() => {
		stopLoop();
		setPhaseBoth("picking");
		setResult(null);
	}, [stopLoop, setPhaseBoth]);

	const pressNote = useCallback(
		(note: NoteName): Judgement | null => {
			if (phaseRef.current !== "playing") return null;
			const elapsedMs = performance.now() - startTimeRef.current;

			// The nearest unjudged note of this button whose timing lands within the Good window.
			let nearest: HeroNote | null = null;
			let nearestErr = Infinity;
			for (const candidate of notesRef.current) {
				if (candidate.judged !== null || candidate.note !== note) continue;
				const absErr = Math.abs(candidate.timeMs - elapsedMs);
				if (absErr < nearestErr) {
					nearestErr = absErr;
					nearest = candidate;
				}
			}
			if (nearest === null) return null;
			// Signed error: positive means the press was late, which is the side coyote time forgives.
			const judgement = judgePress(elapsedMs - nearest.timeMs);
			// A press with no note in range (or one too early/late) is a harmless stray — no penalty,
			// no combo break — so the player can still freely sound the instrument.
			if (judgement === null) return null;

			nearest.judged = judgement;
			comboRef.current += 1;
			maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
			scoreRef.current += pointsFor(judgement, comboRef.current);
			countsRef.current[judgement]++;
			syncScore(judgement);
			return judgement;
		},
		[syncScore]
	);

	// Live accuracy for the HUD (0–1 over notes resolved so far).
	const liveAccuracy = accuracyOf(counts);

	// Cancel the loop if the component unmounts mid-run (e.g. the mode is switched away).
	useEffect(() => stopLoop, [stopLoop]);

	return {
		phase,
		selectedSongId,
		nowBeat,
		beatMs: beatMsRef.current,
		notes,
		score,
		combo,
		maxCombo,
		counts,
		accuracy: liveAccuracy,
		lastFlash,
		best,
		result,
		selectSong,
		pressNote,
		restart,
		backToPicker,
	};
}
