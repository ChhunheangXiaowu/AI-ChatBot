import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

        // Mock AI Response - no API key needed
        setTimeout(() => {
            const modelMessage: Message = {
                role: 'model',
                content: `This is a mock response as the Gemini API has been disconnected.\n\nYou said: "${userInput}"`
            };

            setSessions(prev => prev.map(s =>
                s.id === activeSessionId
                    ? { ...s, messages: [...s.messages, modelMessage] }
                    : s
            ));
            setIsLoading(false);
        }, 1200);

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