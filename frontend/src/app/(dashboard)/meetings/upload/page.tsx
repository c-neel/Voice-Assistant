"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, File, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api";

export default function FileUploadPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setUploadProgress(20);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      if (participants) formData.append("participants", participants);

      setUploadProgress(50);
      
      const response = await fetchApi("/analyze/file", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(100);
      
      // Redirect to the meeting detail page after a short delay
      setTimeout(() => {
        if (response.meeting_id) {
          router.push(`/meetings/${response.meeting_id}`);
        } else {
          router.push("/meetings");
        }
      }, 1500);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload file");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex-1 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upload Document</h2>
        <p className="text-muted-foreground mt-1">Upload meeting notes, transcripts, or strategy documents for AI analysis.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
          <CardDescription>Optional context to help the AI understand the meeting better.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input 
              id="title" 
              placeholder="e.g. Q3 Roadmap Planning" 
              className="bg-muted/50" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="participants">Participants</Label>
            <Input 
              id="participants" 
              placeholder="e.g. John Doe, Sarah Smith (Comma separated)" 
              className="bg-muted/50" 
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Drag and drop your file</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Support for PDF, DOCX, TXT, CSV, and Markdown files up to 50MB.
              </p>
              
              <div className="relative">
                <Input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt,.csv,.md"
                />
                <Button variant="secondary">Browse Files</Button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{file.name}</h4>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                {!isUploading && (
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-destructive">
                    Remove
                  </Button>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {isUploading && !error && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-primary">{uploadProgress < 100 ? "Uploading & Analyzing..." : "Analysis Complete"}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-out" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  {uploadProgress === 100 && (
                    <div className="pt-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Document processed successfully. Redirecting to results...</span>
                    </div>
                  )}
                </div>
              )}

              {!isUploading && !error && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleUpload} size="lg" className="shadow-lg shadow-primary/20">
                    Extract & Analyze <UploadCloud className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
