import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 rounded-lg bg-red-900/20 border border-red-700 text-red-300">
          <p className="font-semibold mb-1">Something went wrong</p>
          <p className="text-sm opacity-80">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
