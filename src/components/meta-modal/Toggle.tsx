import clsx from "clsx";

export default function Toggle({isChecked}: {isChecked: boolean}) {
	return (
		<div
			aria-hidden="true"
			className={clsx(
				"relative block h-[16px] w-[38px] rounded-[99999px] transition-[background-color] duration-100",
				"before:absolute before:top-1/2 before:h-[20px] before:w-[20px] before:-translate-y-1/2 before:rounded-[99999px] before:content-[''] before:transition-[left,background-color,filter] before:duration-100",
				isChecked
					? "bg-leaf before:left-[18px] before:bg-[#f4fbe8] before:[filter:drop-shadow(0_0_6px_var(--color-leaf))]"
					: "bg-[#3b4d38] before:left-0 before:bg-[#d8dccb]"
			)}
		></div>
	);
}
