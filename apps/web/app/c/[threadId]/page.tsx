'use client';

import Sidebar from '../../components/Sidebar';
import ChatArea from '../../components/ChatArea';
import '../../globals.css';

interface ThreadPageProps {
  params: {
    threadId: string;
  };
}

export default function ThreadPage({ params }: ThreadPageProps) {
  return (
    <div className="app">
      <Sidebar />
      <ChatArea />
    </div>
  );
}