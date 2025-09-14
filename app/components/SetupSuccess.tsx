'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SetupSuccessProps {
    siteName: string;
    siteUrl: string;
    onClose: () => void;
}

export default function SetupSuccess({ siteName, siteUrl, onClose }: SetupSuccessProps) {
    const [countdown, setCountdown] = useState(10);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    router.push('/dashboard');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl border border-[#ededed] rounded-lg p-8 relative">
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

                {/* Success Content */}
                <div className="text-center">
                    {/* Success Icon */}
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fa fa-check text-green-600 text-4xl"></i>
                    </div>

                    {/* Success Message */}
                    <h1 className="text-4xl font-bold text-white mb-4">Setup Complete!</h1>
                    <p className="text-xl text-gray-300 mb-8">
                        Your Laravel site has been successfully configured
                    </p>

                    {/* Site Details */}
                    <div className="bg-[#ededed] rounded-lg p-6 mb-8 text-left">
                        <h2 className="text-xl font-semibold text-[#0a0a0a] mb-4">Site Information</h2>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <i className="fa fa-globe text-[#0a0a0a] mr-3"></i>
                                <span className="text-[#0a0a0a] font-medium">Site URL:</span>
                                <a
                                    href={siteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                >
                                    {siteUrl}
                                </a>
                            </div>
                            <div className="flex items-center">
                                <i className="fa fa-folder text-[#0a0a0a] mr-3"></i>
                                <span className="text-[#0a0a0a] font-medium">Site Name:</span>
                                <span className="ml-2 text-[#0a0a0a]">{siteName}</span>
                            </div>
                            <div className="flex items-center">
                                <i className="fa fa-shield-alt text-[#0a0a0a] mr-3"></i>
                                <span className="text-[#0a0a0a] font-medium">SSL Status:</span>
                                <span className="ml-2 text-green-600 font-semibold">Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">Next Steps</h3>
                        <ul className="text-blue-800 text-left space-y-2">
                            <li className="flex items-start">
                                <i className="fa fa-check-circle text-green-500 mr-2 mt-1"></i>
                                <span>Visit your site at <strong>{siteUrl}</strong></span>
                            </li>
                            <li className="flex items-start">
                                <i className="fa fa-check-circle text-green-500 mr-2 mt-1"></i>
                                <span>SSL certificate is automatically configured</span>
                            </li>
                            <li className="flex items-start">
                                <i className="fa fa-check-circle text-green-500 mr-2 mt-1"></i>
                                <span>Nginx is configured and running</span>
                            </li>
                            <li className="flex items-start">
                                <i className="fa fa-check-circle text-green-500 mr-2 mt-1"></i>
                                <span>Laravel permissions are set correctly</span>
                            </li>
                        </ul>
                    </div>

                    {/* Countdown */}
                    <div className="text-gray-400 mb-6">
                        <p>Redirecting to dashboard in <span className="text-white font-bold text-xl">{isClient ? countdown : '10'}</span> seconds...</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => window.open(siteUrl, '_blank')}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                            <i className="fa fa-external-link-alt mr-2"></i>
                            Visit Site
                        </button>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-6 py-3 bg-[#0a0a0a] text-white rounded-lg font-medium hover:bg-gray-800 transition-colors border border-white"
                        >
                            <i className="fa fa-tachometer-alt mr-2"></i>
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
