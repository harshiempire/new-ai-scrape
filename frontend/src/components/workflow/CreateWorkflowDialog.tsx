import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useRef, useState } from "react";
import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createWorkflow } from "@/api/workflow";

export function CreateWorkflowDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: createWorkflow,
    onSuccess: (data, variables, onMutateResult, context) => {
      console.log({ data, variables, onMutateResult, context });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      onOpenChange(false);
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] ">
        {error && <p className="text-red-500">{error.message}</p>}
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
          <DialogDescription>Give the name of the workflow</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 p-1 max-h-[400px] overflow-y-auto ">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Workflow Name"
              className="p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => mutate(name)}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? "Creating..." : "Create Workflow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
