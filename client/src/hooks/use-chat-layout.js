import { useContext } from 'react';
import { ChatLayoutContext } from '@/pages/chat/components/chat-layout-context';

export const useChatLayout = () => useContext(ChatLayoutContext) || {};
