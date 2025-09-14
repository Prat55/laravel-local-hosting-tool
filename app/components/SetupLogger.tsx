'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
    id: number;
    step: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    message: string;
    created_at: string;
}

interface SetupLoggerProps {
    siteId: number;
    siteName: string;
    onComplete: (siteUrl: string) => void;
    onClose: () => void;
}

export default function SetupLogger({ siteId, siteName, onComplete, onClose }: SetupLoggerProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [siteStatus, setSiteStatus] = useState<string>('In Progress');
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        fetchLogs();
        const interval = setInterval(fetchLogs, 2000); // Poll every 2 seconds
        return () => clearInterval(interval);
    }, [siteId]);

    const fetchLogs = async () => {
        try {
            const response = await fetch(`/api/sites/${siteId}/logs`);
            const data = await response.json();

            if (data.success) {
                setLogs(data.data.logs);
                setSiteStatus(data.data.site.status);

                // Check if setup is complete
                if (data.data.site.status === 'Active') {
                    onComplete(`https://${siteName}.test`);
                } else if (data.data.site.status === 'Failed') {
                    // Handle failure case
                    console.error('Setup failed');
                }
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <i className="fa fa-check-circle text-green-500"></i>;
            case 'in_progress':
                return <i className="fa fa-spinner fa-spin text-blue-500"></i>;
            case 'failed':
                return <i className="fa fa-times-circle text-red-500"></i>;
            default:
                return <i className="fa fa-clock text-gray-400"></i>;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-400';
            case 'in_progress':
                return 'text-blue-400';
            case 'failed':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    if (!isClient || isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading setup progress...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="w-full max-w-4xl border border-[#ededed] rounded-lg p-8 relative">
                {/* Exit Button */}
                <div className="absolute top-4 right-4 group">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-[#ededed] text-black rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 border border-[#ededed] hover:border-red-500 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
                    >
                        <i className="fa fa-times text-lg"></i>
                    </button>
                    {/* Tooltip */}
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Close
                        <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Setting up {siteName}.test</h1>
                    <p className="text-lg text-gray-300">Please wait while we configure your Laravel site...</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Progress</span>
                        <span>{logs.filter(log => log.status === 'completed').length} / {logs.length} steps</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{
                                width: `${logs.length > 0 ? (logs.filter(log => log.status === 'completed').length / logs.length) * 100 : 0}%`
                            }}
                        ></div>
                    </div>
                </div>

                {/* Logs */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {logs.length === 0 ? (
                        <div className="text-center py-8">
                            <i className="fa fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                            <p className="text-gray-400">Waiting for setup to begin...</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg">
                                <div className="flex-shrink-0 mt-1">
                                    {getStatusIcon(log.status)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`font-medium ${getStatusColor(log.status)}`}>
                                            {log.step}
                                        </h3>
                                        <span className="text-xs text-gray-500">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    {log.message && (
                                        <p className="text-sm text-gray-300 mt-1">{log.message}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Current Status */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800">
                        <i className="fa fa-info-circle text-blue-400 mr-2"></i>
                        <span className="text-gray-300">
                            Status: <span className="font-semibold">{siteStatus}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
