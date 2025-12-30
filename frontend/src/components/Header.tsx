import { Link } from "@tanstack/react-router";

import { Home, Menu, Network, X } from "lucide-react";
import { useDialogState } from "@/hooks/useDialogState";
import { ThemeToggle } from "./ThemeToggle";

export default function Header() {
	const sidebar = useDialogState();

	return (
		<>
			<header className="p-4 flex items-center bg-muted text-foreground shadow-lg">
				<button
					onClick={sidebar.open}
					className="p-2 hover:bg-accent rounded-lg transition-colors"
					aria-label="Open menu"
				>
					<Menu size={24} />
				</button>
				<h1 className="ml-4 text-xl font-semibold flex-1">
					<Link to="/">
						<img
							src="/tanstack-word-logo-white.svg"
							alt="TanStack Logo"
							className="h-10 dark:invert-0 invert"
						/>
					</Link>
				</h1>
				<ThemeToggle />
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-background text-foreground shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebar.isOpen ? "translate-x-0" : "-translate-x-full"
					}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-border">
					<h2 className="text-xl font-bold">Navigation</h2>
					<button
						onClick={sidebar.close}
						className="p-2 hover:bg-accent rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					<Link
						to="/"
						onClick={sidebar.close}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mb-2",
						}}
					>
						<Home size={20} />
						<span className="font-medium">Home</span>
					</Link>

					{/* Demo Links Start */}

					<Link
						to="/demo/tanstack-query"
						onClick={sidebar.close}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mb-2",
						}}
					>
						<Network size={20} />
						<span className="font-medium">TanStack Query</span>
					</Link>

					{/* Demo Links End */}
				</nav>
			</aside>
		</>
	);
}

