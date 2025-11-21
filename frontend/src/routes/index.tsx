import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getWorkflows } from "@/api/workflow";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["workflows"],
    queryFn: getWorkflows,
  });

  if (isLoading)
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        Loading workflows...
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-10 text-red-500">
        Failed to load workflows
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-semibold mb-6 tracking-tight">Workflows</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((wf) => (
          <Link
            to={"/workflow/$workflowId"}
            params={{ workflowId: wf.id }}
            key={wf.id}
          >
            <Card
              key={wf.id}
              className="border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white/70 backdrop-blur"
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    {wf.name}
                  </CardTitle>

                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>

                <CardDescription className="text-xs mt-1 text-gray-500">
                  {new Date(wf.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-4 pb-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Updated:</span>
                  <span>{new Date(wf.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
