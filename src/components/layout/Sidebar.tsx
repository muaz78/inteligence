import React from 'react';
import { 
  Home, 
  Trophy, 
  Zap, 
  Flame, 
  Award, 
  User, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Globe2,
  Sparkles
} from 'lucide-react';
import type { NavigationTab } from '../../types/game';
import { sounds } from '../../utils/soundEffects';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onlineFriendsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  onlineFriendsCount,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    { id: 'home', label: 'Home Lobby', icon: <Home className="w-5 h-5" /> },
    { id: 'ranked', label: 'Ranked Arena', icon: <Trophy className="w-5 h-5" />, badge: '+25 RP', badgeColor: 'bg-blue-100 text-blue-700' },
    { id: 'quickplay', label: 'Quick Play', icon: <Zap className="w-5 h-5" /> },
    { id: 'daily', label: 'Daily Challenge', icon: <Flame className="w-5 h-5" />, badge: '🔥 7x', badgeColor: 'bg-orange-100 text-orange-700' },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Award className="w-5 h-5" /> },
    { id: 'profile', label: 'Player Career', icon: <User className="w-5 h-5" /> },
    { 
      id: 'friends', 
      label: 'Friends & Party', 
      icon: <Users className="w-5 h-5" />, 
      badge: onlineFriendsCount > 0 ? `${onlineFriendsCount}` : undefined, 
      badgeColor: 'bg-emerald-100 text-emerald-700' 
    },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    sounds.playClick();
    onTabChange(tab);
  };

  return (
    <aside
      className={`relative z-30 flex flex-col bg-white border-r border-slate-200/80 shadow-[4px_0_24px_-4px_rgba(32,40,58,0.04)] transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center px-4 border-b border-slate-100">
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center space-x-3 text-left w-full overflow-hidden group cursor-pointer"
        >
          {/* Animated Esports Globe Icon */}
          <div className="relative shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-[#3478F6] to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Globe2 className="w-6 h-6 animate-spin [animation-duration:18s]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full border-2 border-white" />
          </div>

          {!collapsed && (
            <div className="flex flex-col truncate">
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-black tracking-tight text-slate-800 font-tech">
                  COUNTRY<span className="text-blue-600">RUSH</span>
                </span>
                <span className="text-[9px] font-extrabold uppercase bg-orange-500 text-white px-1.5 py-0.2 rounded-md tracking-wider">
                  S1
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase font-tech">
                Competitive Geo
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              onMouseEnter={() => sounds.playHover()}
              className={`relative flex items-center w-full px-3.5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-50 via-blue-50/80 to-transparent text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {/* Active Left Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-blue-600 to-indigo-500 rounded-r-full shadow-sm" />
              )}

              {/* Icon */}
              <span 
                className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'
                }`}
              >
                {item.icon}
              </span>

              {/* Label & Badges (shown when expanded) */}
              {!collapsed && (
                <div className="ml-3 flex-1 flex items-center justify-between truncate">
                  <span className={`truncate ${isActive ? 'font-black text-slate-900 font-tech text-base tracking-wide' : 'font-semibold'}`}>
                    {item.label}
                  </span>

                  {item.badge && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-tight ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Floating Tooltip in Collapsed Mode */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                  {item.badge && <span className="ml-1.5 text-orange-400 font-normal">({item.badge})</span>}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Season Pass Promo Widget (when expanded) */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-2 rounded-2xl bg-gradient-to-br from-indigo-50 via-blue-50 to-orange-50/50 border border-indigo-100/70">
          <div className="flex items-center space-x-2 text-indigo-700 mb-1">
            <Sparkles className="w-4 h-4 text-orange-500 animate-spin [animation-duration:12s]" />
            <span className="text-xs font-black uppercase font-tech tracking-wider">Season Pass Tier 34</span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-2 mb-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full w-[68%]" />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
            <span>Reward: Cyber Flag Banner</span>
            <span className="text-blue-600">680/1000 XP</span>
          </div>
        </div>
      )}

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-full py-2 px-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-xs font-bold font-tech"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-slate-500" />
          ) : (
            <div className="flex items-center space-x-2 w-full justify-center">
              <ChevronLeft className="w-4 h-4" />
              <span>COLLAPSE MENU</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
