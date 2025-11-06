import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: number;
  time: string;
  level: 'log' | 'warn' | 'error';
  message: string;
  args: any[];
}

export function MobileConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const logIdRef = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read existing logs from global array (set up in main.tsx)
    const existingLogs = (window as any).__mobileConsoleLogs || [];
    setLogs(existingLogs.map((log: any, index: number) => ({
      id: index,
      ...log,
      level: log.level as 'log' | 'warn' | 'error'
    })));

    // Set up interval to check for new logs
    const interval = setInterval(() => {
      const currentLogs = (window as any).__mobileConsoleLogs || [];
      if (currentLogs.length > logs.length) {
        const newLogs = currentLogs.slice(logs.length).map((log: any) => ({
          id: logIdRef.current++,
          ...log,
          level: log.level as 'log' | 'warn' | 'error'
        }));
        setLogs(prev => [...prev, ...newLogs].slice(-50));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [logs.length]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current && !isMinimized) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isMinimized]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg text-xs"
        title="Open Console"
      >
        📱
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-[9999] w-full sm:w-96 h-64 sm:h-96 bg-black/95 text-white text-xs font-mono border-t border-l border-gray-700 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">Console ({logs.length})</span>
          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              className="text-gray-400 hover:text-white text-xs px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white"
          >
            {isMinimized ? '▼' : '▲'}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Logs */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No logs yet...</div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className={`text-xs ${
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warn' ? 'text-yellow-400' :
                  'text-gray-300'
                }`}
              >
                <span className="text-gray-500">[{log.time}]</span>{' '}
                <span className="font-semibold">[{log.level.toUpperCase()}]</span>{' '}
                <span>{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}

