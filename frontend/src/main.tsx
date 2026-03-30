import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import * as TanStackQueryProvider from "./integrations/tanstack-query/root-provider.tsx";
import { ThemeProvider } from "./components/ThemeProvider.tsx";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";

const TanStackQueryProviderContext = TanStackQueryProvider.getContext();
const router = createRouter({
	routeTree,
	context: {
		...TanStackQueryProviderContext,
	},
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<ThemeProvider defaultTheme="system" storageKey="ui-theme">
				<TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
					<RouterProvider router={router} />
				</TanStackQueryProvider.Provider>
			</ThemeProvider>
		</StrictMode>,
	);
}

reportWebVitals();
