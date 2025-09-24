import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BotIcon from './icons/BotIcon';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.37 44 30.024 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);

const GithubIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
);


const LoginScreen: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<'' | 'google' | 'github'>('');
    const { socialLogin } = useAuth();

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        setError(null);
        setLoading(provider);
        try {
            await socialLogin(provider);
        } catch (err: any) {
            if (err.code === 'auth/operation-not-allowed') {
                setError('Sign-in method is not enabled. Please enable it in your Firebase console (Authentication > Sign-in method).');
            } else {
                setError(err.message || 'An unexpected error occurred during sign-in.');
            }
        } finally {
            setLoading('');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-sm mx-auto bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 text-sky-400 mb-4">
                        <BotIcon />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100">Welcome to Gemini Chat</h1>
                    <p className="text-slate-400 mt-1">Sign in to continue</p>
                </div>

                {error && <p className="bg-red-500/20 text-red-400 text-sm text-center p-3 rounded-lg mb-4">{error}</p>}

                <div className="space-y-4">
                    <button 
                        onClick={() => handleSocialLogin('google')}
                        disabled={!!loading}
                        className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GoogleIcon />
                        {loading === 'google' ? 'Signing in...' : 'Continue with Google'}
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('github')}
                        disabled={!!loading}
                        className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GithubIcon />
                         {loading === 'github' ? 'Signing in...' : 'Continue with GitHub'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;