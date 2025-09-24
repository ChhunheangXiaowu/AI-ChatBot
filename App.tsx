import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
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

const ChatInterface: React.FC = () => {
    const { currentUser } = useAuth();
    const storageKey = useMemo(() => `chatSessions_${currentUser?.uid}`, [currentUser]);
    
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    useEffect(() => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            setError("Configuration Error: The Gemini API key is missing. Please set the `API_KEY` environment variable.");
            return;
        }
        try {
            aiRef.current = new GoogleGenAI({ apiKey });
        } catch(e) {
            console.error(e);
            setError("Initialization Error: Failed to initialize Gemini AI. The API Key might be invalid or malformed.");
        }
    }, []);

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
                if (remainingSessions.length > 0) {
                    setActiveSessionId(remainingSessions[0].id);
                } else {
                    setActiveSessionId(null);
                }
            }
            
            return remainingSessions;
        });
    };

    const handleSendMessage = useCallback(async (userInput: string) => {
        if (!activeSessionId || isLoading) return;

        if (!aiRef.current) {
            setError("Gemini AI is not initialized. Please check your API Key configuration.");
            return;
        }

        const userMessage: Message = { role: 'user', content: userInput };

        const currentSessionForTitle = sessions.find(s => s.id === activeSessionId);
        const newTitle = (currentSessionForTitle?.messages.length ?? 0) === 0 
            ? userInput.substring(0, 35) + (userInput.length > 35 ? '...' : '') 
            : currentSessionForTitle?.title;

        const updatedSessionsWithUserMessage = sessions.map(s => 
            s.id === activeSessionId 
                ? { ...s, messages: [...s.messages, userMessage], title: newTitle as string } 
                : s
        );
        setSessions(updatedSessionsWithUserMessage);
        
        setIsLoading(true);
        setError(null);

        try {
            const ai = aiRef.current;
            const currentSessionForAPI = updatedSessionsWithUserMessage.find(s => s.id === activeSessionId);

            if (!currentSessionForAPI) {
                throw new Error("Active session not found for API call.");
            }

            const contents = currentSessionForAPI.messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            }));

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: { 
                    systemInstruction: "You are a helpful AI assistant. Your primary purpose is to provide the most accurate and up-to-date information possible. For every user query, you must use your web search tool to find the latest, real-world information. Synthesize the search results to give a comprehensive and factual answer. Your knowledge is not limited; it is constantly updated by the web.",
                    tools: [{ googleSearch: {} }] 
                },
            });
            
            const content = response.text;
            const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const sources = rawSources
                .map((s: any) => s.web)
                .filter(Boolean)
                .map((web: any) => ({ uri: web.uri, title: web.title }))
                .filter((s: any) => s.uri && s.title);

            const modelMessage: Message = { role: 'model', content, ...(sources.length > 0 && { sources }) };

            setSessions(prev => prev.map(s =>
                s.id === activeSessionId
                    ? { ...s, messages: [...s.messages, modelMessage] }
                    : s
            ));

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            console.error(e);
             if (errorMessage.toLowerCase().includes('api key not valid')) {
                setError('Gemini API Error: Your API key is not valid. Please ensure the `API_KEY` environment variable is set correctly.');
            } else {
                setError(`Error: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [activeSessionId, isLoading, sessions]);
    
    const activeSession = useMemo(() => {
        return sessions.find(s => s.id === activeSessionId);
    }, [sessions, activeSessionId]);

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

    return currentUser ? <ChatInterface /> : <LoginScreen />;
}


const App: React.FC = () => (
    <AuthProvider>
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    </AuthProvider>
);

export default App;