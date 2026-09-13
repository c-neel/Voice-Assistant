"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Loader2, Save, AlertCircle, Pause, Play, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchApi } from "@/lib/api";

type RecordingState = "idle" | "recording" | "paused" | "transcribing" | "review" | "analyzing";

export default function VoiceMeetingPage() {
  const router = useRouter();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [transcript, setTranscript] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("Voice Recording");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordingState === "recording") {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Send to backend for transcription only
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        // Cleanup tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingTime(0);
      setRecordingState("recording");
    } catch (err: any) {
      console.error("Mic access denied:", err);
      setError("Microphone access denied or not available.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecordingState("transcribing");
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const transcription = await fetchApi("/voice/upload", {
        method: "POST",
        body: formData,
      });

      setTranscript(transcription.transcript);
      setRecordingState("review");

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to transcribe audio");
      setRecordingState("idle");
    }
  };

  const analyzeTranscript = async () => {
    setRecordingState("analyzing");
    try {
      const analysis = await fetchApi("/analyze/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: transcript,
          meeting_title: meetingTitle,
          participants: [],
        }),
      });

      setTimeout(() => {
        if (analysis.meeting_id) {
          router.push(`/meetings/${analysis.meeting_id}`);
        } else {
          router.push("/meetings");
        }
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze transcript");
      setRecordingState("review");
    }
  };

  return (
    <div className="flex-1 space-y-6 max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Voice Meeting</h2>
        <p className="text-muted-foreground mt-1">Record a meeting directly. Review the transcript before AI analysis.</p>
      </div>

      <Card className={`flex-1 border-border/50 shadow-sm flex flex-col relative overflow-hidden ${recordingState === 'review' ? 'overflow-y-auto' : ''}`}>
        {/* Animated Background when recording */}
        {recordingState === "recording" && (
          <div className="absolute inset-0 bg-primary/5 pointer-events-none transition-opacity duration-1000 z-0">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] animate-pulse" />
          </div>
        )}
        
        <CardContent className="flex-1 flex flex-col p-8 relative z-10">
          
          {error && (
            <div className="mb-8 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 max-w-sm mx-auto">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* RECORDING INTERFACE (Idle, Recording, Paused) */}
          {(recordingState === "idle" || recordingState === "recording" || recordingState === "paused") && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-6xl font-mono tracking-tighter font-light mb-12">
                {formatTime(recordingTime)}
              </div>

              <div className="flex items-center gap-6">
                {recordingState === "idle" ? (
                  <Button 
                    onClick={startRecording} 
                    size="lg" 
                    className="w-24 h-24 rounded-full shadow-2xl shadow-primary/40 hover:scale-105 transition-all duration-300"
                  >
                    <Mic className="w-10 h-10" />
                  </Button>
                ) : (
                  <>
                    {recordingState === "recording" ? (
                      <Button 
                        onClick={pauseRecording} 
                        size="lg" 
                        variant="secondary"
                        className="w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-all"
                      >
                        <Pause className="w-6 h-6" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={resumeRecording} 
                        size="lg" 
                        variant="secondary"
                        className="w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-all"
                      >
                        <Play className="w-6 h-6 ml-1" />
                      </Button>
                    )}
                    
                    <div className="relative">
                      {recordingState === "recording" && (
                        <div className="absolute -inset-4 rounded-full bg-destructive/20 animate-ping" />
                      )}
                      <Button 
                        onClick={stopRecording} 
                        size="lg" 
                        variant="destructive"
                        className="w-24 h-24 rounded-full shadow-2xl shadow-destructive/40 hover:scale-105 transition-all duration-300 relative z-10"
                      >
                        <Square className="w-8 h-8 fill-current" />
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-12 text-center max-w-sm">
                <p className="text-sm text-muted-foreground">
                  {recordingState === "recording" && "Recording in progress. The microphone is capturing your voice."}
                  {recordingState === "paused" && "Recording paused."}
                  {recordingState === "idle" && "Click the microphone to start recording your meeting."}
                </p>
              </div>
            </div>
          )}

          {/* TRANSCRIBING & ANALYZING SPINNERS */}
          {(recordingState === "transcribing" || recordingState === "analyzing") && (
             <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="relative w-24 h-24 flex items-center justify-center">
                   <div className="absolute inset-0 border-4 border-muted rounded-full" />
                   <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                   {recordingState === "transcribing" ? <Mic className="w-8 h-8 text-primary/50" /> : <FileText className="w-8 h-8 text-primary/50" />}
                </div>
                <div className="text-center mt-6">
                  <h3 className="text-lg font-semibold">
                    {recordingState === "transcribing" ? "Processing Recording" : "Analyzing Transcript"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {recordingState === "transcribing" ? "Faster-Whisper is transcribing..." : "Gemini is generating summaries and tasks..."}
                  </p>
                </div>
             </div>
          )}

          {/* REVIEW MODE */}
          {recordingState === "review" && (
            <div className="flex-1 flex flex-col space-y-6 max-w-3xl w-full mx-auto">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg">Meeting Title</Label>
                <Input 
                  id="title" 
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="bg-muted/50 text-lg py-6" 
                />
              </div>
              
              <div className="space-y-2 flex-1 flex flex-col">
                <Label htmlFor="transcript" className="text-lg flex justify-between items-center">
                  <span>Transcript</span>
                  <span className="text-sm text-muted-foreground font-normal">Edit before analyzing</span>
                </Label>
                <Textarea 
                  id="transcript"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="flex-1 min-h-[300px] resize-none bg-muted/50 p-4 font-mono text-sm shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setRecordingState("idle")}>
                  Discard
                </Button>
                <Button size="lg" className="shadow-lg shadow-primary/20" onClick={analyzeTranscript}>
                  Analyze Recording <Save className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
