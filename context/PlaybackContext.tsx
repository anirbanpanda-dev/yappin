// app/context/PlaybackContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Track {
  title: string;
  artist: string;
  audioUrl: string;
  thumbnail: any;
}

interface MindmapBranch {
  topic: string;
  subtopics: string[];
}

interface Mindmap {
  main_topic: string;
  branches: MindmapBranch[];
}

interface ApiResponse {
  summary: string;
  audio_url: string;
  mindmap: Mindmap;
}

interface PlaybackContextType {
  track: Track | null;
  setTrack: (track: Track | null) => void;
  isPlaying: boolean;
  togglePlayback: () => void;
  position: number;
  duration: number;
  setPosition: (position: number) => void;
  apiResponse: ApiResponse | null;
  setApiResponse: (response: ApiResponse | null) => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const PlaybackProvider = ({ children }: { children: ReactNode }) => {
  const [track, setTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // Add actual playback logic here (e.g., audio player control)
  };

  return (
    <PlaybackContext.Provider
      value={{
        track,
        setTrack,
        isPlaying,
        togglePlayback,
        position,
        duration,
        setPosition,
        apiResponse,
        setApiResponse,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
};