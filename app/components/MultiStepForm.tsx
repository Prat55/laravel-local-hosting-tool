'use client';

import { useState, useEffect } from 'react';
import SetupLogger from './SetupLogger';
import SetupSuccess from './SetupSuccess';

interface FormData {
    projectName: string;
    wslDirectoryPath: string;
    certificatePath: string;
}

export default function MultiStepForm() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({
        projectName: '',
        wslDirectoryPath: '',
        certificatePath: ''
    });
    const [certificatePathExists, setCertificatePathExists] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [showLogger, setShowLogger] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [currentSiteId, setCurrentSiteId] = useState<number | null>(null);
    const [currentSiteName, setCurrentSiteName] = useState<string>('');
    const [currentSiteUrl, setCurrentSiteUrl] = useState<string>('');

    useEffect(() => {
        setIsClient(true);
        checkCertificatePath();
    }, []);

    const checkCertificatePath = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();

            if (data.success && data.data.windows_certificate_path) {
                setCertificatePathExists(true);
                setFormData(prev => ({
                    ...prev,
                    certificatePath: data.data.windows_certificate_path
                }));
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getTotalSteps = () => {
        return certificatePathExists ? 2 : 3;
    };

    const handleNext = () => {
        const totalSteps = getTotalSteps();
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);

            // Submit form data to create site
            const response = await fetch('/api/sites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    siteName: formData.projectName,
                    sitePath: formData.wslDirectoryPath
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCurrentSiteId(data.data.siteId);
                setCurrentSiteName(data.data.siteName);
                setShowLogger(true);
            } else {
                console.error('Failed to create site:', data.error);
                alert('Failed to start setup: ' + data.error);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred while starting the setup process');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetupComplete = (siteUrl: string) => {
        setCurrentSiteUrl(siteUrl);
        setShowLogger(false);
        setShowSuccess(true);
    };

    const handleCloseLogger = () => {
        setShowLogger(false);
        // Reset form or go back to dashboard
        window.history.back();
    };

    const handleCloseSuccess = () => {
        setShowSuccess(false);
        window.history.back();
    };

    const renderStep = () => {
        if (!isClient || isLoading) {
            return (
                <div className="space-y-6">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h1 className="text-3xl font-bold text-white mb-4">Loading...</h1>
                        <p className="text-lg text-gray-300">Checking your configuration</p>
                    </div>
                </div>
            );
        }

        const totalSteps = getTotalSteps();
        let stepToRender = currentStep;

        // If certificate path exists, adjust step numbers
        if (certificatePathExists && currentStep === 3) {
            stepToRender = 2; // Skip certificate step
        }

        switch (stepToRender) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-white mb-4">Project Setup</h1>
                            <p className="text-lg text-gray-300">Let's get started with your Laravel project configuration</p>
                        </div>

                        <div className="bg-[#ededed] rounded-lg p-8 max-w-md mx-auto">
                            <div className="space-y-4">
                                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    id="projectName"
                                    value={formData.projectName}
                                    onChange={(e) => handleInputChange('projectName', e.target.value)}
                                    placeholder="Enter your project name (without domain extension)"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a0a0a] focus:border-transparent outline-none text-gray-900"
                                />
                                <p className="text-xs text-gray-500">
                                    Enter only the project name without .com, .in, .test, etc.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                if (certificatePathExists) {
                    // This is the final step when certificate path exists
                    return (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-white mb-4">WSL Directory Path</h1>
                                <p className="text-lg text-gray-300">Specify the directory path in your WSL environment</p>
                            </div>

                            <div className="bg-[#ededed] rounded-lg p-8 max-w-md mx-auto">
                                <div className="space-y-4">
                                    <label htmlFor="wslDirectoryPath" className="block text-sm font-medium text-gray-700">
                                        WSL Directory Path
                                    </label>
                                    <input
                                        type="text"
                                        id="wslDirectoryPath"
                                        value={formData.wslDirectoryPath}
                                        onChange={(e) => handleInputChange('wslDirectoryPath', e.target.value)}
                                        placeholder="/home/username/projects/your-project"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a0a0a] focus:border-transparent outline-none text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Enter the full path where your project will be located in WSL
                                    </p>
                                </div>
                            </div>

                            {/* Show certificate path info */}
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg max-w-md mx-auto">
                                <div className="flex items-center">
                                    <i className="fa fa-check-circle mr-2"></i>
                                    <span className="text-sm">
                                        Certificate path already configured: <code className="bg-green-200 px-1 rounded">{formData.certificatePath}</code>
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                } else {
                    // This is the WSL directory step when certificate path doesn't exist
                    return (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-white mb-4">WSL Directory Path</h1>
                                <p className="text-lg text-gray-300">Specify the directory path in your WSL environment</p>
                            </div>

                            <div className="bg-[#ededed] rounded-lg p-8 max-w-md mx-auto">
                                <div className="space-y-4">
                                    <label htmlFor="wslDirectoryPath" className="block text-sm font-medium text-gray-700">
                                        WSL Directory Path
                                    </label>
                                    <input
                                        type="text"
                                        id="wslDirectoryPath"
                                        value={formData.wslDirectoryPath}
                                        onChange={(e) => handleInputChange('wslDirectoryPath', e.target.value)}
                                        placeholder="/home/username/projects/your-project"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a0a0a] focus:border-transparent outline-none text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Enter the full path where your project will be located in WSL
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                }

            case 3:
                // This is only reached when certificate path doesn't exist
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-white mb-4">Certificate Storage</h1>
                            <p className="text-lg text-gray-300">Choose where to store SSL certificates on Windows</p>
                        </div>

                        <div className="bg-[#ededed] rounded-lg p-8 max-w-md mx-auto">
                            <div className="space-y-4">
                                <label htmlFor="certificatePath" className="block text-sm font-medium text-gray-700">
                                    Windows Certificate Path
                                </label>
                                <input
                                    type="text"
                                    id="certificatePath"
                                    value={formData.certificatePath}
                                    onChange={(e) => handleInputChange('certificatePath', e.target.value)}
                                    placeholder="C:\Users\YourName\certificates"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a0a0a] focus:border-transparent outline-none text-gray-900"
                                />
                                <p className="text-xs text-gray-500">
                                    Enter the Windows path where SSL certificates will be stored
                                </p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Show success page
    if (showSuccess) {
        return (
            <SetupSuccess
                siteName={currentSiteName}
                siteUrl={currentSiteUrl}
                onClose={handleCloseSuccess}
            />
        );
    }

    // Show logger
    if (showLogger && currentSiteId) {
        return (
            <SetupLogger
                siteId={currentSiteId}
                siteName={currentSiteName}
                onComplete={handleSetupComplete}
                onClose={handleCloseLogger}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl border border-[#ededed] rounded-lg p-8 relative">
                {/* Exit Button */}
                <div className="absolute top-4 right-4 group">
                    <button
                        onClick={() => window.history.back()}
                        className="w-10 h-10 bg-[#ededed] text-black rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 border border-[#ededed] hover:border-red-500 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
                    >
                        <i className="fa fa-times text-lg"></i>
                    </button>
                    {/* Tooltip */}
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Exit Setup
                        <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                </div>

                {renderStep()}

                <div className="flex justify-between mt-8 max-w-md mx-auto">
                    {currentStep > 1 && (
                        <button
                            onClick={handlePrevious}
                            className="px-6 py-3 bg-[#ededed] text-[#0a0a0a] rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            Previous
                        </button>
                    )}

                    <div className="ml-auto">
                        {currentStep < getTotalSteps() ? (
                            <button
                                onClick={handleNext}
                                disabled={!formData.projectName && currentStep === 1 ||
                                    !formData.wslDirectoryPath && currentStep === 2}
                                className="px-6 py-3 bg-[#0a0a0a] text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.wslDirectoryPath || (!certificatePathExists && !formData.certificatePath) || isLoading}
                                className="px-6 py-3 bg-[#0a0a0a] text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white"
                            >
                                {isLoading ? 'Starting...' : 'Start Setup'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
