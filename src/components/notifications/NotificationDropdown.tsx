import React from 'react';
import { Bell, Trophy, UserPlus, Flame, CheckCheck, X } from 'lucide-react';
import type { NotificationItem } from '../../types/game';
import { sounds } from '../../utils/soundEffects';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onAcceptInvite: (id: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onAcceptInvite,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'rank': return <Trophy className="w-4 h-4 text-blue-600" />;
      case 'invite': return <UserPlus className="w-4 h-4 text-orange-500" />;
      case 'reward': return <Flame className="w-4 h-4 text-amber-500" />;
      case 'match': return <Trophy className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 sm:pr-8 pointer-events-none">
      {/* Invisible backdrop for dismissal */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs pointer-events-auto"
        onClick={onClose}
      />

      {/* Floating Card */}
      <div className="pointer-events-auto relative w-full max-w-sm mt-16 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-black text-slate-800 font-tech uppercase tracking-wide">
              Notifications
            </h4>
            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-tech">
              {notifications.filter((n) => !n.read).length} New
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                sounds.playClick();
                onMarkAllRead();
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`p-3.5 flex items-start space-x-3 transition-colors ${
                notif.read ? 'bg-white opacity-70' : 'bg-blue-50/30'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h5 className="text-xs font-bold text-slate-800 truncate">
                    {notif.title}
                  </h5>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {notif.timeAgo}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {notif.message}
                </p>

                {notif.type === 'invite' && (
                  <div className="mt-2 flex items-center space-x-2">
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onAcceptInvite(notif.id);
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase font-tech tracking-wider cursor-pointer shadow-xs"
                    >
                      Join Party
                    </button>
                    <button
                      onClick={onClose}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
