'use client';

import { AppProvider } from './components/AppProvider';
import TaskDashboard from './components/tasks/TaskDashboard';

export default function Home() {
  return (
    <AppProvider>
      <TaskDashboard />
    </AppProvider>
  );
}
