import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { socket } from '@/shared/socket';
import { usePresence } from '@/contexts/presence';
import { v4 as uuidv4 } from 'uuid';

const Context = createContext();

export const useChat = () => useContext(Context);

function ChatProvider({ children, roomId, user }) {
  const { user_id, username } = usePresence();
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(false);
  const [typing, setTyping] = useState([]);
  const typingTimeoutRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    if(bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ 
          behavior
        });
      }, 100)
    }
  }

  const sendMessage = message => {
    socket.emit('message', {
      room_id: roomId,
      type: 'message',
      data: {
        id: uuidv4(),
        user_id,
        username,
        message,
        system: false,
        datetime: new Date()
      }
    });
  };

  const isTyping = () => {
    socket.emit('message', {
      room_id: roomId,
      type: 'typing',
      data: {
        user_id,
        username,
        system: false,
      }
    });
  };

  useEffect(() => {
    const handleMessage = data => {
      switch(data.type) {
        case 'message':
          setMessages(prevState => [
            ...prevState,
            data.data
          ]);

          setTyping(prevState => 
            prevState.filter(
              item => item.user_id !== data.data.user_id
            )
          );

          scrollToBottom();
          break;
        case 'typing':
          setTyping(prevState => (prevState.some(item => item.user_id === data.data.user_id) ? prevState : [
            ...prevState,
            data.data
          ]));

          if(typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          typingTimeoutRef.current = setTimeout(() => {
            setTyping(prevState => 
              prevState.filter(
                item => item.user_id !== data.data.user_id
              )
            );
            typingTimeoutRef.current = null;
          }, 1000);

          scrollToBottom();
          break;
        default:
          console.log('invalid type');
      }
    };

    socket.on('message', handleMessage);

    return () => {
      socket.off('message', handleMessage);
    };
  }, []);

  return (
    <Context.Provider
      value={{
        chat, 
        setChat,
        messages, 
        setMessages,
        typing, 
        setTyping,
        bottomRef,
        scrollToBottom,
        sendMessage,
        isTyping,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default ChatProvider;