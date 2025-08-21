'use client';

import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './globals.css';

export default function HomePage() {
  return (
    <div className="app">
      <Sidebar />
      <ChatArea />
    </div>
  );
}