'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const [isAnimating, setIsAnimating] = useState(false);
    const router = useRouter();

    const handleGetStarted = () => {
        setIsAnimating(true);

        // Add a small delay for the animation to complete
        setTimeout(() => {
            router.push('/dashboard');
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="text-center max-w-2xl mx-auto">
                {/* Main heading with animation */}
                <div className={`transition-all duration-1000 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
                    <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
                        Laravel Local
                        <span className="block text-[#ededed]">Hosting</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
                        Set up your Laravel projects with SSL certificates
                        <br />
                        in your local development environment
                    </p>
                </div>

                {/* Get Started Button with animation */}
                <div className={`transition-all duration-1000 delay-300 ${isAnimating ? 'opacity-0 transform translate-y-8' : 'opacity-100 transform translate-y-0'}`}>
                    <button
                        onClick={handleGetStarted}
                        disabled={isAnimating}
                        className={`
              group relative px-12 py-4 bg-[#0a0a0a] text-white text-xl font-semibold 
              rounded-lg border-2 border-white transition-all duration-300
              hover:bg-white hover:text-[#0a0a0a] hover:scale-105 hover:shadow-2xl
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              ${isAnimating ? 'animate-pulse' : ''}
            `}
                    >
                        <span className="relative z-10">Get Started</span>

                        {/* Animated background effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ededed] to-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Loading animation when clicked */}
                        {isAnimating && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </button>
                </div>

                {/* Feature highlights */}
                <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-500 ${isAnimating ? 'opacity-0 transform translate-y-8' : 'opacity-100 transform translate-y-0'}`}>
                    <div className="bg-[#ededed] rounded-lg p-6 text-[#0a0a0a]">
                        <div className="w-12 h-12 bg-[#0a0a0a] rounded-lg flex items-center justify-center mb-3">
                            <i className="fa fa-bolt text-white text-2xl"></i>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Quick Setup</h3>
                        <p className="text-sm">Get your Laravel project running in minutes</p>
                    </div>

                    <div className="bg-[#ededed] rounded-lg p-6 text-[#0a0a0a]">
                        <div className="w-12 h-12 bg-[#0a0a0a] rounded-lg flex items-center justify-center mb-3">
                            <i className="fa fa-lock text-white text-2xl"></i>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">SSL Certificates</h3>
                        <p className="text-sm">Automatic SSL certificate generation</p>
                    </div>

                    <div className="bg-[#ededed] rounded-lg p-6 text-[#0a0a0a]">
                        <div className="w-12 h-12 bg-[#0a0a0a] rounded-lg flex items-center justify-center mb-3">
                            <i className="fa fa-cogs text-white text-2xl"></i>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Easy Management</h3>
                        <p className="text-sm">Simple dashboard for project management</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
