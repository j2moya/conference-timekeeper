import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ConferencePlan, Segment, UserProfile } from '../types';
import { GoogleGenAI, Type } from '@google/genai';
import { SparklesIcon, UploadIcon, DownloadIcon, GoogleIcon, SignOutIcon, CloudUploadIcon, CloudDownloadIcon } from './icons';
import { initGoogleClient, handleSignIn, handleSignOut, savePlanToDrive, listPlansFromDrive, readPlanFromDrive } from './google-drive';

interface PlannerProps {
  onPlanCreated: (plan: ConferencePlan) => void;
}

const DURATION_OPTIONS = [5, 10, 15, 30, 45, 60];
const SEGMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const LOCAL_STORAGE_KEY = 'conference-timekeeper-plans';

const getInitialSegments = (count: number) => {
    return Array.from({ length: count }, () => ({
        id: crypto.randomUUID(),
        title: '',
        subtitle: '',
        mediaUrl: '',
        relatedLink: '',
    }));
};

const Planner: React.FC<PlannerProps> = ({ onPlanCreated }) => {
  const [title, setTitle] = useState('');
  const [totalDurationMinutes, setTotalDurationMinutes] = useState(30);
  const [segments, setSegments] = useState<Segment[]>(getInitialSegments(3));
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<ConferencePlan[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Google Drive State
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [drivePlans, setDrivePlans] = useState<{id: string, name: string}[]>([]);
  const [driveStatus, setDriveStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    try {
        const storedPlans = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPlans) {
            setSavedPlans(JSON.parse(storedPlans));
        }
    } catch (error) {
        console.error("Failed to load plans from localStorage", error);
    }
    // Initialize Google Client
    initGoogleClient((profile) => {
        setIsSignedIn(true);
        setUserProfile(profile);
    });
  }, []);

  const handleGenerateWithAi = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    setAiError(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: 'A creative and engaging title for the conference.' },
                segments: {
                    type: Type.ARRAY,
                    description: `A list of ${segments.length} segments.`,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: 'The title of this segment.' },
                            subtitle: { type: Type.STRING, description: 'A brief, one-sentence key point for this segment.' },
                        },
                        required: ['title', 'subtitle'],
                    },
                },
            },
            required: ['title', 'segments'],
        };
        const prompt = `Create a conference plan about "${aiTopic}". The total duration is ${totalDurationMinutes} minutes, divided into ${segments.length} segments. Provide a main title and a unique title and subtitle for each segment.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: schema }
        });
        const generatedPlan = JSON.parse(response.text.trim());
        if (generatedPlan.title && Array.isArray(generatedPlan.segments)) {
            setTitle(generatedPlan.title);
            const newSegments = generatedPlan.segments.slice(0, segments.length).map((genSegment: any) => ({
                id: crypto.randomUUID(),
                title: genSegment.title || '',
                subtitle: genSegment.subtitle || '',
                mediaUrl: '',
                relatedLink: '',
            }));
            if (newSegments.length < segments.length) {
                newSegments.push(...getInitialSegments(segments.length - newSegments.length));
            }
            setSegments(newSegments);
            setIsAiModalOpen(false);
            setAiTopic('');
        } else {
            throw new Error("AI response was not in the expected format.");
        }
    } catch (error) {
        console.error("Error generating plan with AI:", error);
        setAiError("Sorry, something went wrong. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSegmentCountChange = useCallback((count: number) => {
    setSegments(currentSegments => {
      const newSegments = [...currentSegments];
      if (count > newSegments.length) {
        newSegments.push(...getInitialSegments(count - newSegments.length));
      } else {
        newSegments.length = count;
      }
      return newSegments;
    });
  }, []);

  const updateSegment = (index: number, field: keyof Omit<Segment, 'id'>, value: string) => {
    setSegments(currentSegments => {
      const newSegments = [...currentSegments];
      newSegments[index] = { ...newSegments[index], [field]: value };
      return newSegments;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
        alert("Please enter a title for the conference.");
        return;
    }
    const plan: ConferencePlan = {
      id: currentPlanId || crypto.randomUUID(),
      title,
      totalDurationMinutes,
      segments,
    };
    onPlanCreated(plan);
  };
  
  const handleSignOutClick = () => {
    handleSignOut();
    setIsSignedIn(false);
    setUserProfile(null);
  };

  const handleSavePlanToDrive = async () => {
    if (!title.trim()) {
      alert("Please enter a title before saving to Drive.");
      return;
    }
    setDriveStatus('loading');
    try {
      const planToSave: ConferencePlan = { id: currentPlanId || crypto.randomUUID(), title, totalDurationMinutes, segments };
      await savePlanToDrive(planToSave);
      alert(`Plan "${title}" saved to Google Drive!`);
      setDriveStatus('idle');
    } catch (error) {
      console.error("Failed to save plan to Drive", error);
      alert("Error: Could not save the plan to Google Drive.");
      setDriveStatus('error');
    }
  };

  const handleOpenDriveModal = async () => {
    setIsDriveModalOpen(true);
    setDriveStatus('loading');
    try {
      const files = await listPlansFromDrive();
      setDrivePlans(files);
      setDriveStatus('idle');
    } catch (error) {
      console.error("Failed to list plans from Drive", error);
      setDriveStatus('error');
    }
  };

  const handleLoadPlanFromDrive = async (fileId: string) => {
    setDriveStatus('loading');
    try {
      const plan = await readPlanFromDrive(fileId);
      setTitle(plan.title);
      setTotalDurationMinutes(plan.totalDurationMinutes);
      setSegments(plan.segments);
      setCurrentPlanId(plan.id);
      setIsDriveModalOpen(false);
      setDriveStatus('idle');
    } catch (error) {
      console.error("Failed to load plan from Drive", error);
      alert("Error: Could not load the plan from Google Drive.");
      setDriveStatus('error');
    }
  };

  // --- Local Storage Handlers ---
  const handleSavePlan = () => {
     if (!title.trim()) {
        alert("Please enter a title before saving.");
        return;
    }
    const planToSave: ConferencePlan = { id: currentPlanId || crypto.randomUUID(), title, totalDurationMinutes, segments };
    const newSavedPlans = [...savedPlans];
    const existingIndex = newSavedPlans.findIndex(p => p.id === planToSave.id);
    if (existingIndex > -1) newSavedPlans[existingIndex] = planToSave;
    else newSavedPlans.push(planToSave);
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSavedPlans));
        setSavedPlans(newSavedPlans);
        if (!currentPlanId) setCurrentPlanId(planToSave.id);
        alert(`Plan "${title}" saved locally!`);
    } catch (error) {
        console.error("Failed to save plan to localStorage", error);
        alert("Error: Could not save the plan.");
    }
  };
  const handleLoadPlan = (planId: string) => {
    const planToLoad = savedPlans.find(p => p.id === planId);
    if (planToLoad) {
        setTitle(planToLoad.title);
        setTotalDurationMinutes(planToLoad.totalDurationMinutes);
        setSegments(planToLoad.segments);
        setCurrentPlanId(planToLoad.id);
    }
  };
  const handleDeletePlan = (planId: string) => {
      if (window.confirm("Are you sure you want to delete this locally saved plan?")) {
        const newSavedPlans = savedPlans.filter(p => p.id !== planId);
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSavedPlans));
            setSavedPlans(newSavedPlans);
            if (currentPlanId === planId) handleNewPlan();
        } catch (error) { console.error("Failed to delete plan", error); }
      }
  };
  const handleNewPlan = () => {
    setTitle(''); setTotalDurationMinutes(30); setSegments(getInitialSegments(3)); setCurrentPlanId(null);
  };
  const handleExportPlan = (planId: string) => {
    const planToExport = savedPlans.find(p => p.id === planId);
    if (!planToExport) return;
    const planJson = JSON.stringify(planToExport, null, 2);
    const blob = new Blob([planJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${planToExport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleImportPlan = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedPlan: ConferencePlan = JSON.parse(e.target?.result as string);
            if (!importedPlan.title || !Array.isArray(importedPlan.segments)) throw new Error("Invalid format.");
            setTitle(importedPlan.title);
            setTotalDurationMinutes(importedPlan.totalDurationMinutes);
            setSegments(importedPlan.segments);
            setCurrentPlanId(importedPlan.id);
            const newSavedPlans = [...savedPlans];
            const existingIndex = newSavedPlans.findIndex(p => p.id === importedPlan.id);
            if (existingIndex > -1) newSavedPlans[existingIndex] = importedPlan;
            else newSavedPlans.push(importedPlan);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSavedPlans));
            setSavedPlans(newSavedPlans);
            alert(`Plan "${importedPlan.title}" imported successfully!`);
        } catch (error) {
            alert("Error: Could not import the plan file.");
        } finally {
            if(event.target) event.target.value = '';
        }
    };
    reader.readAsText(file);
  };

  const segmentDuration = useMemo(() => (segments.length > 0 ? (totalDurationMinutes / segments.length).toFixed(2) : '0.00'), [totalDurationMinutes, segments.length]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
      
      <input type="file" ref={fileInputRef} onChange={handleImportPlan} accept=".json,application/json" style={{ display: 'none' }} />

      {/* --- Modals --- */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => !isGenerating && setIsAiModalOpen(false)}>
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-indigo-300 mb-4">Generate with AI</h3>
                <p className="text-gray-400 mb-6">Describe your conference topic, and we'll generate a plan.</p>
                <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g., The Future of Renewable Energy" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition" disabled={isGenerating} onKeyDown={(e) => e.key === 'Enter' && handleGenerateWithAi()} />
                {aiError && <p className="text-red-400 text-sm mt-2">{aiError}</p>}
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={() => setIsAiModalOpen(false)} disabled={isGenerating} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition disabled:opacity-50">Cancel</button>
                    <button onClick={handleGenerateWithAi} disabled={isGenerating || !aiTopic.trim()} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition disabled:opacity-50 flex items-center justify-center w-36">
                        {isGenerating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Generate Plan'}
                    </button>
                </div>
            </div>
        </div>
      )}
      {isDriveModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setIsDriveModalOpen(false)}>
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-indigo-300 mb-6">Load Plan from Google Drive</h3>
                {driveStatus === 'loading' && <div className="flex justify-center items-center h-32"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                {driveStatus === 'error' && <p className="text-red-400 text-center">Could not load plans from Google Drive.</p>}
                {driveStatus === 'idle' && drivePlans.length === 0 && <p className="text-gray-400 text-center">No conference plans found in your Google Drive.</p>}
                {driveStatus === 'idle' && drivePlans.length > 0 && (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {drivePlans.map(plan => (
                            <div key={plan.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md gap-2">
                                <span className="text-gray-200 truncate pr-2 flex-grow">{plan.name}</span>
                                <button onClick={() => handleLoadPlanFromDrive(plan.id)} className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 rounded transition-colors">Load</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- Saved Plans (Local) --- */}
      {savedPlans.length > 0 && (
          <div className="mb-8 p-6 bg-gray-900/40 rounded-lg border border-gray-700">
             <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-3 mb-4">Locally Saved Plans</h3>
             <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {savedPlans.map(plan => (
                    <div key={plan.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md gap-2">
                        <span className="text-gray-200 truncate pr-2 flex-grow">{plan.title}</span>
                        <div className="flex-shrink-0 flex gap-2">
                            <button onClick={() => handleLoadPlan(plan.id)} className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 rounded transition-colors" title="Load Plan">Load</button>
                            <button onClick={() => handleExportPlan(plan.id)} className="px-2 py-1 text-xs bg-green-700 hover:bg-green-600 rounded transition-colors flex items-center" title="Export Plan"><DownloadIcon/></button>
                            <button onClick={() => handleDeletePlan(plan.id)} className="px-2 py-1 text-xs bg-red-800 hover:bg-red-700 rounded transition-colors flex items-center" title="Delete Plan">&times;</button>
                        </div>
                    </div>
                ))}
             </div>
          </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <h2 className="text-2xl font-bold text-center text-indigo-300 mb-4">{currentPlanId ? 'Edit Your Conference' : 'Plan Your Conference'}</h2>
        
        {/* --- Global Settings --- */}
        <div className="p-6 bg-gray-900/40 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center border-b border-gray-600 pb-3 mb-4 flex-wrap gap-4">
            <h3 className="text-lg font-semibold text-gray-300">Global Settings</h3>
            <div className="flex items-center gap-2">
              {isSignedIn && userProfile ? (
                <div className="flex items-center gap-2 bg-gray-700/50 p-1.5 rounded-full">
                  <img src={userProfile.picture} alt={userProfile.name} className="w-8 h-8 rounded-full" />
                  <span className="text-sm text-gray-300 hidden sm:block">{userProfile.name}</span>
                  <button type="button" onClick={handleSignOutClick} className="p-2 bg-red-800 hover:bg-red-700 rounded-full" title="Sign Out"><SignOutIcon/></button>
                </div>
              ) : (
                <button type="button" onClick={handleSignIn} className="px-3 py-2 text-sm bg-white text-gray-800 font-semibold rounded-lg transition-colors flex items-center gap-2 hover:bg-gray-200">
                    <GoogleIcon /> Sign in with Google
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="conf-title" className="block text-sm font-medium text-gray-400 mb-2">Conference Title</label>
              <input id="conf-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Q3 Project Kick-off" required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-400 mb-2">Total Duration (minutes)</label>
              <select id="duration" value={totalDurationMinutes} onChange={(e) => setTotalDurationMinutes(Number(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 transition">
                  {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="segments" className="block text-sm font-medium text-gray-400 mb-2">Number of Segments</label>
              <select id="segments" value={segments.length} onChange={(e) => handleSegmentCountChange(Number(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 transition">
                {SEGMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex items-center justify-center bg-gray-700/50 rounded-lg p-3">
                <p className="text-gray-300 text-center">Each segment: <span className="font-bold text-indigo-400 text-lg">{segmentDuration}</span> mins</p>
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => setIsAiModalOpen(true)} className="flex-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-500 rounded transition-colors flex items-center justify-center gap-1.5"><SparklesIcon /> AI Assist</button>
                <button type="button" onClick={handleNewPlan} className="flex-1 px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded transition-colors">New Plan</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-3 py-2 text-sm bg-green-700 hover:bg-green-600 rounded transition-colors flex items-center justify-center gap-1.5" title="Import from file"><UploadIcon /> Import</button>
            </div>
          </div>
        </div>

        {/* --- Segments --- */}
        <div className="space-y-6">
          {segments.map((segment, index) => (
            <div key={segment.id} className="p-6 bg-gray-900/40 rounded-lg border border-gray-700 transition-shadow hover:shadow-indigo-500/20">
              <h4 className="text-xl font-semibold text-indigo-400 mb-4">Segment {index + 1}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <input type="text" value={segment.title} onChange={e => updateSegment(index, 'title', e.target.value)} placeholder="Segment Title" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition" />
                <input type="text" value={segment.subtitle} onChange={e => updateSegment(index, 'subtitle', e.target.value)} placeholder="Subtitle / Key Point" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition" />
                <input type="text" value={segment.mediaUrl} onChange={e => updateSegment(index, 'mediaUrl', e.target.value)} placeholder="YouTube, .mp4, or .mp3 URL" className="md:col-span-2 w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition" />
                <input type="text" value={segment.relatedLink} onChange={e => updateSegment(index, 'relatedLink', e.target.value)} placeholder="Optional: Related Link (e.g., https://...)" className="md:col-span-2 w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <div className="flex gap-2">
            <button type="button" onClick={handleSavePlan} className="px-4 py-3 bg-gray-600 text-white font-bold rounded-lg shadow-lg hover:bg-gray-500 transition-transform duration-300 transform hover:scale-105">Save Locally</button>
             {isSignedIn && (
                <>
                <button type="button" onClick={handleSavePlanToDrive} disabled={driveStatus === 'loading'} className="px-4 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-500 transition-transform duration-300 transform hover:scale-105 flex items-center gap-2"><CloudUploadIcon /> Save to Drive</button>
                <button type="button" onClick={handleOpenDriveModal} disabled={driveStatus === 'loading'} className="px-4 py-3 bg-blue-800 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-transform duration-300 transform hover:scale-105 flex items-center gap-2"><CloudDownloadIcon /> Load from Drive</button>
                </>
            )}
          </div>
          <button type="submit" className="px-10 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 hover:shadow-purple-500/50 transform transition-all duration-300">
            Start Presentation
          </button>
        </div>
      </form>
    </div>
  );
};

export default Planner;
