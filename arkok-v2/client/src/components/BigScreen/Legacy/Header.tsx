import React from 'react';

interface HeaderProps {
  wsConnected?: boolean;
}

const Header: React.FC<HeaderProps> = ({ wsConnected = false }) => {
  return (
    <header className="text-center flex-shrink-0 mb-2 flex items-center justify-between">
      <div />
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter flex-1">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          星途成长方舟
        </span>
      </h1>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-400">
          {wsConnected ? '数据同步中' : '离线'}
        </span>
      </div>
    </header>
  );
};

export default Header;