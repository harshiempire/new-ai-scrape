import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { nodeDefitionsQueryOptions, workflowsQueryOptions } from "@/query";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) => {
    return Promise.all([
      queryClient.ensureQueryData(workflowsQueryOptions()),
      queryClient.ensureQueryData(nodeDefitionsQueryOptions()),
    ]);
  },
  component: App,
});

function App() {
	// Add to any component temporarily
if (typeof (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
  console.log('React Compiler Active:', 
    !!(globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.reactCompiler);
}
  const { data: workflows } = useSuspenseQuery(workflowsQueryOptions());
  const { data: nodeDefinitions } = useSuspenseQuery(
    nodeDefitionsQueryOptions()
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-semibold mb-6 tracking-tight">Workflows</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows?.map((wf) => (
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
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 tracking-tight">
          Node Definitions
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Available Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(nodeDefinitions, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
