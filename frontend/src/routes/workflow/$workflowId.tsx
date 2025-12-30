import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDialogState } from "@/hooks/useDialogState";
import { useWorkflowEditor } from "@/hooks/useWorkflowEditor";
import { toReactFlowEdges, toReactFlowNodes } from "@/lib/workflow-transformer";
import { workflowQueryOptions } from "@/query";
import { ExecutionDetails } from "../../components/ExecutionDetails";
import { ExecutionsList } from "../../components/ExecutionsList";
import { WorkflowDetails } from "../../components/WorkflowDetails";
import { EditorToolbar } from "../../components/workflow/EditorToolbar";
import { LayoutControls } from "../../components/workflow/LayoutControls";
import { NodePalette } from "../../components/workflow/NodePalette";
import { ValidationPanel } from "../../components/workflow/ValidationPanel";
import { WorkflowVisualEditor } from "../../components/workflow/WorkflowVisualEditor";
import { PropertyInspector } from "../../components/workflow/PropertyInspector";
import { UndoRedoControls } from "../../components/workflow/UndoRedoControls";
import { InitialInputsDialog } from "../../components/workflow/InitialInputsDialog";

export const Route = createFileRoute("/workflow/$workflowId")({
  loader: ({ context: { queryClient }, params: { workflowId } }) => {
    return [queryClient.ensureQueryData(workflowQueryOptions(workflowId))];
  },
  component: WorkflowDisplay,
});

function WorkflowDisplay() {
  const { workflowId } = Route.useParams();

  // Load workflow data
  const { data: workflow } = useSuspenseQuery(workflowQueryOptions(workflowId));

  // Workflow editor hook - consolidates all workflow logic
  const editor = useWorkflowEditor({ workflowId });

  // Dialog state for initial inputs
  const inputsDialog = useDialogState();

  // Track if this is the initial load (to preserve selection on reloads)
  const isInitialLoad = useRef(true);

  // Load workflow data into store on mount or workflow change
  useEffect(() => {
    const initialNodes = toReactFlowNodes(workflow.nodes);
    const initialEdges = toReactFlowEdges(workflow.edges);
    // Preserve selection on subsequent loads (after auto-save)
    editor.loadWorkflow(initialNodes, initialEdges, !isInitialLoad.current);
    isInitialLoad.current = false;
  }, [workflow.nodes, workflow.edges]);// eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6 space-y-4">
      <Tabs value={editor.activeTab} onValueChange={editor.setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
        </TabsList>

        {/* ================= VISUAL EDITOR TAB ================= */}
        <TabsContent value="editor" className="space-y-0">
          <EditorToolbar
            autoSaveEnabled={editor.autoSaveEnabled}
            onToggleAutoSave={editor.toggleAutoSave}
            hasUnsavedChanges={editor.hasUnsavedChanges}
            onManualSave={editor.handleManualSave}
            isSaving={editor.isSaving}
            onExecute={inputsDialog.open}
            isExecuting={editor.isExecuting}
          />

          <div className="flex gap-4 h-[calc(100vh-200px)]">
            {/* Left Sidebar: Node Palette */}
            <div className="w-64 flex-shrink-0 space-y-4 overflow-y-auto">
              <NodePalette />
              <ValidationPanel />
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 border rounded-lg overflow-hidden bg-white relative">
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <UndoRedoControls
                  canUndo={editor.canUndo}
                  canRedo={editor.canRedo}
                  onUndo={editor.undo}
                  onRedo={editor.redo}
                />
                <LayoutControls onLayout={editor.handleLayout} />
              </div>
              <WorkflowVisualEditor
                key={workflowId}
                onNodesChange={editor.handleNodesChange}
                onEdgesChange={editor.handleEdgesChange}
                onNodeSelection={editor.handleNodeSelection}
              />
            </div>
          </div>
        </TabsContent>

        {/* ================= DETAILS TAB ================= */}
        <TabsContent value="details">
          <WorkflowDetails workflow={workflow} />
        </TabsContent>

        {/* ================= EXECUTIONS TAB ================= */}
        <TabsContent value="executions">
          <div className="grid grid-cols-3 gap-6">
            <ExecutionsList
              executions={editor.executions || []}
              isLoading={editor.isLoadingExecutions}
              selectedExecutionId={editor.selectedExecution?.id}
              onSelectExecution={editor.setSelectedExecution}
            />
            <ExecutionDetails
              execution={editor.selectedExecution}
              executionData={editor.executionData}
              isLoading={editor.isLoadingExecutionData}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Property Inspector Modal */}
      <PropertyInspector onNodeUpdate={editor.handleNodeUpdate} />

      {/* Initial Inputs Dialog */}
      <InitialInputsDialog
        open={inputsDialog.isOpen}
        onOpenChange={inputsDialog.setIsOpen}
        onExecute={(inputs) => {
          editor.handleExecuteWorkflow(inputs);
          inputsDialog.close();
        }}
        isExecuting={editor.isExecuting}
      />
    </div>
  );
}
