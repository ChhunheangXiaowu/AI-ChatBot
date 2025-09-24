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

const AppContent: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    useEffect(() => {
        // Initialize the GoogleGenAI client once on component mount.
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    }, []);

    useEffect(() => {
        // Load sessions from localStorage on initial load.
        try {
            const savedSessions = localStorage.getItem('chatSessions');
            if (savedSessions) {
                const parsedSessions: ChatSession[] = JSON.parse(savedSessions);
                setSessions(parsedSessions);
                if (parsedSessions.length > 0 && !activeSessionId) {
                    setActiveSessionId(parsedSessions[0].id);
                }
            }
        } catch (e) {
            console.error("Failed to load sessions from localStorage", e);
        }
    }, []); // Empty dependency array ensures this runs only once.

    useEffect(() => {
        // Save sessions to localStorage whenever they change.
        try {
            if (sessions.length > 0) {
                localStorage.setItem('chatSessions', JSON.stringify(sessions));
            } else {
                 // If all sessions are deleted, clear from storage
                if (localStorage.getItem('chatSessions')) {
                    localStorage.removeItem('chatSessions');
                }
            }
        } catch (e) {
            console.error("Failed to save sessions to localStorage", e);
        }
    }, [sessions]);
    
    useEffect(() => {
        // Auto-scroll to the latest message.
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
        if (!activeSessionId || isLoading || !aiRef.current) return;

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
            const currentSession = updatedSessionsWithUserMessage.find(s => s.id === activeSessionId);

            const history = (currentSession?.messages ?? [])
              .slice(0, -1)
              .map(msg => `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}`)
              .join('\n\n');

            const fullPrompt = history 
                ? `Given the conversation history:\n\n${history}\n\nAnswer the following question:\n${userInput}`
                : userInput;


            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: fullPrompt,
                config: { tools: [{ googleSearch: {} }] },
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
            setError(`Error: ${errorMessage}`);
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

const App: React.FC = () => (
    <LanguageProvider>
        <AppContent />
    </LanguageProvider>
);

export default App;