import {NoteName} from "@/data/song-data";
import {noteMap} from "@/components/songs/note-map";
import clsx from "clsx";
import {judgementColor, judgementLabel, judgePress} from "./scoring";
import {HeroNote, JudgementFlash, lookaheadBeats, trailBeats} from "./use-hero";

// Lanes run left→right in ascending pitch: a=D-low, d=F, r=A, l=B, u=D-high.
const laneOrder: readonly NoteName[] = ["a", "d", "r", "l", "u"];

// The hit-line's vertical position (percent from the top of the highway). Notes fall from the top
// and are struck as they cross it; the target glyphs sit here.
const HIT_LINE = 78;

// A note's vertical position (percent), driven purely by how many beats away it is from `nowBeat`.
// `lookaheadBeats` away → at the very top (0%); on the line → HIT_LINE; past it → below, until culled.
function notePercent(beat: number, nowBeat: number): number {
	const distance = beat - nowBeat;
	return HIT_LINE * (1 - distance / lookaheadBeats);
}

const glyphClass = "w-[clamp(30px,9vw,52px)] h-auto pointer-events-none";

export default function HeroHighway({
	notes,
	nowBeat,
	beatMs,
	combo,
	lastFlash,
}: {
	notes: HeroNote[];
	nowBeat: number;
	beatMs: number;
	combo: number;
	lastFlash: JudgementFlash | null;
}) {
	return (
		<div className="relative mx-auto h-full w-full max-w-md">
			{/* Lane backdrops + falling notes. */}
			<div className="absolute inset-0 flex">
				{laneOrder.map((lane) => {
					const {Image} = noteMap[lane];
					return (
						<div
							key={lane}
							className="relative flex-1 border-x border-white/5 bg-white/[0.02]"
						>
							{/* Dim target sitting on the hit-line. */}
							<Image
								className={clsx(glyphClass, "absolute left-1/2 opacity-25")}
								style={{
									top: `${HIT_LINE}%`,
									transform: "translate(-50%, -50%)",
								}}
							/>
							{notes
								.filter((n) => {
									if (n.note !== lane) return false;
									// A struck note is collected at the line; a miss keeps falling, faded.
									if (n.judged === "perfect" || n.judged === "good") return false;
									const distance = n.beat - nowBeat;
									return distance <= lookaheadBeats && distance >= -trailBeats;
								})
								.map((n) => {
									// A note is pressable exactly when a press *right now* would judge as a
									// hit — reuse `judgePress` so the orange ring tracks the real timing
									// window (including coyote grace). The signed error of a press now is
									// how many ms `nowBeat` is past the note's beat.
									const pressable =
										n.judged === null &&
										judgePress((nowBeat - n.beat) * beatMs) !== null;
									return (
										<span
											key={n.id}
											className={clsx(
												"absolute left-1/2 inline-flex rounded-full transition-[box-shadow,transform] duration-75",
												pressable &&
													"shadow-[0_0_0_3px_#ff8a00,0_0_10px_2px_rgba(255,138,0,0.65)]"
											)}
											style={{
												top: `${notePercent(n.beat, nowBeat)}%`,
												// Pop to 1.2× while the note is on beat-time (pressable).
												transform: `translate(-50%, -50%) scale(${pressable ? 1.2 : 1})`,
											}}
										>
											<Image
												className={clsx(
													glyphClass,
													"[filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.5))]",
													n.judged === "miss" && "opacity-30 grayscale"
												)}
											/>
										</span>
									);
								})}
						</div>
					);
				})}
			</div>

			{/* The hit-line itself, spanning all lanes. */}
			<div
				className="absolute right-0 left-0 h-[3px] bg-white/60 shadow-[0_0_12px_2px_rgba(255,255,255,0.35)]"
				style={{top: `${HIT_LINE}%`, transform: "translateY(-50%)"}}
			/>

			{/* Combo counter, above the hit-line. */}
			{combo >= 2 && (
				<div
					className="absolute left-1/2 -translate-x-1/2 text-center"
					style={{top: `${HIT_LINE - 22}%`}}
				>
					<div className="text-[13px] tracking-wide text-white/60 uppercase">Combo</div>
					<div className="text-[34px] leading-none font-bold text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.6)]">
						{combo}
					</div>
				</div>
			)}

			{/* Judgement flash, replayed on each new judgement via the changing key. */}
			{lastFlash && (
				<div
					key={lastFlash.key}
					className="absolute left-1/2 animate-hero-pop text-[26px] font-bold [text-shadow:0_2px_6px_rgba(0,0,0,0.7)]"
					style={{
						top: `${HIT_LINE - 10}%`,
						color: judgementColor[lastFlash.judgement],
					}}
				>
					{judgementLabel[lastFlash.judgement]}
				</div>
			)}
		</div>
	);
}
