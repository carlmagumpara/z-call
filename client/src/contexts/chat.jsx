import { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '@/shared/socket';
import { usePresence } from './presence';
import { ChatContext } from './chat-context';

const MESSAGE_LIMIT = 200;
const TYPING_TIMEOUT = 1500;

/**
 * Owns the single shared socket's chat events. Messages live only in React
 * state: no localStorage, no history request, nothing survives a refresh.
 */
function ChatProvider({ children }) {
  const { user_id, username } = usePresence();
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState({});
  const [activePeerId, setActivePeerId] = useState(null);
  const [unread, setUnread] = useState({});
  const [typingPeers, setTypingPeers] = useState({});
  const [status, setStatus] = useState(socket.connected ? 'connected' : 'reconnecting');

  // Socket handlers stay mounted for the app's lifetime, so they read the
  // current identity/selection from refs instead of closing over stale state.
  const identityRef = useRef({ user_id, username });
  const activePeerRef = useRef(null);
  const typingActiveRef = useRef(false);
  const typingTimerRef = useRef(null);
  const peerTypingTimersRef = useRef({});
  identityRef.current = { user_id, username };

  const announce = useCallback(() => {
    const { user_id: id, username: name } = identityRef.current;
    if (!id) return;

    // PresenceProvider does this too; repeating it is harmless and guarantees
    // the server knows who we are even if this effect runs first.
    socket.emit('user_online', { user_id: id, username: name });
    socket.emit('users:list');

    // A reconnect lands on a fresh server instance: rejoin the open chat.
    if (activePeerRef.current) {
      socket.emit('conversation:join', { peer_id: activePeerRef.current });
    }
  }, []);

  useEffect(() => {
    const onConnect = () => {
      setStatus('connected');
      announce();
    };
    const onDisconnect = () => {
      setStatus('reconnecting');
      setTypingPeers({});
      typingActiveRef.current = false;
    };
    const onConnectionProblem = () => setStatus('reconnecting');

    const onUsersList = (list) => {
      const me = identityRef.current.user_id;
      setUsers(Array.isArray(list)
        ? list.filter((user) => user?.user_id && user.user_id !== me).map((user) => ({ ...user, online: true }))
        : []);
    };

    const onPresenceUpdate = ({ user_id: id, username: name, online } = {}) => {
      const me = identityRef.current.user_id;
      if (!id || id === me) return;

      setUsers((previous) => {
        const index = previous.findIndex((user) => user.user_id === id);
        if (online) {
          if (index === -1) {
            return [...previous, { user_id: id, username: name || 'Guest', online: true }];
          }
          return previous.map((user) => user.user_id === id
            ? { ...user, username: name || user.username, online: true }
            : user);
        }
        if (index === -1) return previous;
        return previous.map((user) => user.user_id === id ? { ...user, online: false } : user);
      });
    };

    const onMessageNew = (message) => {
      if (!message || typeof message !== 'object') return;
      const me = identityRef.current.user_id;
      const peerId = message.from === me ? message.to : message.from;
      if (!peerId || peerId === me) return;

      setMessages((previous) => {
        const conversation = previous[peerId] || [];
        if (conversation.some((item) => item.id === message.id)) return previous;
        return { ...previous, [peerId]: [...conversation, message].slice(-MESSAGE_LIMIT) };
      });

      if (peerId !== activePeerRef.current) {
        setUnread((previous) => ({ ...previous, [peerId]: (previous[peerId] || 0) + 1 }));
      }
    };

    const onTypingStart = ({ from } = {}) => {
      const me = identityRef.current.user_id;
      if (!from || from === me) return;
      setTypingPeers((previous) => ({ ...previous, [from]: true }));
      clearTimeout(peerTypingTimersRef.current[from]);
      // Guard against a missed `typing:stop` (e.g. the peer drops offline).
      peerTypingTimersRef.current[from] = setTimeout(() => {
        setTypingPeers((previous) => ({ ...previous, [from]: false }));
      }, 3000);
    };

    const onTypingStop = ({ from } = {}) => {
      if (!from) return;
      clearTimeout(peerTypingTimersRef.current[from]);
      setTypingPeers((previous) => ({ ...previous, [from]: false }));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectionProblem);
    socket.on('reconnect_attempt', onConnectionProblem);
    socket.on('users:list', onUsersList);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('message:new', onMessageNew);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    announce();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectionProblem);
      socket.off('reconnect_attempt', onConnectionProblem);
      socket.off('users:list', onUsersList);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('message:new', onMessageNew);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      clearTimeout(typingTimerRef.current);
      Object.values(peerTypingTimersRef.current).forEach(clearTimeout);
      peerTypingTimersRef.current = {};
    };
  }, [announce]);

  const notifyTyping = useCallback((isTyping) => {
    const peer = activePeerRef.current;
    if (!peer || !socket.connected) return;

    if (isTyping) {
      if (!typingActiveRef.current) {
        typingActiveRef.current = true;
        socket.emit('typing:start', { to: peer });
      }
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        typingActiveRef.current = false;
        socket.emit('typing:stop', { to: peer });
        typingTimerRef.current = null;
      }, TYPING_TIMEOUT);
      return;
    }

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
    if (typingActiveRef.current) {
      typingActiveRef.current = false;
      socket.emit('typing:stop', { to: peer });
    }
  }, []);

  const selectPeer = useCallback((peerId) => {
    const me = identityRef.current.user_id;
    if (!peerId || peerId === me) return;

    const previous = activePeerRef.current;
    if (previous && previous !== peerId) {
      socket.emit('conversation:leave', { peer_id: previous });
    }
    notifyTyping(false);
    activePeerRef.current = peerId;
    setActivePeerId(peerId);
    setUnread((current) => ({ ...current, [peerId]: 0 }));
    socket.emit('conversation:join', { peer_id: peerId });
  }, [notifyTyping]);

  const leaveConversation = useCallback(() => {
    const peer = activePeerRef.current;
    if (peer) socket.emit('conversation:leave', { peer_id: peer });
    notifyTyping(false);
    activePeerRef.current = null;
    setActivePeerId(null);
    setTypingPeers({});
  }, [notifyTyping]);

  // Called when the chat session ends (navigation away / drawer closed).
  const endConversation = useCallback(() => {
    leaveConversation();
    setMessages({});
    setUnread({});
  }, [leaveConversation]);

  const sendMessage = useCallback((text) => {
    const peer = activePeerRef.current;
    const body = typeof text === 'string' ? text.trim() : '';
    if (!peer || !body || !socket.connected) return false;
    socket.emit('message:send', { to: peer, text: body });
    notifyTyping(false);
    return true;
  }, [notifyTyping]);

  const activePeer = users.find((user) => user.user_id === activePeerId) || null;
  const unreadCount = Object.values(unread).reduce((total, count) => total + count, 0);

  return (
    <ChatContext.Provider value={{
      users,
      messages,
      activePeerId,
      activePeer,
      unread,
      unreadCount,
      typingPeers,
      status,
      isConnected: status === 'connected',
      selectPeer,
      leaveConversation,
      endConversation,
      sendMessage,
      notifyTyping,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export default ChatProvider;
