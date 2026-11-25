import React, { useState } from 'react';
import { Globe2, AlertCircle, RotateCcw, LogOut } from 'lucide-react';
import {
  mockGameModes,
  mockFriends,
  mockDailyChallenge,
  mockLeaderboard,
  mockNotifications,
  mockMatchHistory,
} from './data/mockData';
import type { NavigationTab, GameModeInfo, Friend, NotificationItem } from './types/game';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { ProfileSetupScreen } from './components/auth/ProfileSetupScreen';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { PlayerPanel } from './components/layout/PlayerPanel';
import { FriendsSidebar } from './components/layout/FriendsSidebar';
import { HomeView } from './components/views/HomeView';
import { RankedView } from './components/views/RankedView';
import { QuickPlayView } from './components/views/QuickPlayView';
import { DailyChallengeView } from './components/views/DailyChallengeView';
import { LeaderboardView } from './components/views/LeaderboardView';
import { ProfileView } from './components/views/ProfileView';
import { FriendsView } from './components/views/FriendsView';
import { MatchmakingModal } from './components/matchmaking/MatchmakingModal';
import { PrivateRoomModal } from './components/matchmaking/PrivateRoomModal';
import { NotificationDropdown } from './components/notifications/NotificationDropdown';
import { SettingsModal } from './components/settings/SettingsModal';
import { GameArenaPreviewModal } from './components/views/GameArenaPreviewModal';
import { RaqeInspectorModal } from './components/dev/RaqeInspectorModal';
import { Modal } from './components/common/Modal';
import { Button } from './components/common/Button';
import { sounds } from './utils/soundEffects';

const CountryRushWorkspace: React.FC = () => {
  const {
    status,
    session,
    activePlayer,
    isRealAuthenticatedUser,
    errorMessage,
    retryProfileLoad,
    signOut,
    exitOfflinePreview,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  // Modals state
  const [matchmakingOpen, setMatchmakingOpen] = useState(false);
  const [selectedQueueMode, setSelectedQueueMode] = useState<GameModeInfo | null>(null);
  const [privateRoomOpen, setPrivateRoomOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [gameArenaOpen, setGameArenaOpen] = useState(false);
  const [raqeInspectorOpen, setRaqeInspectorOpen] = useState(false);
  const [arenaTitle, setArenaTitle] = useState('Ranked 1v1');
  const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Strict Auth State Gate (Prevents rendering authenticated UI before auth state resolves)
  if (status === 'auth_loading' || status === 'profile_loading') {
    return (
      <div className="min-h-screen w-screen bg-esports-grid bg-[#F4F7FC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-4">
          <Globe2 className="w-8 h-8 animate-spin [animation-duration:3s]" />
        </div>
        <h2 className="text-xl font-black text-slate-900 font-tech uppercase tracking-wider">
          COUNTRY<span className="text-blue-600">RUSH</span>
        </h2>
        <p className="text-xs font-bold text-slate-500 mt-1">
          {status === 'auth_loading'
            ? 'Restoring Supabase authentication session...'
            : 'Syncing your Cartographer profile & competitive ratings...'}
        </p>
      </div>
    );
  }

  if (status === 'logged_out') {
    return <AuthScreen />;
  }

  if (status === 'profile_setup_required') {
    return <ProfileSetupScreen />;
  }

  if (status === 'profile_unavailable') {
    return (
      <div className="min-h-screen w-screen bg-esports-grid bg-[#F4F7FC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 shadow-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 font-tech uppercase">
            Profile Unavailable
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {errorMessage || 'We verified your login session, but could not load your profile row from Supabase.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => void retryProfileLoad()}
              icon={<RotateCcw className="w-4 h-4" />}
              className="flex-1 font-tech uppercase"
            >
              Retry Sync
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => void signOut()}
              icon={<LogOut className="w-4 h-4" />}
              className="flex-1 font-tech uppercase"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Mode Selection (Existing Frontend & Arena Simulation Preserved)
  const handleSelectMode = (mode: GameModeInfo) => {
    if (mode.id === 'private-room') {
      setPrivateRoomOpen(true);
      return;
    }
    if (mode.id === 'daily-challenge') {
      setActiveTab('daily');
      return;
    }
    setSelectedQueueMode(mode);
    setArenaTitle(mode.title);
    setMatchmakingOpen(true);
  };

  const handleQueueRankedFromView = (modeType: '1v1' | '2v2') => {
    const targetMode = mockGameModes.find((m) => m.id === `ranked-${modeType}`) || mockGameModes[0];
    setSelectedQueueMode(targetMode);
    setArenaTitle(targetMode.title);
    setMatchmakingOpen(true);
  };

  const handleLaunchQuickQueue = (modeTitle: string) => {
    const qMode = mockGameModes.find((m) => m.id === 'quickplay') || mockGameModes[2];
    setSelectedQueueMode({ ...qMode, title: modeTitle });
    setArenaTitle(modeTitle);
    setMatchmakingOpen(true);
  };

  const handleInviteFriend = (id: string) => {
    sounds.playClick();
    setFriends((prev) => prev.map((f) => (f.id === id ? { ...f, invited: true } : f)));
    const friend = friends.find((f) => f.id === id);
    if (friend) {
      showToast(`Party invite sent to ${friend.username}! (Simulated)`);
    }
  };

  const handleAddFriend = (username: string) => {
    sounds.playClick();
    const newFriend: Friend = {
      id: `fr_${Date.now()}`,
      username: username.split('#')[0] || username,
      tag: username.split('#')[1] || 'GLOBAL',
      avatarSeed: username.toLowerCase(),
      rankTier: 'Platinum',
      rankDivision: 'II',
      status: 'online',
      activityText: 'Just connected',
    };
    setFriends((prev) => [newFriend, ...prev]);
    showToast(`Added ${username} to your friend list!`);
  };

  const handleChallengeFriend = (friend: Friend) => {
    sounds.playClick();
    setArenaTitle(`Friendly Scrim vs ${friend.username}`);
    setMatchmakingOpen(true);
  };

  const handleMarkAllRead = () => {
    sounds.playClick();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read.');
  };

  const handleAcceptInvite = (id: string) => {
    sounds.playClick();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast('Accepted party invite! Entering queue...');
    setMatchmakingOpen(true);
  };

  const handleStartCustomMatch = () => {
    setPrivateRoomOpen(false);
    setArenaTitle('Custom Room Arena');
    setGameArenaOpen(true);
  };

  const handleLaunchGamePreviewFromMatch = () => {
    setMatchmakingOpen(false);
    setGameArenaOpen(true);
  };

  const handleAuthTopbarAction = () => {
    if (isRealAuthenticatedUser) {
      void signOut();
    } else {
      exitOfflinePreview();
    }
  };

  const onlineFriendsCount = friends.filter((f) => f.status !== 'offline').length;
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-esports-grid bg-[#F4F7FC] text-[#20283A] font-sans antialiased">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'settings') {
            setSettingsOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onlineFriendsCount={onlineFriendsCount}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Topbar
          player={activePlayer}
          unreadNotificationsCount={unreadNotifCount}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenRaqeInspector={() => setRaqeInspectorOpen(true)}
          isRealAuthenticatedUser={isRealAuthenticatedUser}
          onAuthAction={handleAuthTopbarAction}
        />

        {/* Scrollable Center Work Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'home' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 min-w-0">
                  <HomeView
                    player={activePlayer}
                    modes={mockGameModes}
                    dailyChallenge={mockDailyChallenge}
                    onSelectMode={handleSelectMode}
                    onNavigateToDaily={() => setActiveTab('daily')}
                    onNavigateToRanked={() => setActiveTab('ranked')}
                    onNavigateToQuickPlay={() => setActiveTab('quickplay')}
                  />
                </div>

                <div className="xl:col-span-4 space-y-6">
                  <PlayerPanel
                    player={activePlayer}
                    onViewCareer={() => setActiveTab('profile')}
                  />

                  <FriendsSidebar
                    friends={friends}
                    onInviteFriend={handleInviteFriend}
                    onAddFriendPrompt={() => setAddFriendModalOpen(true)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'ranked' && (
              <RankedView
                player={activePlayer}
                matchHistory={isRealAuthenticatedUser ? [] : mockMatchHistory}
                onQueueRanked={handleQueueRankedFromView}
              />
            )}

            {activeTab === 'quickplay' && (
              <QuickPlayView onLaunchQuickQueue={handleLaunchQuickQueue} />
            )}

            {activeTab === 'daily' && (
              <DailyChallengeView
                challenge={mockDailyChallenge}
                player={activePlayer}
                onStartChallenge={() => {
                  setArenaTitle('Daily Challenge Sprint');
                  setGameArenaOpen(true);
                }}
              />
            )}

            {activeTab === 'leaderboard' && <LeaderboardView players={mockLeaderboard} />}

            {activeTab === 'profile' && (
              <ProfileView
                player={activePlayer}
                matchHistory={isRealAuthenticatedUser ? [] : mockMatchHistory}
                onQueueRanked={() => handleQueueRankedFromView('1v1')}
                isRealAuthenticatedUser={isRealAuthenticatedUser}
                userEmail={session?.email}
                onOpenEditProfile={() => setEditProfileOpen(true)}
                onSignOut={() => void signOut()}
              />
            )}

            {activeTab === 'friends' && (
              <FriendsView
                friends={friends}
                player={activePlayer}
                onInviteFriend={handleInviteFriend}
                onAddFriend={handleAddFriend}
                onChallengeFriend={handleChallengeFriend}
              />
            )}
          </div>
        </main>
      </div>

      {/* MODALS & OVERLAYS */}
      <MatchmakingModal
        isOpen={matchmakingOpen}
        onClose={() => setMatchmakingOpen(false)}
        mode={selectedQueueMode}
        player={activePlayer}
        onLaunchGamePreview={handleLaunchGamePreviewFromMatch}
      />

      <PrivateRoomModal
        isOpen={privateRoomOpen}
        onClose={() => setPrivateRoomOpen(false)}
        player={activePlayer}
        friends={friends}
        onStartCustomMatch={handleStartCustomMatch}
      />

      <NotificationDropdown
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onAcceptInvite={handleAcceptInvite}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenEditProfile={() => setEditProfileOpen(true)}
      />

      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onSaved={(msg) => showToast(msg)}
      />

      <GameArenaPreviewModal
        isOpen={gameArenaOpen}
        onClose={() => setGameArenaOpen(false)}
        player={activePlayer}
        modeTitle={arenaTitle}
      />

      <RaqeInspectorModal
        isOpen={raqeInspectorOpen}
        onClose={() => setRaqeInspectorOpen(false)}
      />

      {/* Add Friend Modal Prompt */}
      <Modal
        isOpen={addFriendModalOpen}
        onClose={() => setAddFriendModalOpen(false)}
        title="Add Friend to Network"
        subtitle="Simulated frontend friend connection"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            Enter player username or tag to send an invitation.
          </p>
          <input
            type="text"
            placeholder="e.g. Ren_Kyoto#JP1"
            value={newFriendName}
            onChange={(e) => setNewFriendName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400"
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setAddFriendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (newFriendName.trim()) {
                  handleAddFriend(newFriendName.trim());
                  setNewFriendName('');
                  setAddFriendModalOpen(false);
                }
              }}
              className="font-tech uppercase"
            >
              Add Friend
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold font-tech tracking-wide flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-4">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CountryRushWorkspace />
    </AuthProvider>
  );
};
