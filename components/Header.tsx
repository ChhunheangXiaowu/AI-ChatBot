
import React from 'react';
import BotIcon from './icons/BotIcon';
import ProfileDropdown from './ProfileDropdown';

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

interface HeaderProps {
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4 flex items-center justify-between shadow-lg sticky top-0 z-10">
       <div className="flex-1">
         <button onClick={onToggleSidebar} className="md:hidden p-2 -ml-2 rounded-md hover:bg-slate-700 transition-colors">
            <MenuIcon />
        </button>
       </div>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 text-sky-400">
           <BotIcon />
        </div>
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
          Gemini AI Chat Bot
        </h1>
      </div>
      <div className="flex-1 flex justify-end">
        <ProfileDropdown />
      </div>
    </header>
  );
};

export default Header;
