import { Component } from "react";
import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/Button.js";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <p className="font-display text-2xl text-ink-900">Something went sideways.</p>
            <p className="text-ink-600 text-sm mt-3">
              An unexpected error occurred. Reloading usually fixes it.
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              <RefreshCw size={15} /> Reload
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
