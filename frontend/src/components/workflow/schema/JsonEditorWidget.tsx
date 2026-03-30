/**
 * Custom RJSF Widget for JSON body editing
 *
 * Renders a CodeMirror editor with JSON syntax highlighting,
 * bracket matching, and inline validation feedback.
 * Supports Mustache template autocomplete ({{ }}) using variables
 * from connected source nodes, received via RJSF formContext.nodeId.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import type { WidgetProps } from "@rjsf/utils";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import {
	autocompletion,
	startCompletion,
	type CompletionContext,
	type CompletionResult,
} from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import { useFlatVariables } from "@/hooks/useAvailableVariables";
import type { VariableInfo } from "@/lib/schemaTypes";

// Fires startCompletion whenever the user types the second "{" (i.e. "{{")
// CodeMirror's activateOnTyping skips punctuation, so we trigger it manually.
const mustacheTriggerExtension = EditorView.updateListener.of((update) => {
	if (!update.docChanged) return;
	const cursor = update.state.selection.main.head;
	const before = update.state.doc.sliceString(Math.max(0, cursor - 2), cursor);
	if (before === "{{") {
		startCompletion(update.view);
	}
});

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

function makeMustacheExtension(variables: VariableInfo[]) {
	const source = (context: CompletionContext): CompletionResult | null => {
		// Match {{ followed by optional word chars / dots up to cursor
		const match = context.matchBefore(/\{\{[\w.]*$/);
		if (!match) return null;

		const filterText = match.text.slice(2).toLowerCase(); // strip the {{
		const options = variables
			.filter((v) => v.path.toLowerCase().startsWith(filterText))
			.map((v) => ({
				label: v.path,
				type: "variable" as const,
				detail: v.type,
				// Insert just the path + closing }}, replacing the partial text after {{
				apply: v.path + "}}",
			}));

		if (options.length === 0) return null;

		return {
			from: match.from + 2, // start replacing after the {{
			options,
			validFor: /^[\w.]*$/,
		};
	};

	return autocompletion({ override: [source] });
}

export function JsonEditorWidget(props: WidgetProps) {
	const { value, onChange, disabled, readonly, options } = props;
	const isDark = useIsDark();

	// Read nodeId from ui:options (same pattern as TemplateTextWidget)
	const nodeId: string | null = (options as any)?.nodeId ?? null;
	const variables = useFlatVariables(nodeId);

	const [text, setText] = useState(() => valueToText(value));
	const [error, setError] = useState<string | null>(null);

	const mustacheExtension = useMemo(
		() => makeMustacheExtension(variables),
		// Re-build only when variable list actually changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[variables],
	);

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
					extensions={[json(), mustacheExtension, mustacheTriggerExtension]}
					theme={isDark ? vscodeDark : "light"}
					onChange={handleChange}
					editable={!disabled && !readonly}
					height="180px"
					basicSetup={{
						lineNumbers: true,
						foldGutter: false,
						highlightActiveLine: true,
						bracketMatching: true,
						autocompletion: false, // we register our own above
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
