import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6 text-center">
        <div className="text-4xl">⚠️</div>
        <div>
          <p className="font-semibold text-destructive">
            {this.props.title ?? "Something went wrong"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={this.reset}>
          Try again
        </Button>
      </div>
    );
  }
}
