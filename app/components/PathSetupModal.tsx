'use client';

import { useState } from 'react';

interface PathSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (path: string) => void;
}

export default function PathSetupModal({ isOpen, onClose, onSave }: PathSetupModalProps) {
    const [path, setPath] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!path.trim()) return;

        setIsLoading(true);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key: 'windows_certificate_path',
                    value: path.trim()
                }),
            });

            onSave(path.trim());
            onClose();
        } catch (error) {
            console.error('Failed to save path:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#ededed] rounded-lg p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-[#0a0a0a] mb-2">Setup Required</h2>
                    <p className="text-gray-600">Please set your Windows certificate storage path</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="certificatePath" className="block text-sm font-medium text-gray-700 mb-2">
                            Windows Certificate Path
                        </label>
                        <input
                            type="text"
                            id="certificatePath"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            placeholder="C:\Users\YourName\certificates"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a0a0a] focus:border-transparent outline-none text-gray-900"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter the Windows path where SSL certificates will be stored
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!path.trim() || isLoading}
                            className="flex-1 px-4 py-2 bg-[#0a0a0a] text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : 'Save Path'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
