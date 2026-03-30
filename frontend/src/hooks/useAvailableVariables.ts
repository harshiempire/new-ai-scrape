/**
 * Hook for getting available template variables for a node
 * 
 * Returns variables from all source nodes connected via incoming edges,
 * grouped by source node label.
 */

import { useMemo } from "react";
import { useWorkflowStore } from "@/store/useWorkflowStore";
import { getAvailableVariables, getFlatVariables } from "@/lib/schemaUtils";
import type { SourceNodeVariables, VariableInfo } from "@/lib/schemaTypes";

/**
 * Get available variables for a node, grouped by source
 */
export function useAvailableVariables(nodeId: string | null): SourceNodeVariables[] {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);

  return useMemo(() => {
    if (!nodeId) return [];
    return getAvailableVariables(nodeId, nodes, edges);
  }, [nodeId, nodes, edges]);
}

/**
 * Get flattened list of all available variables for a node
 * Useful for autocomplete filtering
 */
export function useFlatVariables(nodeId: string | null): VariableInfo[] {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);

  return useMemo(() => {
    if (!nodeId) return [];
    return getFlatVariables(nodeId, nodes, edges);
  }, [nodeId, nodes, edges]);
}
