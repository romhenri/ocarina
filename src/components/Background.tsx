import {clamp} from "@/util/math";
import {animated, useSpring} from "@react-spring/web";
import clsx from "clsx";
import {useCallback, useEffect} from "react";

const bgElemClass =
	"absolute [transform:scale(var(--scale))_translate(calc(var(--offset-x)*var(--offset-max-x)*-1),calc(var(--offset-y)*var(--offset-max-y)*-1))]";

// Fixed pseudo-random spread so fireflies don't jump around between renders.
const fireflies = Array.from({length: 18}, (_, i) => ({
	left: `${(i * 37 + 11) % 96}%`,
	top: `${38 + ((i * 53) % 52)}%`,
	delay: `${-((i * 0.83) % 6)}s`,
	duration: `${5 + (i % 5)}s`,
}));

export default function Background({
	isParallaxOn,
	src,
	filterOpacity,
}: {
	isParallaxOn: boolean;
	src: string;
	filterOpacity: number;
}) {
	const [springs] = useSpring(
		() => ({
			x: 0,
			y: 0,
			config: {
				mass: 1,
				friction: 50,
				tension: 100,
			},
		}),
		[]
	);

	const handleMouseMove = useCallback(
		(event: MouseEvent) => {
			if (!isParallaxOn) return;

			springs.x.start(clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1));
			springs.y.start(clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1));
		},
		[isParallaxOn, springs.x, springs.y]
	);

	useEffect(() => {
		window.addEventListener("mousemove", handleMouseMove);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
		};
	}, [handleMouseMove]);

	return (
		<animated.div
			aria-hidden="true"
			className="fixed inset-0 overflow-hidden pointer-events-none select-none z-[-10000]"
			style={
				!isParallaxOn
					? ({"--offset-x": 0, "--offset-y": 0} as React.CSSProperties)
					: ({
							"--offset-x": springs.x.to((value) => value.toString()),
							"--offset-y": springs.y.to((value) => value.toString()),
						} as React.CSSProperties)
			}
		>
			<img
				alt=""
				className={clsx(
					bgElemClass,
					"left-0 top-0 h-full w-full object-cover [--scale:1.06] [--offset-max-x:1.5%] [--offset-max-y:1.5%]"
				)}
				src={src}
			/>
			{/* Darken and warm the photo so panels and text stay readable on top of it. */}
			<div className="absolute inset-0" style={{opacity: filterOpacity}}>
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(0,0,0,0.05),rgba(10,7,3,0.7))]" />
				<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,7,3,0.15),rgba(10,7,3,0.55))]" />
			</div>
			{fireflies.map((style, i) => (
				<span
					key={i}
					className="absolute size-[3px] rounded-full bg-firefly animate-firefly blur-[0.5px] [box-shadow:0_0_10px_4px_rgba(240,236,140,0.35)]"
					style={{
						left: style.left,
						top: style.top,
						animationDelay: style.delay,
						animationDuration: style.duration,
					}}
				/>
			))}
		</animated.div>
	);
}
