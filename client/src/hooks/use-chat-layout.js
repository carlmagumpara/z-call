import { useContext } from 'react';
import { ChatLayoutContext } from '@/components/chat/chat-layout-context';

export const useChatLayout = () => useContext(ChatLayoutContext) || {};
