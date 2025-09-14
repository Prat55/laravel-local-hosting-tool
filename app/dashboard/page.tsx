'use client';

import { useState, useEffect } from 'react';
import PathSetupModal from '../components/PathSetupModal';
import MultiStepForm from '../components/MultiStepForm';

export default function Dashboard() {
    const [showPathModal, setShowPathModal] = useState(false);
    const [certificatePath, setCertificatePath] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        checkPathSetting();
    }, []);

    const checkPathSetting = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();

            if (data.success && data.data.windows_certificate_path) {
                setCertificatePath(data.data.windows_certificate_path);
            } else {
                // Show modal after 5 seconds if path is not set
                setTimeout(() => {
                    setShowPathModal(true);
                }, 5000);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            // Show modal after 5 seconds on error
            setTimeout(() => {
                setShowPathModal(true);
            }, 5000);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePathSave = (path: string) => {
        setCertificatePath(path);
        setShowPathModal(false);
    };

    const handleChangePath = () => {
        setShowPathModal(true);
    };

    const handleStartNewProject = () => {
        setShowForm(true);
    };

    const handleFormComplete = () => {
        setShowForm(false);
        // Here you can add logic to handle form completion
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (showForm) {
        return <MultiStepForm />;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-gray-300">Manage your Laravel projects and SSL certificates</p>
                </div>

                {/* Path Status Card */}
                <div className="bg-[#ededed] rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-[#0a0a0a] mb-2">Certificate Path</h2>
                            {certificatePath ? (
                                <div>
                                    <p className="text-gray-700 mb-2">Current path:</p>
                                    <code className="bg-gray-200 px-3 py-1 rounded text-sm text-[#0a0a0a]">
                                        {certificatePath}
                                    </code>
                                </div>
                            ) : (
                                <p className="text-gray-600">No certificate path set</p>
                            )}
                        </div>

                        {certificatePath && (
                            <button
                                onClick={handleChangePath}
                                className="px-4 py-2 text-sm bg-[#0a0a0a] text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Change Path
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <button
                        onClick={handleStartNewProject}
                        className="bg-[#ededed] rounded-lg p-6 text-left hover:bg-gray-200 transition-colors group"
                    >
                        <div className="w-12 h-12 bg-[#0a0a0a] rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <i className="fa fa-plus text-white text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">New Project</h3>
                        <p className="text-gray-600 text-sm">Set up a new Laravel project with SSL</p>
                    </button>

                    <div className="bg-[#ededed] rounded-lg p-6 text-left">
                        <div className="w-12 h-12 bg-[#0a0a0a] rounded-lg flex items-center justify-center mb-3">
                            <i className="fa fa-list text-white text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">Project List</h3>
                        <p className="text-gray-600 text-sm">View and manage existing projects</p>
                    </div>

                    <div className="bg-[#ededed] rounded-lg p-6 text-left">
                        <div className="w-12 h-12 bg-[#0a0a0a] rounded-lg flex items-center justify-center mb-3">
                            <i className="fa fa-cog text-white text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">Settings</h3>
                        <p className="text-gray-600 text-sm">Configure application settings</p>
                    </div>
                </div>

                {/* Recent Projects */}
                <div className="bg-[#ededed] rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-[#0a0a0a] mb-4">Recent Projects</h2>
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-[#0a0a0a] rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <i className="fa fa-folder text-white text-3xl"></i>
                        </div>
                        <p className="text-gray-600">No projects yet. Create your first project to get started!</p>
                    </div>
                </div>
            </div>

            {/* Path Setup Modal */}
            <PathSetupModal
                isOpen={showPathModal}
                onClose={() => setShowPathModal(false)}
                onSave={handlePathSave}
            />
        </div>
    );
}
