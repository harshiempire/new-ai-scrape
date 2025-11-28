import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Loader2, AlertCircle } from "lucide-react";
import Header from "../components/Header";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: () => (
		<>
			<Header />
			<Outlet />
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					TanStackQueryDevtools,
				]}
			/>
		</>
	),
	// Default pending component for all routes
	pendingComponent: () => (
		<div className="flex items-center justify-center min-h-screen p-6">
			<Card className="max-w-md w-full">
				<CardContent className="pt-6">
					<div className="flex flex-col items-center gap-4">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-sm text-muted-foreground">Loading...</p>
					</div>
				</CardContent>
			</Card>
		</div>
	),
	// Default error component for all routes
	errorComponent: ({ error, reset }) => (
		<div className="flex items-center justify-center min-h-screen p-6">
			<Card className="max-w-md w-full">
				<CardHeader>
					<div className="flex items-center gap-2 text-destructive">
						<AlertCircle className="h-5 w-5" />
						<CardTitle>Error</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						{error instanceof Error ? error.message : "An unexpected error occurred"}
					</p>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={reset}
							className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
						>
							Try Again
						</button>
						<button
							type="button"
							onClick={() => window.history.back()}
							className="px-4 py-2 border rounded-md hover:bg-muted transition"
						>
							Go Back
						</button>
					</div>
				</CardContent>
			</Card>
		</div>
	),
});
