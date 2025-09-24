import React, { useState } from 'react';
import BotIcon from './icons/BotIcon';

interface ApiKeyModalProps {
    onSubmit: (apiKey: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSubmit }) => {
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim()) {
            onSubmit(apiKey.trim());
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md mx-auto bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-700">
                <div className="flex flex-col items-center mb-6 text-center">
                    <div className="w-16 h-16 text-sky-400 mb-4">
                        <BotIcon />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100">Enter Your Gemini API Key</h1>
                    <p className="text-slate-400 mt-2">
                        To use this chat application, you need to provide your own Google Gemini API key.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
                            Gemini API Key
                        </label>
                        <input
                            id="apiKey"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full bg-slate-700 text-slate-100 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 rounded-lg"
                            placeholder="Enter your API key here"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!apiKey.trim()}
                    >
                        Save and Continue
                    </button>
                </form>

                <div className="text-center mt-6">
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sky-400 hover:text-sky-300 hover:underline"
                    >
                        Get your Gemini API key from Google AI Studio
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
