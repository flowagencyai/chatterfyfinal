'use client';

import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.app}>
      <Sidebar />
      <ChatArea />
    </div>
  );
}