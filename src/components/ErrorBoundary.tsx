import { Component, type ReactNode } from "react";
import { ServerError } from "../pages/NotFound";

interface State { hasError: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // In production, forward to a logging service (e.g. Supabase / Sentry)
    console.error("App error:", error);
  }

  render() {
    if (this.state.hasError) return <ServerError />;
    return this.props.children;
  }
}
