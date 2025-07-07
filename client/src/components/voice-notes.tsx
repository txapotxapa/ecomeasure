import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface VoiceNotesProps {
  onNoteRecorded?: (audioBlob: Blob, transcription?: string) => void;
  sessionId?: string;
}

interface AudioNote {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
  transcription?: string;
}

export default function VoiceNotes({ onNoteRecorded, sessionId }: VoiceNotesProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioNotes, setAudioNotes] = useState<AudioNote[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Load saved notes from localStorage
    if (sessionId) {
      const savedNotes = localStorage.getItem(`voice-notes-${sessionId}`);
      if (savedNotes) {
        try {
          const notes = JSON.parse(savedNotes);
          // Recreate blobs from base64
          const loadedNotes = notes.map((note: any) => ({
            ...note,
            timestamp: new Date(note.timestamp),
            blob: null, // We'll skip blob recreation for now
            url: note.url
          }));
          setAudioNotes(loadedNotes);
        } catch (error) {
          console.error('Failed to load voice notes:', error);
        }
      }
    }
  }, [sessionId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const note: AudioNote = {
          id: Date.now().toString(),
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime,
          timestamp: new Date()
        };
        
        setAudioNotes(prev => [...prev, note]);
        
        // Save to localStorage (without blob)
        if (sessionId) {
          const notesToSave = [...audioNotes, note].map(n => ({
            id: n.id,
            duration: n.duration,
            timestamp: n.timestamp,
            transcription: n.transcription
          }));
          localStorage.setItem(`voice-notes-${sessionId}`, JSON.stringify(notesToSave));
        }
        
        // Callback with the audio
        onNoteRecorded?.(audioBlob);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playNote = (note: AudioNote) => {
    if (playingId === note.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(note.url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingId(null);
      };
      
      audio.play();
      setPlayingId(note.id);
    }
  };

  const deleteNote = (noteId: string) => {
    const note = audioNotes.find(n => n.id === noteId);
    if (note) {
      URL.revokeObjectURL(note.url);
    }
    
    setAudioNotes(prev => prev.filter(n => n.id !== noteId));
    
    // Update localStorage
    if (sessionId) {
      const updatedNotes = audioNotes.filter(n => n.id !== noteId);
      localStorage.setItem(`voice-notes-${sessionId}`, JSON.stringify(updatedNotes));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Start Recording
                </Button>
              ) : (
                <>
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                  >
                    <MicOff className="h-4 w-4" />
                    Stop
                  </Button>
                  <Button
                    onClick={togglePause}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                </>
              )}
            </div>
            
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>
          
          {isRecording && (
            <div className="mt-3">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-1000"
                  style={{ width: `${(recordingTime % 60) * 100 / 60}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recorded Notes */}
      {audioNotes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Voice Notes</h3>
          {audioNotes.map(note => (
            <Card key={note.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => playNote(note)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    {playingId === note.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div>
                    <p className="text-sm font-medium">
                      {formatTime(note.duration)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {note.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={() => deleteNote(note.id)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              {note.transcription && (
                <p className="mt-2 text-sm text-muted-foreground italic">
                  "{note.transcription}"
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}