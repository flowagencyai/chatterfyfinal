'use client';

import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import styles from './chat.module.css';

export default function ChatPage() {
  return (
    <div className={styles.chatLayout}>
      <Sidebar />
      <ChatArea />
    </div>
  );
}