import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { nodeDefitionsQueryOptions, workflowsQueryOptions } from "@/query";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { CreateWorkflowDialog } from "@/components/workflow/CreateWorkflowDialog";
import { Delete } from "lucide-react";
import { deleteWorkflowById } from "@/api/workflow";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

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
  const queryClient = useQueryClient();
  const { data: workflows } = useSuspenseQuery(workflowsQueryOptions());
  const { data: nodeDefinitions } = useSuspenseQuery(
    nodeDefitionsQueryOptions(),
  );
  const router = useRouter();

  const deletingIdRef = useRef<string | null>(null);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: deleteWorkflowById,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workflowsQueryOptions().queryKey,
      });
      toast("Deleted the Workflow", {
        description: "Deleted the workflow successfully.",
      });
    },
    onError: () => {
      toast("Failed to delete the Workflow", {
        description: "An error occurred while deleting the workflow.",
      });
    },
  });

  const [showCreateWorkflowDialog, setShowCreateWorkflowDialog] =
    useState(false);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex flex-row justify-between items-center py-6">
        <h1 className="text-3xl font-semibold flex-1 tracking-tight">
          Workflows
        </h1>
        <Button
          onClick={() => {
            setShowCreateWorkflowDialog(true);
          }}
        >
          Create Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows?.map((wf) => (
          <Card
            key={wf.id}
            className="border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-card/70 backdrop-blur"
            onClick={() => {
              router.navigate({
                to: `/workflow/${wf.id}`,
                params: { workflowId: wf.id },
              });
            }}
          >
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {wf.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async (e) => {
                      e.stopPropagation();
                      deletingIdRef.current = wf.id;
                      await mutateAsync(wf.id);
                      deletingIdRef.current = null;
                    }}
                  >
                    {isPending && deletingIdRef.current === wf.id ? <Spinner /> : <Delete />}
                  </Button>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
              </div>

              <CardDescription className="text-xs mt-1 text-muted-foreground">
                {new Date(wf.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-4 pb-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="font-medium">Updated:</span>
                <span>{new Date(wf.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
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
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(nodeDefinitions, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
      {showCreateWorkflowDialog && (
        <CreateWorkflowDialog
          open={showCreateWorkflowDialog}
          onOpenChange={setShowCreateWorkflowDialog}
        />
      )}
    </div>
  );
}
