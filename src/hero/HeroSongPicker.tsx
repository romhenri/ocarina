import {SongId, songs} from "@/data/song-data";
import {noteMap} from "@/components/songs/note-map";
import clsx from "clsx";
import {loadBestScore} from "./best-scores";
import {hasChart} from "./chart-data";

// Every song, charted-first so the playable ones sit at the top of the list.
const songEntries = (Object.keys(songs) as SongId[]).sort((a, b) => {
	const byChart = Number(hasChart(b)) - Number(hasChart(a));
	return byChart !== 0 ? byChart : 0;
});

function NotePreview({songId}: {songId: SongId}) {
	return (
		<div className="flex items-center gap-[4px]">
			{songs[songId].notes.map((note, i) => {
				const {Image} = noteMap[note];
				return <Image key={i} className="h-[16px] w-auto opacity-90" />;
			})}
		</div>
	);
}

export default function HeroSongPicker({onSelect}: {onSelect: (songId: SongId) => void}) {
	return (
		<div className="flex h-full w-full max-w-md flex-col items-center gap-[16px] px-[16px] pt-[8px]">
			<div className="text-center">
				<h2 className="text-[22px] font-semibold text-white">Hero Mode</h2>
				<p className="mt-[4px] text-[13px] text-white/60">
					Hit the notes in time to perform the song. Pick a track:
				</p>
			</div>

			<div className="flex w-full flex-col gap-[8px] overflow-y-auto pb-[16px]">
				{songEntries.map((songId) => {
					const song = songs[songId];
					const playable = hasChart(songId);
					const best = playable ? loadBestScore(songId) : null;
					return (
						<button
							key={songId}
							disabled={!playable}
							onClick={() => playable && onSelect(songId)}
							className={clsx(
								"flex w-full! items-center justify-between rounded-[12px] px-[16px] py-[12px] text-left transition",
								playable
									? "cursor-pointer bg-black/55 hover:scale-[1.02] hover:bg-black/75"
									: "cursor-default! bg-black/30 opacity-55"
							)}
						>
							<div className="flex flex-col gap-[7px]">
								<span
									className="text-[16px] font-medium"
									style={{color: playable ? song.color : "#cccccc"}}
								>
									{song.name}
								</span>
								<NotePreview songId={songId} />
							</div>
							<div className="flex flex-col items-end gap-[3px] text-right">
								{playable ? (
									best ? (
										<>
											<span className="text-[11px] tracking-wide text-white/45 uppercase">
												Best
											</span>
											<span className="text-[15px] font-semibold tabular-nums text-white">
												{best.score.toLocaleString("en-US")}
											</span>
										</>
									) : (
										<span className="text-[12px] text-white/45">Play ▸</span>
									)
								) : (
									<span className="rounded-full bg-white/10 px-[10px] py-[3px] text-[11px] text-white/60">
										Coming soon
									</span>
								)}
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
