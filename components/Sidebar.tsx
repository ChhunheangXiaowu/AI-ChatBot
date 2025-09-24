import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChatSession } from '../types';

const NewChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ThreeDotsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


interface SidebarProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    onNewChat: () => void;
    onSelectSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ sessions, activeSessionId, onNewChat, onSelectSession, onDeleteSession, isOpen }) => {
    const { t, language, setLanguage } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [menuOpenForSession, setMenuOpenForSession] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenForSession(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const filteredSessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.id.localeCompare(a.id));

    return (
        <aside className={`absolute md:relative inset-y-0 left-0 bg-slate-800 text-slate-200 w-72 p-4 flex flex-col transform transition-transform duration-300 ease-in-out z-20 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
            <button
                onClick={onNewChat}
                className="flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 space-x-2 mb-4"
            >
                <NewChatIcon />
                <span>{t('newChat')}</span>
            </button>

            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder={t('search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon />
                </div>
            </div>

            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('chatHistory')}</h2>
            <nav className="flex-1 overflow-y-auto pr-1 -mr-1">
                <ul className="space-y-1">
                    {filteredSessions.map(session => (
                        <li key={session.id} className="relative">
                             <div className={`flex items-center justify-between group rounded-md transition-colors duration-150 ${activeSessionId === session.id ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); onSelectSession(session.id); }}
                                    className={`block flex-1 p-2 truncate ${activeSessionId === session.id ? 'font-semibold' : ''}`}
                                >
                                    {session.title}
                                </a>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpenForSession(menuOpenForSession === session.id ? null : session.id);
                                    }}
                                    className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                    aria-haspopup="true"
                                    aria-expanded={menuOpenForSession === session.id}
                                    aria-label={`More options for chat titled ${session.title}`}
                                >
                                    <ThreeDotsIcon />
                                </button>
                            </div>
                            {menuOpenForSession === session.id && (
                                <div ref={menuRef} className="absolute right-2 top-full mt-1 w-36 bg-slate-900 border border-slate-700 rounded-md shadow-lg z-10 p-1">
                                    <ul role="menu">
                                        <li>
                                            <button
                                                role="menuitem"
                                                onClick={() => {
                                                    onDeleteSession(session.id);
                                                    setMenuOpenForSession(null);
                                                }}
                                                className="flex items-center w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-slate-700 rounded-md transition-colors"
                                            >
                                                <TrashIcon />
                                                <span className="ml-2">Delete Chat</span>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-700">
                <label htmlFor="language-select" className="block text-sm font-medium text-slate-400 mb-2">{t('language')}</label>
                <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'en' | 'km')}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="en">{t('english')}</option>
                    <option value="km">{t('khmer')}</option>
                </select>
            </div>
        </aside>
    );
};

export default Sidebar;