import A from "@/images/buttons/a.svg?react";
import CDown from "@/images/buttons/c-down.svg?react";
import CLeft from "@/images/buttons/c-left.svg?react";
import CRight from "@/images/buttons/c-right.svg?react";
import CUp from "@/images/buttons/c-up.svg?react";
import type {NoteName} from "@/data/song-data";
import type {SvgComponent} from "@/util/svg";

// The mutable settings the user can change, as a typed map. Reading a value is a
// direct, typed property access (`settings.volume` is a `number`) — no lookups,
// no casts. This is also exactly the shape we persist to localStorage.
export type SettingValues = {
	volume: number;
	// Opacity of the darkening filter over the background (0 = raw image, 1 = full dim).
	bgFilter: number;
	bgMovement: boolean;
	// Whether the confirmation chime plays when a song is matched (Song/Speedrun modes).
	songMatchSound: boolean;
	keybindA: string;
	keybindCUp: string;
	keybindCDown: string;
	keybindCLeft: string;
	keybindCRight: string;
	keybindBendWholeDown: string;
	keybindBendSemiDown: string;
	keybindBendSemiUp: string;
	keybindBendWholeUp: string;
	keybindVibrato: string;
	keybindSpeedrunReset: string;
};
export type SettingId = keyof SettingValues;
export type NoteKeybindId =
	| "keybindA"
	| "keybindCUp"
	| "keybindCDown"
	| "keybindCLeft"
	| "keybindCRight";
export type BendKeybindId =
	| "keybindBendWholeDown"
	| "keybindBendSemiDown"
	| "keybindBendSemiUp"
	| "keybindBendWholeUp";
export type KeybindId = NoteKeybindId | BendKeybindId | "keybindVibrato" | "keybindSpeedrunReset";

// The note each configurable note-key plays. Shared by every input engine (the ocarina playback
// engine and the Hero rhythm mode) so key→note mapping lives in exactly one place.
export const keybindsToNotes: Record<NoteKeybindId, NoteName> = {
	keybindA: "a",
	keybindCUp: "u",
	keybindCDown: "d",
	keybindCLeft: "l",
	keybindCRight: "r",
};

// The static metadata describing how each setting is rendered, in display order.
// Discriminating on `type` narrows `id`, which in turn types the value lookup, so
// the modal can render and edit each control without a single cast.
// Ids of the boolean (toggle) settings. Kept as its own union so a new toggle only needs adding
// here and to `SettingValues` for the discriminated field type to accept it.
export type ToggleId = "bgMovement" | "songMatchSound";
type SliderField = {readonly type: "slider"; readonly id: "volume" | "bgFilter"; readonly default: number};
type ToggleField = {readonly type: "toggle"; readonly id: ToggleId; readonly default: boolean};
type KeybindField = {
	readonly type: "keybind";
	readonly id: KeybindId;
	readonly image?: SvgComponent;
	readonly default: string;
};
export type SettingField = {
	readonly name: string;
	readonly hideOnMobile?: boolean;
} & (SliderField | ToggleField | KeybindField);

export const settingFields: readonly SettingField[] = [
	{
		id: "volume",
		name: "Volume",
		type: "slider",
		default: 0.25,
	},
	{
		id: "bgFilter",
		name: "Background Filter",
		type: "slider",
		default: 0.5,
	},
	{
		id: "songMatchSound",
		name: "Song Match Sound",
		type: "toggle",
		default: true,
	},
	{
		id: "bgMovement",
		name: "Background Movement",
		type: "toggle",
		default: true,
		hideOnMobile: true,
	},
	{
		id: "keybindA",
		name: "A",
		type: "keybind",
		image: A,
		default: "a",
		hideOnMobile: true,
	},
	{
		id: "keybindCUp",
		name: "C-Up",
		type: "keybind",
		image: CUp,
		default: "ArrowUp",
		hideOnMobile: true,
	},
	{
		id: "keybindCDown",
		name: "C-Down",
		type: "keybind",
		image: CDown,
		default: "ArrowDown",
		hideOnMobile: true,
	},
	{
		id: "keybindCLeft",
		name: "C-Left",
		type: "keybind",
		image: CLeft,
		default: "ArrowLeft",
		hideOnMobile: true,
	},
	{
		id: "keybindCRight",
		name: "C-Right",
		type: "keybind",
		image: CRight,
		default: "ArrowRight",
		hideOnMobile: true,
	},
	{
		id: "keybindBendWholeDown",
		name: "Bend Down (Whole Tone)",
		type: "keybind",
		default: "q",
		hideOnMobile: true,
	},
	{
		id: "keybindBendSemiDown",
		name: "Bend Down (Semitone)",
		type: "keybind",
		default: "w",
		hideOnMobile: true,
	},
	{
		id: "keybindBendSemiUp",
		name: "Bend Up (Semitone)",
		type: "keybind",
		default: "e",
		hideOnMobile: true,
	},
	{
		id: "keybindBendWholeUp",
		name: "Bend Up (Whole Tone)",
		type: "keybind",
		default: "r",
		hideOnMobile: true,
	},
	{
		id: "keybindVibrato",
		name: "Vibrato",
		type: "keybind",
		default: "t",
		hideOnMobile: true,
	},
	{
		id: "keybindSpeedrunReset",
		name: "Speedrun Reset",
		type: "keybind",
		default: " ",
		hideOnMobile: true,
	},
];

export const keybindIds: readonly KeybindId[] = settingFields
	.filter((field): field is Extract<SettingField, {type: "keybind"}> => field.type === "keybind")
	.map((field) => field.id);

export const defaultSettingValues = Object.fromEntries(
	settingFields.map((field) => [field.id, field.default])
) as SettingValues;

// CapsLock/Shift make the browser report a letter key as uppercase; collapse single-character keys
// to lowercase so a binding matches regardless of those modifiers. Named keys (ArrowUp, Escape, " ")
// are multi-char or already case-stable, so they pass through unchanged.
export const normalizeKey = (key: string): string => (key.length === 1 ? key.toLowerCase() : key);
