import Background from "@/components/Background";
import InstrumentSwitcher from "@/components/InstrumentSwitcher";
import LoadingScreen from "@/components/LoadingScreen";
import MetaModal from "@/components/meta-modal/MetaModal";
import MobileSwitcherModal from "@/components/MobileSwitcherModal";
import ModeSwitcher from "@/components/ModeSwitcher";
import ScenarioPicker from "@/components/ScenarioPicker";
import SongPlayer from "@/components/songs/SongPlayer";
import {InstrumentId, instruments} from "@/data/instrument-data";
import {getScenario} from "@/data/scenario-data";
import {Song, SongId} from "@/data/song-data";
import HeroPlayer from "@/hero/HeroPlayer";
import {Mode, SpeedrunSet} from "@/modes";
import {SettingValues} from "@/settings/setting-fields";
import {
	markHasPlayed,
	saveInstrument,
	saveMode,
	saveScenario,
	saveSettings,
	saveSpeedrunSet,
} from "@/settings/settings";
import SpeedrunTimer from "@/speedrun/SpeedrunTimer";
import {useSpeedrun} from "@/speedrun/use-speedrun";
import {AudioBuffers, AudioSystem, createAudioSystem, playSound} from "@/util/audio";
import {useIsTouch} from "@/util/use-media-query";
import {useCallback, useEffect, useRef, useState} from "react";

function App({
	initialSettings,
	initialInstrumentId,
	initialMode,
	initialSpeedrunSet,
	initialScenarioId,
	hasPlayedBefore,
}: {
	initialSettings: SettingValues;
	initialInstrumentId: InstrumentId;
	initialMode: Mode;
	initialSpeedrunSet: SpeedrunSet;
	initialScenarioId: string;
	hasPlayedBefore: boolean;
}) {
	const [settings, setSettings] = useState(initialSettings);
	const [isLoadingScreenOpen, setIsLoadingScreenOpen] = useState(true);
	const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
	const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
	const isTouch = useIsTouch();
	// Whether a matched melody is currently playing back (Song mode only). The engine owns the
	// authoritative playing state; this is a derived flag kept here purely to mute the menu
	// open/close sound while a melody plays — so it's a boolean, not a duplicated song id.
	const [isSongPlaying, setIsSongPlaying] = useState(false);
	const [instrumentId, setInstrumentId] = useState<InstrumentId>(initialInstrumentId);
	const [mode, setMode] = useState<Mode>(initialMode);
	const [speedrunSet, setSpeedrunSet] = useState<SpeedrunSet>(initialSpeedrunSet);

	const [scenarioId, setScenarioId] = useState(initialScenarioId);

	const speedrun = useSpeedrun({mode, speedrunSet});
	const {registerSong} = speedrun;

	// Lazily create the single AudioContext on first render (and never on re-renders).
	// The system is immutable once created, so we pass the value (not the ref) downward.
	const audioSystemRef = useRef<AudioSystem | null>(null);
	audioSystemRef.current ??= createAudioSystem();
	const audioSystem = audioSystemRef.current;
	const audioBuffers = useRef<AudioBuffers>({});

	// Persist settings, debounced so dragging the volume slider doesn't hammer localStorage.
	useEffect(() => {
		const timer = setTimeout(() => saveSettings(settings), 200);
		return () => clearTimeout(timer);
	}, [settings]);

	useEffect(() => {
		audioSystem.gain.gain.value = settings.volume;
	}, [settings.volume, audioSystem]);

	useEffect(() => {
		saveInstrument(instrumentId);
	}, [instrumentId]);

	useEffect(() => {
		saveMode(mode);
	}, [mode]);

	useEffect(() => {
		saveScenario(scenarioId);
	}, [scenarioId]);

	useEffect(() => {
		saveSpeedrunSet(speedrunSet);
	}, [speedrunSet]);

	const onSongCorrect = useCallback(
		(songId: SongId, songData: Song) => {
			// The match-confirmation chime, unless the player has toggled it off in settings.
			// Speedrun matches fire rapidly and don't pause for a melody, so it's played quieter
			// to keep it from being grating.
			if (settings.songMatchSound) {
				playSound(audioSystem, audioBuffers.current["song-correct"], {
					gain: mode === "speedrun" ? 0.25 : 0.5,
				});
			}
			// A song using the A note proves the player has found the A control, so we can stop
			// hinting the controls on future visits.
			if (songData.notes.includes("a")) {
				markHasPlayed();
			}
			if (mode === "speedrun") {
				// No "currently playing" highlight in speedrun (the green check is the feedback);
				// just record the song as completed.
				registerSong(songId);
			} else {
				setIsSongPlaying(true);
			}
		},
		[audioSystem, mode, registerSong, settings.songMatchSound]
	);

	const onSongEnd = useCallback(() => {
		setIsSongPlaying(false);
	}, []);

	return (
		<>
			{/* Everything behind the settings modal is made inert while it's open, so the focus trap
			    is backed up against a screen-reader virtual cursor wandering out of the dialog. */}
			<div inert={isMetaModalOpen}>
				<Background
					isParallaxOn={!isTouch && settings.bgMovement}
					src={getScenario(scenarioId).src}
				/>
				<main>
					<h1 className="sr-only">Ocarina Player</h1>
					{mode === "hero" ? (
						<HeroPlayer
							settings={settings}
							instrument={instruments[instrumentId]}
							isTouch={isTouch}
							isInputEnabled={!isLoadingScreenOpen && !isMetaModalOpen}
							audioSystem={audioSystem}
							audioBuffers={audioBuffers}
						/>
					) : (
						<SongPlayer
							isReady={!isLoadingScreenOpen}
							settings={settings}
							instrument={instruments[instrumentId]}
							isTouch={isTouch}
							isInputEnabled={
								!isLoadingScreenOpen && !isMetaModalOpen && !speedrun.isInputLocked
							}
							mode={mode}
							speedrunSet={speedrunSet}
							playedSongIds={speedrun.playedSongIds}
							onNotePress={speedrun.onNotePress}
							runResetSignal={speedrun.runResetSignal}
							onSongCorrect={onSongCorrect}
							onSongEnd={onSongEnd}
							audioSystem={audioSystem}
							audioBuffers={audioBuffers}
							header={
								!isLoadingScreenOpen &&
								mode === "speedrun" && (
									<div className="mt-[12px]">
										<SpeedrunTimer
											{...speedrun.timerProps}
											onReset={speedrun.reset}
											resetKey={settings.keybindSpeedrunReset}
											speedrunSet={speedrunSet}
											onSelectSpeedrunSet={setSpeedrunSet}
											isInputEnabled={!isMetaModalOpen}
										/>
									</div>
								)
							}
						/>
					)}
				</main>
				{!isLoadingScreenOpen && (
					<>
						<div className="contents sm:hidden">
							<MobileSwitcherModal
								isOpen={isSwitcherOpen}
								onOpenChange={setIsSwitcherOpen}
								mode={mode}
								onSelectMode={setMode}
								instrumentId={instrumentId}
								onSelectInstrument={setInstrumentId}
							/>
						</div>
						<nav
							aria-label="Mode and instrument"
							className="fixed top-0 left-0 z-[100] hidden flex-col items-start gap-[4px] p-[12px] pt-[calc(env(safe-area-inset-top)+12px)] pl-[calc(env(safe-area-inset-left)+12px)] select-none sm:flex"
						>
							<div className="flex items-start gap-[6px]">
								<ModeSwitcher mode={mode} onSelectMode={setMode} />
								<ScenarioPicker scenarioId={scenarioId} onSelect={setScenarioId} />
							</div>
							<InstrumentSwitcher
								currentInstrumentId={instrumentId}
								onSelect={setInstrumentId}
							/>
						</nav>
					</>
				)}
			</div>
			<MetaModal
				isOpen={isMetaModalOpen}
				isSwitcherOpen={isSwitcherOpen}
				onOpen={() => {
					setIsMetaModalOpen(true);
					if (!isSongPlaying) {
						playSound(audioSystem, audioBuffers.current["menu-open"]);
					}
				}}
				onClose={() => {
					setIsMetaModalOpen(false);
					if (!isSongPlaying) {
						playSound(audioSystem, audioBuffers.current["menu-close"]);
					}
				}}
				settings={settings}
				setSettings={setSettings}
				isTouch={isTouch}
			/>
			<LoadingScreen
				settings={settings}
				isTouch={isTouch}
				audioSystem={audioSystem}
				audioBuffers={audioBuffers}
				onClose={() => setIsLoadingScreenOpen(false)}
				showControls={!hasPlayedBefore}
			/>
		</>
	);
}

export default App;
