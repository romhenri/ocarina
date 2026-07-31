// The play mode, selected in the top-left switcher.
//  - "song":     the default — song sheets shown, songs are matched and played back.
//  - "free":     no song sheets and no song matching; just an open instrument.
//  - "speedrun": a timed run through a configurable song set (see {@link SpeedrunSet}).
//  - "hero":     a Guitar-Hero-style rhythm game — a song's notes scroll to a hit-line and
//                are scored on timing accuracy (see the `src/hero` module).
export type Mode = "song" | "free" | "speedrun" | "hero";
// Which song set a speedrun runs through. "both" is the (deduplicated) union of the two.
export type SpeedrunSet = "oot" | "mm" | "both";

// Canonical selection order for the play modes and speedrun sets. The switchers, the cycle-to-next
// logic, and the persistence validation all read these, so the order lives in exactly one place.
export const modeOrder: readonly Mode[] = ["song", "free", "speedrun", "hero"];
export const speedrunSetOrder: readonly SpeedrunSet[] = ["both", "oot", "mm"];

// The next item after `current` in cyclic order, wrapping at the end. Used by the speedrun set
// selector to cycle through `speedrunSetOrder` on each press.
export function nextInOrder<T>(order: readonly T[], current: T): T {
	return order[(order.indexOf(current) + 1) % order.length];
}
