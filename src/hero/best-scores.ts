import {SongId} from "@/data/song-data";
import {loadJson, saveJson} from "@/settings/storage";

const BEST_SCORE_KEY = "heroBestScores";

export type HeroBest = {score: number; accuracy: number};
type BestScores = Partial<Record<SongId, HeroBest>>;

function loadBestScores(): BestScores {
	return loadJson<BestScores>(BEST_SCORE_KEY, {});
}

export function loadBestScore(songId: SongId): HeroBest | null {
	return loadBestScores()[songId] ?? null;
}

// Persists `result` as the song's best only if its score beats the stored one, returning the
// resulting best. Mirrors the speedrun best-time helper (see `src/speedrun/best-times.ts`).
export function saveBestScore(songId: SongId, result: HeroBest): HeroBest {
	const scores = loadBestScores();
	const previous = scores[songId];
	if (previous === undefined || result.score > previous.score) {
		scores[songId] = result;
		saveJson(BEST_SCORE_KEY, scores);
		return result;
	}
	return previous;
}
