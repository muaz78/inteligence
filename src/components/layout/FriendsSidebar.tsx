import React, { useState } from 'react';
import { UserPlus, Check, MessageSquare, Gamepad2, Search } from 'lucide-react';
import type { Friend } from '../../types/game';
import { AnimeAvatar } from '../common/AnimeAvatar';
import { sounds } from '../../utils/soundEffects';

interface FriendsSidebarProps {
  friends: Friend[];
  onInviteFriend: (id: string) => void;
  onOpenChat?: (friend: Friend) => void;
  onAddFriendPrompt: () => void;
}

export const FriendsSidebar: React.FC<FriendsSidebarProps> = ({
  friends,
  onInviteFriend,
  onAddFriendPrompt,
}) => {
  const [filter, setFilter] = useState<'all' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFriends = friends.filter((f) => {
    const matchesSearch = f.username.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'online') {
      return matchesSearch && f.status !== 'offline';
    }
    return matchesSearch;
  });

  const onlineCount = friends.filter((f) => f.status !== 'offline').length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Gamepad2 className="w-5 h-5 text-blue-600" />
          <h4 className="text-base font-black text-slate-800 font-tech uppercase tracking-wide">
            Friends List
          </h4>
          <span className="text-xs font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-tech">
            {onlineCount}/{friends.length}
          </span>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onAddFriendPrompt();
          }}
          className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
          title="Add Friend"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative my-3">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          placeholder="Filter friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors font-medium"
        />
      </div>

      {/* Online / All Filter Tabs */}
      <div className="flex space-x-1.5 mb-3 bg-slate-100/80 p-1 rounded-xl">
        <button
          onClick={() => {
            sounds.playHover();
            setFilter('all');
          }}
          className={`flex-1 py-1 text-xs font-black uppercase font-tech rounded-lg transition-all cursor-pointer ${
            filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All ({friends.length})
        </button>
        <button
          onClick={() => {
            sounds.playHover();
            setFilter('online');
          }}
          className={`flex-1 py-1 text-xs font-black uppercase font-tech rounded-lg transition-all cursor-pointer ${
            filter === 'online' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Online ({onlineCount})
        </button>
      </div>

      {/* Friends List Container */}
      <div className="space-y-2 overflow-y-auto flex-1 pr-0.5 max-h-[380px]">
        {filteredFriends.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 font-medium">
            No friends found
          </div>
        ) : (
          filteredFriends.map((friend) => {
            const isOnline = friend.status !== 'offline';
            return (
              <div
                key={friend.id}
                className="group flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <AnimeAvatar 
                    seed={friend.avatarSeed} 
                    size="sm" 
                    status={friend.status}
                    rankTier={friend.rankTier}
                  />
                  <div className="flex flex-col min-w-0 truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-black text-slate-800 font-tech truncate">
                        {friend.username}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        #{friend.tag}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate font-medium">
                      {friend.activityText}
                    </span>
                  </div>
                </div>

                {/* Simulated Interaction: Invite to Party */}
                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  {isOnline ? (
                    <button
                      onClick={() => onInviteFriend(friend.id)}
                      disabled={friend.invited}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase font-tech tracking-wider transition-all cursor-pointer ${
                        friend.invited
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 shadow-xs'
                      }`}
                      title={friend.invited ? 'Invitation Sent' : 'Invite to Party'}
                    >
                      {friend.invited ? (
                        <span className="flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Sent</span>
                        </span>
                      ) : (
                        'Invite'
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={() => sounds.playClick()}
                      className="p-1.5 text-slate-300 hover:text-slate-500 rounded-lg"
                      title="Send offline message"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
