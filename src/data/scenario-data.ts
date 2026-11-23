// Backgrounds selectable from the top-left "Scenario" picker. All live in public/images/nintendo.
export type Scenario = {id: string; label: string; src: string; thumb: string};

const art = (id: string, label: string, file: string): Scenario => {
	const src = `images/nintendo/${file}`;
	return {id, label, src, thumb: src};
};

// The 4K screenshots ship with a small `_TM_Standard` thumbnail, used for the picker grid.
const shot = (id: string, label: string, n: string): Scenario => {
	const base = `images/nintendo/screenshots/TheLegendOfZeldaOcarinaOfTime_${n}`;
	return {id, label, src: `${base}.jpg`, thumb: `${base}_TM_Standard.jpg`};
};

// Only environment shots: character close-ups and cutscenes don't work behind the UI.
export const scenarios: Scenario[] = [
	art("hyrule", "Hyrule Field", "OcarinaOfTime_BG_hyrule.jpg"),
	shot("castle-view", "Castle View", "41"),
	shot("village", "Village", "08"),
	shot("town", "Town", "47"),
	shot("desert", "Desert Fortress", "36"),
	shot("ruins", "Ruins", "33"),
	shot("forest", "Forest", "40"),
	art("temple", "Temple", "OcarinaOfTime_BG_courage.jpg"),
];

export const scenarioIds = scenarios.map((s) => s.id);
export const defaultScenarioId = "hyrule";

export function getScenario(id: string): Scenario {
	return scenarios.find((s) => s.id === id) ?? scenarios[0];
}
