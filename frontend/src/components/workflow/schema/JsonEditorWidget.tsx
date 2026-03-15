/**
 * Custom RJSF Widget for JSON body editing
 *
 * Renders a CodeMirror editor with JSON syntax highlighting,
 * bracket matching, and inline validation feedback.
 */

import { useState, useCallback, useEffect } from "react";
import type { WidgetProps } from "@rjsf/utils";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

function valueToText(value: unknown): string {
	if (value === null || value === undefined || value === "") return "{\n  \n}";
	if (typeof value === "string") {
		try {
			return JSON.stringify(JSON.parse(value), null, 2);
		} catch {
			return value;
		}
	}
	return JSON.stringify(value, null, 2);
}

function useIsDark() {
	const [isDark, setIsDark] = useState(
		() => document.documentElement.classList.contains("dark"),
	);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setIsDark(document.documentElement.classList.contains("dark"));
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});
		return () => observer.disconnect();
	}, []);

	return isDark;
}

export function JsonEditorWidget(props: WidgetProps) {
	const { value, onChange, disabled, readonly } = props;
	const isDark = useIsDark();

	const [text, setText] = useState(() => valueToText(value));
	const [error, setError] = useState<string | null>(null);

	const handleChange = useCallback(
		(val: string) => {
			setText(val);
			try {
				const parsed = JSON.parse(val);
				setError(null);
				onChange(parsed);
			} catch {
				setError("Invalid JSON");
				onChange(val);
			}
		},
		[onChange],
	);

	return (
		<div className="space-y-1.5">
			<div
				className={`rounded-md border overflow-hidden text-xs ${
					error ? "border-destructive" : "border-input"
				}`}
			>
				<CodeMirror
					value={text}
					extensions={[json()]}
					theme={isDark ? vscodeDark : "light"}
					onChange={handleChange}
					editable={!disabled && !readonly}
					height="180px"
					basicSetup={{
						lineNumbers: true,
						foldGutter: false,
						highlightActiveLine: true,
						bracketMatching: true,
						autocompletion: true,
						indentOnInput: true,
					}}
				/>
			</div>
			{error ? (
				<p className="text-xs text-destructive">{error}</p>
			) : (
				<p className="text-xs text-muted-foreground">
					Enter a valid JSON object
				</p>
			)}
		</div>
	);
}
