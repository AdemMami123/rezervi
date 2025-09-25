import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WeeklyAvailability Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center text-red-600 dark:text-red-400 mb-3">
            <span className="text-xl mr-2">⚠️</span>
            <h3 className="font-semibold">Business Hours Error</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            There was an error loading the business hours component.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;