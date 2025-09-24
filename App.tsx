import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Content } from '@google/genai';
import { Message, ChatSession } from './types';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import WelcomeScreen from './components/WelcomeScreen';
import Sidebar from './components/Sidebar';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';

const MainApp: React.FC = () => {
    const { currentUser } = useAuth();
    const storageKey = useMemo(() => `chatSessions_${currentUser?.uid}`, [currentUser]);

    const [apiKeyError, setApiKeyError] = useState<string | null>(null);
    const ai = useMemo(() => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            setApiKeyError('Configuration Error: The Gemini API key is not set. Please configure the API_KEY environment variable.');
            return null;
        }
        setApiKeyError(null);
        return new GoogleGenAI({ apiKey });
    }, []);

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!currentUser) return;
        try {
            const savedSessions = localStorage.getItem(storageKey);
            if (savedSessions) {
                const parsedSessions: ChatSession[] = JSON.parse(savedSessions);
                setSessions(parsedSessions);
                if (parsedSessions.length > 0) {
                    setActiveSessionId(parsedSessions[0].id);
                } else {
                    setActiveSessionId(null);
                }
            } else {
                setSessions([]);
                setActiveSessionId(null);
            }
        } catch (e) {
            console.error("Failed to load sessions from localStorage", e);
            setSessions([]);
            setActiveSessionId(null);
        }
    }, [currentUser, storageKey]);

    useEffect(() => {
        if (!currentUser) return;
        try {
            if (sessions.length > 0) {
                localStorage.setItem(storageKey, JSON.stringify(sessions));
            } else {
                if (localStorage.getItem(storageKey)) {
                    localStorage.removeItem(storageKey);
                }
            }
        } catch (e) {
            console.error("Failed to save sessions to localStorage", e);
        }
    }, [sessions, currentUser, storageKey]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [sessions, activeSessionId, isLoading]);

    const handleNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setError(null);
        setIsSidebarOpen(false);
    };

    const handleSelectSession = (id: string) => {
        setActiveSessionId(id);
        setError(null);
        setIsSidebarOpen(false);
    };

    const handleDeleteSession = (id: string) => {
        setSessions(prev => {
            const remainingSessions = prev.filter(s => s.id !== id);
            if (activeSessionId === id) {
                setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
            }
            return remainingSessions;
        });
    };

    const handleSendMessage = useCallback(async (userInput: string) => {
        if (!activeSessionId || isLoading || !ai) {
            if (!ai) setError(apiKeyError);
            return;
        }

        const userMessage: Message = { role: 'user', content: userInput };
        const currentSession = sessions.find(s => s.id === activeSessionId);
        const newTitle = (currentSession?.messages.length ?? 0) === 0
            ? userInput.substring(0, 35) + (userInput.length > 35 ? '...' : '')
            : currentSession?.title;

        setSessions(sessions.map(s =>
            s.id === activeSessionId
                ? { ...s, messages: [...s.messages, userMessage], title: newTitle as string }
                : s
        ));

        setIsLoading(true);
        setError(null);

        try {
            const conversationHistory = (currentSession?.messages || []).map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            })) as Content[];

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [...conversationHistory, { role: 'user', parts: [{ text: userInput }] }],
            });

            const modelMessage: Message = { role: 'model', content: response.text };

            setSessions(prev => prev.map(s =>
                s.id === activeSessionId
                    ? { ...s, messages: [...s.messages, modelMessage] }
                    : s
            ));
        } catch (e: any) {
            console.error("Gemini API Error:", e);
            const errorMessage = e.message || 'An unexpected error occurred.';
            setError(`An error occurred: ${errorMessage}. Please check the API key and configuration.`);
        } finally {
            setIsLoading(false);
        }
    }, [activeSessionId, isLoading, sessions, ai, apiKeyError]);

    const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);

    if (apiKeyError) {
        return (
            <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 p-4 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Application Error</h1>
                <p className="max-w-md">{apiKeyError}</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
            <Sidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onNewChat={handleNewChat}
                onSelectSession={handleSelectSession}
                onDeleteSession={handleDeleteSession}
                isOpen={isSidebarOpen}
            />
            <div className="flex-1 flex flex-col relative">
                {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/50 z-10 md:hidden"></div>}
                <main className="flex-1 flex flex-col overflow-hidden">
                    <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                    {error && (
                        <div className="bg-red-500/50 text-white p-3 text-center text-sm flex-shrink-0">
                            {error}
                        </div>
                    )}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                        {activeSession && activeSession.messages.length > 0 ? (
                            activeSession.messages.map((msg, index) => (
                                <ChatMessage key={`${activeSessionId}-${index}`} message={msg} />
                            ))
                        ) : (
                            (activeSessionId && !isLoading) && <WelcomeScreen onPromptClick={(prompt) => handleSendMessage(prompt)} />
                        )}
                        {isLoading && <TypingIndicator />}
                    </div>
                    <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading || !activeSessionId} />
                </main>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen bg-slate-900 flex items-center justify-center text-slate-100">
                <p>Loading...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginScreen />;
    }

    return <MainApp />;
}

const App: React.FC = () => (
    <AuthProvider>
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    </AuthProvider>
);

export default App;
