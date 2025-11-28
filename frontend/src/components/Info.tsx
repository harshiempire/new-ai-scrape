interface InfoProps {
	label: string;
	value: string | number;
}

export function Info({ label, value }: InfoProps) {
	return (
		<div className="flex flex-col mb-2">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="font-medium break-all text-sm">{value}</span>
		</div>
	);
}
