
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { SetupForm } from './components/SetupForm';
import { InterviewSession } from './components/InterviewSession';
import { StudyConfig } from './types';

const App: React.FC = () => {
  const [activeConfig, setActiveConfig] = useState<StudyConfig | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [systemReady, setSystemReady] = useState(false);

  const handleStart = (config: StudyConfig) => {
    setActiveConfig(config);
  };

  const handleExit = () => {
    setActiveConfig(null);
  };

  return (
    <Layout 
      onToggleLogs={() => setShowLogs(!showLogs)} 
      systemReady={systemReady}
    >
      {!activeConfig ? (
        <div className="w-full pt-12">
          <SetupForm 
            onStart={handleStart} 
            showLogs={showLogs}
            onSystemStatusChange={setSystemReady}
          />
        </div>
      ) : (
        <InterviewSession config={activeConfig} onExit={handleExit} />
      )}
    </Layout>
  );
};

export default App;
