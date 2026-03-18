import { useQuery } from "@tanstack/react-query";
import { nodeDefitionsQueryOptions } from "@/query";

/**
 * React Query hook for fetching and caching node definitions
 * Definitions are cached for 5 minutes since they rarely change
 */
export function useNodeDefinitions() {
  return useQuery(nodeDefitionsQueryOptions());
}

/**
 * Get a specific node definition by type from the cached definitions
 */
export function useNodeDefinitionByType(type: string) {
  const { data: definitions, ...rest } = useNodeDefinitions();
  const definition = definitions?.find((d) => d.type === type) ?? null;
  return { data: definition, ...rest };
}
