import { useState } from 'react';
import { ChatLayoutContext } from './chat-layout-context';

/** Sidebar + conversation shell with a list first flow on small screens. */
function ChatLayout({ sidebar, children, className = '' }) {
  const [view, setView] = useState('list');

  return (
    <ChatLayoutContext.Provider value={{
      view,
      showConversation: () => setView('conversation'),
      showList: () => setView('list'),
    }}>
      <div className={`flex overflow-hidden rounded-2xl border border-stroke bg-surface backdrop-blur-14 ${className}`}>
        <aside className={`${view === 'conversation' ? 'hidden' : 'flex'} w-full shrink-0 flex-col border-stroke md:flex md:w-[290px] md:border-r`}>
          {sidebar}
        </aside>
        <section className={`${view === 'conversation' ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col md:flex`}>
          {children}
        </section>
      </div>
    </ChatLayoutContext.Provider>
  );
}

export default ChatLayout;
