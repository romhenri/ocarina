import {Color} from "@/data/song-data";
import clsx from "clsx";
import {HeroBest} from "./best-scores";
import {judgementColor, judgementLabel, Judgement} from "./scoring";
import {HeroResult} from "./use-hero";

const formatScore = (n: number) => n.toLocaleString("en-US");
const formatPercent = (accuracy: number) => `${Math.round(accuracy * 100)}%`;

function Stat({label, value, className}: {label: string; value: string; className?: string}) {
	return (
		<div className={clsx("flex flex-col items-center gap-[3px]", className)}>
			<span className="text-[11px] tracking-wide text-white/55 uppercase">{label}</span>
			<span className="text-[18px] leading-none font-semibold text-white tabular-nums">
				{value}
			</span>
		</div>
	);
}

// The live strip across the top of the highway during a run. The lead-in count-in is shown here
// (a big number) so the player knows when the first note lands.
export function HeroHud({
	songName,
	score,
	accuracy,
	best,
	nowBeat,
}: {
	songName: string;
	score: number;
	accuracy: number;
	best: HeroBest | null;
	nowBeat: number;
}) {
	const countIn = nowBeat < 0 ? Math.ceil(-nowBeat) : null;
	return (
		<div className="relative flex w-full max-w-md items-center justify-between rounded-[14px] bg-black/60 px-[18px] py-[10px]">
			<Stat label="Score" value={formatScore(score)} className="items-start" />
			<div className="flex flex-col items-center gap-[2px]">
				<span className="text-[13px] font-medium text-white/80">{songName}</span>
				{countIn !== null ? (
					<span key={countIn} className="animate-hero-pop text-[16px] font-bold text-white">
						{countIn}
					</span>
				) : (
					<span className="text-[13px] text-white/55 tabular-nums">
						{formatPercent(accuracy)}
					</span>
				)}
			</div>
			<Stat
				label="Best"
				value={best ? formatScore(best.score) : "—"}
				className="items-end"
			/>
		</div>
	);
}

const judgementOrder: readonly Judgement[] = ["perfect", "good", "miss"];

// The end-of-run overlay: grade, final score, accuracy, the judgement breakdown, and replay/back
// controls. `songColor` tints the grade so each song's summary carries its identity.
export function HeroSummary({
	result,
	songName,
	songColor,
	onRestart,
	onBackToPicker,
}: {
	result: HeroResult;
	songName: string;
	songColor: Color;
	onRestart: () => void;
	onBackToPicker: () => void;
}) {
	return (
		<div className="flex w-full max-w-sm flex-col items-center gap-[18px] rounded-[18px] bg-black/75 px-[26px] py-[28px] text-center">
			<span className="text-[13px] tracking-[0.2em] text-white/60 uppercase">{songName}</span>

			{result.isNewBest && <span className="new-record-text text-[20px]">New Record!</span>}

			<div
				className="text-[92px] leading-none font-bold [text-shadow:0_4px_16px_rgba(0,0,0,0.5)]"
				style={{color: songColor}}
			>
				{result.grade}
			</div>

			<div className="flex items-center gap-[28px]">
				<div className="flex flex-col gap-[3px]">
					<span className="text-[11px] tracking-wide text-white/55 uppercase">Score</span>
					<span className="text-[24px] leading-none font-semibold tabular-nums">
						{formatScore(result.score)}
					</span>
				</div>
				<div className="flex flex-col gap-[3px]">
					<span className="text-[11px] tracking-wide text-white/55 uppercase">
						Accuracy
					</span>
					<span className="text-[24px] leading-none font-semibold tabular-nums">
						{formatPercent(result.accuracy)}
					</span>
				</div>
				<div className="flex flex-col gap-[3px]">
					<span className="text-[11px] tracking-wide text-white/55 uppercase">
						Max Combo
					</span>
					<span className="text-[24px] leading-none font-semibold tabular-nums">
						{result.maxCombo}
					</span>
				</div>
			</div>

			<div className="flex w-full flex-col gap-[6px]">
				{judgementOrder.map((j) => (
					<div key={j} className="flex items-center justify-between text-[15px]">
						<span style={{color: judgementColor[j]}}>{judgementLabel[j]}</span>
						<span className="tabular-nums text-white/85">{result.counts[j]}</span>
					</div>
				))}
			</div>

			<div className="mt-[4px] flex gap-[12px]">
				<button
					onClick={onRestart}
					className="rounded-full bg-white/90 px-[20px] py-[9px] text-[15px] font-medium text-black transition hover:bg-white"
				>
					Play again
				</button>
				<button
					onClick={onBackToPicker}
					className="rounded-full bg-white/15 px-[20px] py-[9px] text-[15px] font-medium text-white transition hover:bg-white/25"
				>
					Change song
				</button>
			</div>

			<span className="text-[12px] text-white/45">
				Best: {formatScore(result.best.score)} · {formatPercent(result.best.accuracy)}
			</span>
		</div>
	);
}
