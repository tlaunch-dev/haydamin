import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Fallback component with language support
function ErrorFallback({ error }: { error: Error | null }) {
  // Fallback to localStorage directly to avoid context dependency
  let language: 'en' | 'ar' = 'en';
  try {
    const stored = localStorage.getItem('language');
    if (stored === 'ar' || stored === 'en') {
      language = stored;
    }
  } catch {
    // If localStorage fails, keep default 'en'
  }
  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  const handleReload = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card rounded-3xl p-8 shadow-sm text-center">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-red-50 rounded-full p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-12 h-12 text-red-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className={`${fontClass} text-3xl font-bold text-text mb-4`}>
          {language === 'ar' ? 'حدث خطأ' : 'Something went wrong'}
        </h1>
        <p className={`${fontClass} text-lg text-text/70 mb-6`}>
          {language === 'ar'
            ? 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
            : "We're sorry, an unexpected error occurred. Please try again."}
        </p>

        {/* Error Details (only in development) */}
        {import.meta.env.DEV && error && (
          <details className="mb-6 text-left">
            <summary className={`${fontClass} text-sm text-text/50 cursor-pointer hover:text-text/70`}>
              Technical Details
            </summary>
            <pre className="mt-2 p-4 bg-background rounded-lg text-xs text-text/70 overflow-auto max-h-40">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        {/* Action Button */}
        <button
          onClick={handleReload}
          className={`${fontClass} bg-accent text-accent-text font-bold px-8 py-4 rounded-lg shadow-md transition-all duration-300 ease-out hover:shadow-lg hover:scale-105`}
        >
          {language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Return to Home'}
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundaryClass;

