import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TranscriptContextType {
  transcript: string;
  updateTranscript: (newTranscript: string) => void;
  clearTranscript: () => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
}

const TranscriptContext = createContext<TranscriptContextType | undefined>(undefined);

interface TranscriptProviderProps {
  children: ReactNode;
}

export const TranscriptProvider: React.FC<TranscriptProviderProps> = ({ children }) => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const updateTranscript = (newTranscript: string) => {
    setTranscript(newTranscript);
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  const value: TranscriptContextType = {
    transcript,
    updateTranscript,
    clearTranscript,
    isRecording,
    setIsRecording
  };

  return (
    <TranscriptContext.Provider value={value}>
      {children}
    </TranscriptContext.Provider>
  );
};

export const useTranscript = (): TranscriptContextType => {
  const context = useContext(TranscriptContext);
  if (context === undefined) {
    throw new Error('useTranscript must be used within a TranscriptProvider');
  }
  return context;
}; 