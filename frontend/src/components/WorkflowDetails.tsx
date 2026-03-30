import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "./Info";

interface WorkflowDetailsProps {
  workflow: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    nodes: any;
    edges: any;
  };
}

export function WorkflowDetails({ workflow }: WorkflowDetailsProps) {
  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Workflow Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <Info label="ID" value={workflow.id} />
        <Info label="Name" value={workflow.name} />
        <Info
          label="Created At"
          value={new Date(workflow.createdAt).toLocaleString()}
        />
        <Info
          label="Updated At"
          value={new Date(workflow.updatedAt).toLocaleString()}
        />

        <Info label="Nodes" value={`${workflow.nodes?.length ?? 0} nodes`} />
        <Info label="Connections" value={`${workflow.edges?.length ?? 0} edges`} />
      </CardContent>
    </Card>
  );
}
