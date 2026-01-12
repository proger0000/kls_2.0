import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export const DebugOverlay = () => {
  const { session, profile, initialHydrated, profileLoading, profileError } = useAuth();
  const { debugMode } = useSettings();
  const [minimized, setMinimized] = useState(false);

  // Если выключено в настройках — не рендерим ничего
  if (!debugMode) return null;

  if (minimized) return (
    <button
      onClick={() => setMinimized(false)}
      className="fixed bottom-0 right-0 bg-red-600 text-white text-[10px] px-3 py-1 z-[100] rounded-tl-md font-mono opacity-50 hover:opacity-100 transition-opacity"
    >
      DEBUG
    </button>
  );

  return (
    <div className="fixed bottom-4 left-4 z-[100] bg-gray-900/95 backdrop-blur-md text-green-400 p-4 rounded-xl text-[10px] font-mono border border-green-500/20 shadow-2xl min-w-[220px] animate-fade-in-up">
      <div className="flex justify-between items-center mb-3 border-b border-gray-700/50 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-bold text-white tracking-widest">SYSTEM STATE</span>
        </div>
        <button onClick={() => setMinimized(true)} className="text-gray-500 hover:text-white transition-colors">✕</button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between border-b border-gray-800 pb-1">
          <span className="text-gray-400">Hydrated:</span>
          <span className={initialHydrated ? "text-green-400 font-bold" : "text-red-400"}>{String(initialHydrated)}</span>
        </div>
        <div className="flex justify-between border-b border-gray-800 pb-1">
          <span className="text-gray-400">Fetching:</span>
          <span className={profileLoading ? "text-yellow-400 font-bold" : "text-gray-600"}>{String(profileLoading)}</span>
        </div>
        {profileError && (
          <div className="p-2 bg-red-900/20 rounded border border-red-900/50 text-red-300 mt-1">
            Error: {profileError}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-gray-500 text-[9px] uppercase tracking-wider mb-1">Session User</div>
        <div className="truncate text-gray-300 bg-gray-800/50 p-1 rounded">{session ? session.user.email : "❌ NULL"}</div>
      </div>

      <div className="mt-2">
        <div className="text-gray-500 text-[9px] uppercase tracking-wider mb-1">Profile Role</div>
        <div className="truncate text-gray-300 bg-gray-800/50 p-1 rounded">
          {profile ? (
            <span className="text-brand-400">{profile.role?.toUpperCase() || "N/A"} <span className="text-gray-500 text-[8px]">(ID:{profile.id})</span></span>
          ) : profileLoading ? "⏳ LOADING..." : "❌ NULL"}
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-gray-700/50 grid grid-cols-2 gap-2">
        <button
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          className="bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-800/30 rounded py-1.5 text-[9px] font-bold transition-colors"
        >
          RESET DATA
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded py-1.5 text-[9px] font-bold transition-colors"
        >
          RELOAD
        </button>
      </div>
    </div>
  );
};