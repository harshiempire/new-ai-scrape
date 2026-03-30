/**
 * KeyValueEditor — standalone key/value pair editor for Record<string, string> fields.
 *
 * Intentionally NOT a RJSF field/widget. It is rendered directly in PropertyInspector
 * so changes are merged into the node's props without going through RJSF's onChange
 * chain (which in RJSF 6 replaces the entire form data when called from a custom Field).
 *
 * Header values support Mustache template autocomplete ({{ }}) via TemplateInput.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { TemplateInput } from "./TemplateInput";

type Pair = { key: string; value: string };

function recordToPairs(value: Record<string, string> | undefined): Pair[] {
	if (!value || typeof value !== "object") return [];
	return Object.entries(value).map(([key, val]) => ({
		key,
		value: String(val ?? ""),
	}));
}

function pairsToRecord(pairs: Pair[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (const { key, value } of pairs) {
		if (key.trim()) out[key.trim()] = value;
	}
	return out;
}

export interface KeyValueEditorProps {
	/** ID of the current node, used for TemplateInput variable autocomplete */
	nodeId: string | null;
	/** Current value from the store */
	value: Record<string, string> | undefined;
	/** Called with the new record whenever a committed change is made */
	onChange: (value: Record<string, string>) => void;
	disabled?: boolean;
}

export function KeyValueEditor({ nodeId, value, onChange, disabled = false }: KeyValueEditorProps) {
	// Local state for pairs — includes pending empty rows that aren't yet committed
	const [pairs, setPairs] = useState<Pair[]>(() => recordToPairs(value));

	// Track the last value we emitted so we don't re-sync from outside after our own change
	const lastEmittedRef = useRef<Record<string, string>>(pairsToRecord(pairs));

	// Sync from outside only when the external value differs from what we last emitted
	useEffect(() => {
		if (!value) return;
		const last = lastEmittedRef.current;
		const sameKeys = JSON.stringify(value) === JSON.stringify(last);
		if (!sameKeys) {
			setPairs(recordToPairs(value));
			lastEmittedRef.current = value;
		}
	}, [value]);

	const commit = useCallback(
		(next: Pair[]) => {
			setPairs(next);
			const record = pairsToRecord(next);
			lastEmittedRef.current = record;
			onChange(record);
		},
		[onChange],
	);

	// Local key change — update visually only, don't emit until key is non-empty
	const handleKeyChange = (idx: number, key: string) => {
		const next = pairs.map((p, i) => (i === idx ? { ...p, key } : p));
		setPairs(next);
		// Emit if the new key is non-empty (or we're clearing a key that was set)
		const record = pairsToRecord(next);
		lastEmittedRef.current = record;
		onChange(record);
	};

	const handleValueChange = (idx: number, val: string) => {
		commit(pairs.map((p, i) => (i === idx ? { ...p, value: val } : p)));
	};

	// Add an empty row locally — does NOT call onChange (empty key = not committed)
	const addRow = () => {
		setPairs((prev) => [...prev, { key: "", value: "" }]);
	};

	const removeRow = (idx: number) => {
		commit(pairs.filter((_, i) => i !== idx));
	};

	return (
		<div className="space-y-2">
			{pairs.length === 0 ? (
				<p className="text-xs text-muted-foreground italic py-1">
					No headers — click Add to set one
				</p>
			) : (
				<div className="space-y-2">
					{/* Column headers */}
					<div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-0.5">
						<Label className="text-xs text-muted-foreground">Key</Label>
						<Label className="text-xs text-muted-foreground">Value</Label>
						<span className="w-7" />
					</div>

					{pairs.map((pair, idx) => (
						<div
							key={idx}
							className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
						>
							{/* Key — static names like "Authorization", no template needed */}
							<Input
								value={pair.key}
								onChange={(e) => handleKeyChange(idx, e.target.value)}
								placeholder="Header name"
								disabled={disabled}
								className="h-8 text-sm font-mono"
							/>
							{/* Value — supports Mustache templates like {{Start.token}} */}
							<TemplateInput
								nodeId={disabled ? null : nodeId}
								value={pair.value}
								onChange={(val) => handleValueChange(idx, val)}
								placeholder="Value or {{variable}}"
								disabled={disabled}
								className="h-8 text-sm"
							/>
							{!disabled && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
									onClick={() => removeRow(idx)}
								>
									<X className="w-3.5 h-3.5" />
								</Button>
							)}
						</div>
					))}
				</div>
			)}

			{!disabled && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={addRow}
					className="h-7 text-xs gap-1.5 mt-1"
				>
					<Plus className="w-3 h-3" />
					Add header
				</Button>
			)}
		</div>
	);
}

// Keep the old export name so existing imports don't break
export { KeyValueEditor as KeyValueWidget };
