/**
 * Custom RJSF Widget for Template Input
 * 
 * This widget replaces the default text input in RJSF forms
 * with our TemplateInput component that has {{ }} autocomplete.
 */

import type { WidgetProps } from "@rjsf/utils";
import { TemplateInput } from "./TemplateInput";

/**
 * Custom RJSF widget that provides template autocomplete
 * Usage in uiSchema:
 * {
 *   "url": {
 *     "ui:widget": TemplateTextWidget,
 *     "ui:options": { nodeId: "current-node-id" }
 *   }
 * }
 */
export function TemplateTextWidget(props: WidgetProps) {
    const { value, onChange, disabled, readonly, options, placeholder } = props;

    // Get nodeId from options - RJSF passes custom options here
    const nodeId = (options as { nodeId?: string })?.nodeId || null;

    return (
        <TemplateInput
            nodeId={nodeId}
            value={value ?? ""}
            onChange={(newValue) => onChange(newValue)}
            placeholder={placeholder}
            disabled={disabled || readonly}
        />
    );
}
