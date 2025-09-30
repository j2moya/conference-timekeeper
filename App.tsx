
import React, { useState, useCallback } from 'react';
import type { ConferencePlan } from './types';
import Planner from './components/Planner';
import Player from './components/Player';
import PrintView from './components/PrintView';

type AppView = 'planning' | 'playing' | 'printing';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('planning');
  const [plan, setPlan] = useState<ConferencePlan | null>(null);

  const handlePlanCreated = useCallback((newPlan: ConferencePlan) => {
    setPlan(newPlan);
    setView('playing');
  }, []);

  const handleEndSession = useCallback(() => {
    setView('planning');
    setPlan(null);
  }, []);

  const handleGoToPrint = useCallback(() => {
    if (plan) {
      setView('printing');
    }
  }, [plan]);

  const renderView = () => {
    switch (view) {
      case 'playing':
        return plan && <Player plan={plan} onEndSession={handleEndSession} onGoToPrint={handleGoToPrint} />;
      case 'printing':
        return plan && <PrintView plan={plan} onBack={() => setView('playing')} />;
      case 'planning':
      default:
        return <Planner onPlanCreated={handlePlanCreated} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 font-sans p-4 sm:p-6 lg:p-8">
      <main className="max-w-7xl mx-auto">
        <div className="text-center mb-8 no-print">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            Conference Timekeeper
          </h1>
          <p className="text-gray-400 mt-2">Structure your presentations with precision and focus.</p>
        </div>
        <div className="transition-all duration-500">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;