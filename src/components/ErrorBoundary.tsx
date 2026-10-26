import { Component, type ReactNode } from "react";
import { ServerError } from "../pages/NotFound";

interface State { hasError: boolean; detail?: string }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, detail: error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 200) : String(error).slice(0, 200) };
  }

  componentDidCatch(error: unknown) {
    // In production, forward to a logging service (e.g. Supabase / Sentry)
    console.error("App error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <ServerError />
          {this.state.detail && <p dir="ltr" className="mx-auto max-w-md px-4 pb-8 text-center text-[11px] text-slate-400">{this.state.detail}</p>}
        </>
      );
    }
    return this.props.children;
  }
}
