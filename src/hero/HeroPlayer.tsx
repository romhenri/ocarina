import MobileControls from "@/components/songs/MobileControls";
import {Instrument} from "@/data/instrument-data";
import {NoteName, songs} from "@/data/song-data";
import {keybindsToNotes, normalizeKey, NoteKeybindId, SettingValues} from "@/settings/setting-fields";
import {AudioBuffers, AudioSystem, fadeOutSource, playSound} from "@/util/audio";
import {useCallback, useEffect, useMemo} from "react";
import HeroHighway from "./HeroHighway";
import {HeroHud, HeroSummary} from "./HeroHud";
import HeroSongPicker from "./HeroSongPicker";
import {useHero} from "./use-hero";

// A struck note rings out over this long by default (looping instruments would otherwise sustain
// forever). Plucked instruments that already ring out (guitar) keep their own decay.
const defaultHitFade = 0.9;

const noop = () => {};

/**
 * Hero (rhythm-game) mode. Owns keyboard/touch input, sounds each hit on the current instrument
 * (the player performs the melody — there's no backing track), and drives {@link useHero}, whose
 * phase selects the picker, the falling-note highway, or the end-of-run summary.
 */
export default function HeroPlayer({
	settings,
	instrument,
	isTouch,
	isInputEnabled,
	audioSystem,
	audioBuffers,
}: {
	settings: SettingValues;
	instrument: Instrument;
	isTouch: boolean;
	isInputEnabled: boolean;
	audioSystem: AudioSystem;
	audioBuffers: React.RefObject<AudioBuffers>;
}) {
	const hero = useHero();
	const {phase, pressNote} = hero;

	// Sound a note on the current instrument, decaying so quick taps don't pile up (mirrors the
	// note-playing call in `use-ocarina-playback.ts`, without the sustain/bend lifecycle).
	const soundNote = useCallback(
		(note: NoteName) => {
			const sound = playSound(audioSystem, audioBuffers.current[instrument.bufferId], {
				gain: instrument.gain,
				loop: instrument.loop,
				loopStart: instrument.loopStart,
				loopEnd: instrument.loopEnd,
				detune: instrument.detune[note],
			});
			if (sound) {
				fadeOutSource(
					audioSystem.context,
					sound.source,
					sound.gain,
					instrument.holdFadeDuration ?? defaultHitFade
				);
			}
		},
		[audioSystem, audioBuffers, instrument]
	);

	// Every input path: sound the note and feed hit-detection (only while a run is playing).
	const handlePress = useCallback(
		(note: NoteName) => {
			if (phase !== "playing") return;
			soundNote(note);
			pressNote(note);
		},
		[phase, soundNote, pressNote]
	);

	const keyToNote = useMemo(() => {
		const map = new Map<string, NoteName>();
		(Object.entries(keybindsToNotes) as [NoteKeybindId, NoteName][]).forEach(([id, note]) => {
			map.set(settings[id], note);
		});
		return map;
	}, [settings]);

	useEffect(() => {
		if (!isInputEnabled) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.repeat) return;
			const note = keyToNote.get(normalizeKey(event.key));
			if (!note || phase !== "playing") return;
			// The note keys default to the arrows; suppress their scrolling while we own them as input.
			event.preventDefault();
			handlePress(note);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isInputEnabled, keyToNote, phase, handlePress]);

	if (phase === "picking") {
		return (
			<div className="fixed top-0 left-0 flex h-[100dvh] w-full flex-col items-center justify-center pt-[56px] select-none">
				<HeroSongPicker onSelect={hero.selectSong} />
			</div>
		);
	}

	const song = hero.selectedSongId ? songs[hero.selectedSongId] : null;

	if (phase === "finished" && hero.result && song) {
		return (
			<div className="fixed top-0 left-0 flex h-[100dvh] w-full flex-col items-center justify-center px-[16px] select-none">
				<HeroSummary
					result={hero.result}
					songName={song.name}
					songColor={song.color}
					onRestart={hero.restart}
					onBackToPicker={hero.backToPicker}
				/>
			</div>
		);
	}

	// Playing.
	return (
		<div className="fixed top-0 left-0 flex h-[100dvh] w-full flex-col items-center gap-[10px] px-[10px] pt-[56px] pb-[10px] select-none">
			<HeroHud
				songName={song?.name ?? ""}
				score={hero.score}
				accuracy={hero.accuracy}
				best={hero.best}
				nowBeat={hero.nowBeat}
			/>
			<div className="min-h-0 w-full flex-1">
				<HeroHighway
					notes={hero.notes}
					nowBeat={hero.nowBeat}
					beatMs={hero.beatMs}
					combo={hero.combo}
					lastFlash={hero.lastFlash}
				/>
			</div>
			{isTouch && <MobileControls inputPress={handlePress} inputRelease={noop} />}
		</div>
	);
}
