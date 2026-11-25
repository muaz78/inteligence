import React, { useState } from 'react';
import { Users, UserPlus, Check, MessageSquare, Search, Swords, Shield, Sparkles } from 'lucide-react';
import type { Friend, PlayerProfile } from '../../types/game';
import { AnimeAvatar } from '../common/AnimeAvatar';
import { RankBadge } from '../common/RankBadge';
import { Button } from '../common/Button';
import { sounds } from '../../utils/soundEffects';

interface FriendsViewProps {
  friends: Friend[];
  player: PlayerProfile;
  onInviteFriend: (id: string) => void;
  onAddFriend: (username: string) => void;
  onChallengeFriend: (friend: Friend) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  friends,
  player,
  onInviteFriend,
  onAddFriend,
  onChallengeFriend,
}) => {
  const [search, setSearch] = useState('');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState(false);

  const filtered = friends.filter((f) => 
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendInput.trim()) return;
    sounds.playClick();
    onAddFriend(newFriendInput.trim());
    setNewFriendInput('');
    setAddFriendSuccess(true);
    setTimeout(() => setAddFriendSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase font-tech tracking-wider">
            <Users className="w-4 h-4 text-white" />
            <span>Social Hub & Party Squad</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-tech uppercase tracking-wide">
            Friends & Rivals
          </h1>
          <p className="text-sm text-blue-100 font-medium">
            Form competitive duos for Ranked 2v2 or launch private 1v1 scrimmages against your cartographer crew.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Friends List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-800 font-tech uppercase tracking-wide">
                Your Network ({friends.length})
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {friends.filter((f) => f.status !== 'offline').length} players currently online
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search friend list..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((friend) => (
              <div
                key={friend.id}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center space-x-3.5">
                  <AnimeAvatar 
                    seed={friend.avatarSeed} 
                    size="md" 
                    status={friend.status}
                    rankTier={friend.rankTier}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-slate-800 font-tech">
                        {friend.username}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        #{friend.tag}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase font-tech px-2 py-0.2 rounded-md ${
                        friend.status === 'in_match' ? 'bg-blue-100 text-blue-700' :
                        friend.status === 'online' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {friend.status === 'in_match' ? 'In Duel' : friend.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mt-1">
                      <RankBadge tier={friend.rankTier} division={friend.rankDivision} size="xs" />
                      <span className="text-xs font-bold text-slate-500">
                        {friend.rankTier} {friend.rankDivision} • {friend.activityText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Friend Action Buttons */}
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onChallengeFriend(friend);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-xs font-black font-tech uppercase tracking-wide flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Duel</span>
                  </button>

                  <button
                    onClick={() => onInviteFriend(friend.id)}
                    disabled={friend.invited}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black font-tech uppercase tracking-wide transition-all cursor-pointer flex items-center space-x-1 ${
                      friend.invited
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {friend.invited ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Invited</span>
                      </>
                    ) : (
                      <span>Invite Party</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Add Friend Form & Party Preview */}
        <div className="space-y-6">
          {/* Add Friend Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6">
            <div className="flex items-center space-x-2 mb-3">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <h4 className="text-base font-black text-slate-800 font-tech uppercase tracking-wide">
                Add Cartographer
              </h4>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Enter username or player tag to send a simulated party connection request.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. Ren_Kyoto#JP1"
                value={newFriendInput}
                onChange={(e) => setNewFriendInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full font-tech uppercase"
              >
                SEND FRIEND INVITE
              </Button>
            </form>

            {addFriendSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center space-x-2 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>Simulated request sent successfully!</span>
              </div>
            )}
          </div>

          {/* Party Lobby Widget */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-slate-800 font-tech uppercase tracking-wide flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Active Party Squad (1/2)</span>
              </h4>
              <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-tech">
                Ranked 2v2 Ready
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-3 mb-3">
              <AnimeAvatar seed={player.avatarSeed} size="sm" rankTier={player.rankTier} />
              <div className="truncate">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-black text-slate-800 font-tech">
                    {player.username}
                  </span>
                  <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-tech">
                    LEADER
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">
                  {player.rankTier} {player.rankDivision} • {player.rankPoints} RP
                </span>
              </div>
            </div>

            <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center text-xs font-bold text-slate-400">
              Invite a friend to lock in Duo Queue
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
