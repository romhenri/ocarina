import {scenarios} from "@/data/scenario-data";
import {useDismiss} from "@/util/use-dismiss";
import clsx from "clsx";
import {useRef, useState} from "react";

/** "Scenario" pill that opens a thumbnail grid for picking the background. */
export default function ScenarioPicker({
	scenarioId,
	onSelect,
}: {
	scenarioId: string;
	onSelect: (id: string) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	useDismiss({isOpen, ref, onDismiss: () => setIsOpen(false), withEscape: true});

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				aria-expanded={isOpen}
				onClick={() => setIsOpen((open) => !open)}
				className={clsx(
					"flex h-[36px] items-center rounded-full px-[16px] text-[15px] font-medium whitespace-nowrap text-white transition-all duration-150",
					isOpen ? "bg-black/80" : "bg-black/45 hover:scale-105 hover:bg-black/75"
				)}
			>
				Scenario
			</button>
			{isOpen && (
				<div className="forest-panel absolute top-[44px] left-0 grid max-h-[70vh] w-[min(560px,calc(100vw-24px))] grid-cols-3 gap-[8px] overflow-y-auto rounded-[3px] p-[16px] sm:grid-cols-4">
					{scenarios.map((s) => (
						<button
							key={s.id}
							type="button"
							title={s.label}
							aria-label={s.label}
							aria-pressed={s.id === scenarioId}
							onClick={() => onSelect(s.id)}
							className={clsx(
								"aspect-video w-full overflow-hidden rounded-[2px] transition hover:scale-105",
								s.id === scenarioId
									? "outline-2 outline-gold"
									: "opacity-75 hover:opacity-100"
							)}
						>
							<img src={s.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
						</button>
					))}
				</div>
			)}
		</div>
	);
}
