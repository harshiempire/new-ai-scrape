import type { DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIcon, getColorClasses } from "@/lib/iconRegistry";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { nodeDefitionsQueryOptions } from "@/query";

interface NodePaletteProps {
  className?: string;
}

export function NodePalette({ className }: NodePaletteProps) {
  const {
    data: nodeDefinitions,
    isLoading,
    error,
  } = useQuery(nodeDefitionsQueryOptions());

  const handleDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Node Palette</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Node Palette</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-500">
          Failed to load nodes
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Node Palette</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {nodeDefinitions?.map((def) => {
          const Icon = getIcon(def.icon);
          const colorClasses = getColorClasses(def.color);

          return (
            <div
              key={def.type}
              draggable
              onDragStart={(e) => handleDragStart(e, def.type)}
              className={`
								flex items-center gap-3 p-3 border-2 rounded-lg cursor-move
								transition-all hover:shadow-md active:shadow-sm
								${colorClasses}
							`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{def.label}</div>
                <div className="text-xs opacity-75 truncate">
                  {def.description}
                </div>
              </div>
            </div>
          );
        })}

        <div className="pt-2 mt-2 border-t text-xs text-muted-foreground">
          💡 Drag nodes onto the canvas
        </div>
      </CardContent>
    </Card>
  );
}
