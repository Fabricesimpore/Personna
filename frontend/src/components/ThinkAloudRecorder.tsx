import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Play } from 'lucide-react';
import { Button } from './ui/button';

interface ThinkAloudRecorderProps {
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
}

const ThinkAloudRecorder: React.FC<ThinkAloudRecorderProps> = ({
  onTranscriptUpdate,
  onRecordingStateChange
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          const newTranscript = transcript + ' ' + finalTranscript;
          setTranscript(newTranscript);
          onTranscriptUpdate(newTranscript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError('Speech recognition error: ' + event.error);
      };
      
      recognitionRef.current = recognition;
    } else {
      setError('Speech recognition not supported in this browser');
    }
  }, [transcript, onTranscriptUpdate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Here you could upload the audio blob to your server
        console.log('Audio recording completed:', audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStateChange(true);
      setRecordingTime(0);
      setError(null);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
    onRecordingStateChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        stopRecording();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-4 max-w-sm">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {isRecording ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {isRecording ? 'Recording' : 'Think Aloud'}
              </span>
              {isRecording && (
                <span className="text-xs text-gray-500 font-mono">
                  {formatTime(recordingTime)}
                </span>
              )}
            </div>
            
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
            
            {transcript && (
              <div className="mt-2 max-h-20 overflow-y-auto">
                <p className="text-xs text-gray-600 leading-relaxed">
                  {transcript.slice(-200)}...
                </p>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleToggleRecording}
            variant={isRecording ? "destructive" : "default"}
            size="sm"
            className="flex items-center space-x-1"
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Start</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThinkAloudRecorder; 