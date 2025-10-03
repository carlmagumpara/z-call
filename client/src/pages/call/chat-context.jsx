import { createContext, useContext, useState, useEffect } from 'react';
import { socket } from '@/shared/socket';

const Context = createContext();

export const useChat = () => useContext(Context);

function ChatProvider({ children, roomId, user }) {
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(false);

  return (
    <Context.Provider
      value={{
        chat, 
        setChat,
        messages, 
        setMessages
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default ChatProvider;