"use client";

import { useState, useEffect, use, useRef } from "react";
import { Download, Share, Zap, FileText, CheckSquare, MessageSquare, Clock, Users, ArrowLeft, Loader2, Bot, User, Sparkles, Send, CheckCircle2, CalendarPlus, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { fetchApi } from "@/lib/api";

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [meeting, setMeeting] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Chat State
  const [messages, setMessages] = useState<any[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI Assistant. I have access to the transcript and analysis of this specific meeting. What would you like to know?"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Task Approval State
  const [approvingTask, setApprovingTask] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleChatSend = async () => {
    if (!chatInput.trim() || !meeting) return;

    const userMessage = { id: Date.now().toString(), role: "user", content: chatInput };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetchApi("/assistant/chat", {
        method: "POST",
        body: JSON.stringify({
          message: currentInput,
          session_id: sessionId,
          meeting_id: meeting.id
        })
      });
      
      setSessionId(response.session_id);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        sources: response.sources
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev, 
        { id: Date.now().toString(), role: "assistant", content: `Error: ${err.message}` }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await fetchApi(`/tasks/${id}`, { method: 'DELETE' });
      setMeeting((prev: any) => ({
        ...prev,
        tasks: prev.tasks.filter((t: any) => t.id !== id)
      }));
    } catch (err) {
      console.error("Failed to delete task", err);
      alert("Failed to delete task");
    }
  };

  const submitApproval = async () => {
    if (!approvingTask) return;
    
    try {
      let finalDueDate = null;
      if (selectedDate) {
        if (selectedTime) {
          finalDueDate = new Date(`${selectedDate}T${selectedTime}`).toISOString();
        } else {
          finalDueDate = new Date(selectedDate).toISOString();
        }
      }

      await fetchApi(`/tasks/${approvingTask.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ approved: true, status: 'in_progress', due_date: finalDueDate })
      });
      
      if (finalDueDate) {
        const title = encodeURIComponent(approvingTask.title);
        const details = encodeURIComponent(approvingTask.description || "");
        const d = new Date(finalDueDate);
        const formatGoogleDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const start = formatGoogleDate(d);
        const end = formatGoogleDate(new Date(d.getTime() + 60 * 60 * 1000));
        
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${start}/${end}`;
        window.open(gcalUrl, '_blank');
      }

      setMeeting((prev: any) => ({
        ...prev,
        tasks: prev.tasks.map((t: any) => t.id === approvingTask.id ? { ...t, approved: true, status: 'in_progress', due_date: finalDueDate } : t)
      }));
      
      setApprovingTask(null);
      setSelectedDate("");
      setSelectedTime("");
    } catch (err) {
      console.error("Failed to approve task", err);
      alert("Failed to approve task");
    }
  };

  const handleToggleComplete = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    try {
      await fetchApi(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setMeeting((prev: any) => ({
        ...prev,
        tasks: prev.tasks.map((t: any) => t.id === task.id ? { ...t, status: newStatus } : t)
      }));
    } catch (err) {
      console.error("Failed to toggle task completion", err);
      alert("Failed to update task status");
    }
  };

  const syncToCalendar = (task: any) => {
    if (!task.due_date) {
      alert("This task has no due date. Please edit it to add a date first.");
      return;
    }
    const title = encodeURIComponent(task.title);
    const details = encodeURIComponent(task.description || "");
    const d = new Date(task.due_date);
    const formatGoogleDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const start = formatGoogleDate(d);
    const end = formatGoogleDate(new Date(d.getTime() + 60 * 60 * 1000));
    
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${start}/${end}`;
    window.open(gcalUrl, '_blank');
  };

  useEffect(() => {
    const loadMeeting = async () => {
      try {
        const data = await fetchApi(`/meetings/${resolvedParams.id}`);
        setMeeting(data);
      } catch (err) {
        console.error("Failed to load meeting detail", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMeeting();
  }, [resolvedParams.id]);

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!meeting) {
    return <div className="p-12 text-center text-muted-foreground">Meeting not found.</div>;
  }

  const handleExportPDF = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: meeting.title,
          text: `Meeting Notes: ${meeting.title}`,
          url: url,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto print:max-w-none print:p-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 no-print">
        <Link href="/meetings" className="hover:text-foreground flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Meetings
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 print:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              {meeting.status}
            </Badge>
            <span className="text-sm font-medium text-muted-foreground print-text">Score: {meeting.quality_score || 0}/100</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight print-text">{meeting.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2 print-text">
            <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleString() : 'No date'}</span>
            <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {meeting.participants?.join(", ") || "No participants"}</span>
          </div>
        </div>
        <div className="flex gap-3 no-print">
          <Button variant="outline" onClick={handleShare} className="hover:bg-primary/10 transition-colors">
            <Share className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="hover:bg-primary/10 transition-colors">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({meeting.tasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="decisions">Decisions ({meeting.decisions?.length || 0})</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
        </TabsList>
        
        {/* SUMMARY TAB */}
        <TabsContent value="summary" className="mt-6 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {meeting.summary?.executive_summary || "No executive summary available."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Detailed Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
               <p className="leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {meeting.summary?.detailed_summary || "No detailed summary available."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-500" />
                Extracted Action Items
              </CardTitle>
              <CardDescription>Tasks identified by AI during the meeting. Review and schedule them below.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!meeting.tasks || meeting.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks found.</p>
                ) : (
                  meeting.tasks.map((task: any) => {
                    const isPending = task.status === 'pending';
                    const isCompleted = task.status === 'completed';
                    
                    return (
                      <div key={task.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-card gap-4 group ${isCompleted ? 'opacity-75' : ''}`}>
                        <div className="flex gap-4 flex-1">
                          {!isPending && (
                            <div className="mt-1">
                              <div 
                                className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-colors flex items-center justify-center ${
                                  isCompleted 
                                    ? 'border-primary bg-primary hover:bg-primary/80' 
                                    : 'border-primary bg-primary/10 hover:bg-primary/20'
                                }`}
                                onClick={() => handleToggleComplete(task)}
                              >
                                {isCompleted && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                              </div>
                            </div>
                          )}
                          <div className="space-y-1">
                            <h4 className={`font-semibold text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <div className="inline-flex items-center text-xs bg-muted px-2 py-1 rounded-md">
                                <User className="w-3 h-3 mr-1" /> {task.assignee || "Unassigned"}
                              </div>
                              {task.due_date && (
                                <div className="inline-flex items-center text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                                  <Clock className="w-3 h-3 mr-1" /> {new Date(task.due_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {isPending ? (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="ghost" size="sm" className="flex-1 sm:flex-none text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTask(task.id)}>Remove</Button>
                            <Button size="sm" className="flex-1 sm:flex-none" onClick={() => setApprovingTask(task)}>Approve</Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isCompleted && (
                              <Button variant="ghost" size="icon" onClick={() => syncToCalendar(task)} className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10" title="Sync to Calendar">
                                <CalendarPlus className="h-4 w-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md h-8 w-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!isCompleted && (
                                  <>
                                    <DropdownMenuItem onClick={() => setApprovingTask(task)}>Reschedule Task</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTask(task.id)}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DECISIONS TAB */}
        <TabsContent value="decisions" className="mt-6">
          <Card className="border-border/50 shadow-sm">
             <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                Key Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                {!meeting.decisions || meeting.decisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No decisions recorded.</p>
                ) : (
                  meeting.decisions.map((decision: any) => (
                    <div key={decision.id} className="p-4 border-l-4 border-l-purple-500 bg-purple-500/5 rounded-r-xl">
                      <h4 className="font-semibold text-sm text-foreground">{decision.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">Decision Maker: {decision.decision_maker}</p>
                      {decision.impact && <p className="text-sm mt-2">Impact: {decision.impact}</p>}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRANSCRIPT TAB */}
        <TabsContent value="transcript" className="mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {meeting.transcript?.full_text || "Transcript processing or not available."}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ASSISTANT TAB */}
        <TabsContent value="assistant" className="mt-6">
          <Card className="flex flex-col border-border/50 shadow-sm h-[600px] relative overflow-hidden">
            <CardHeader className="border-b bg-card/50 backdrop-blur-sm z-10 px-6 py-4 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-primary" />
                Meeting AI Assistant
              </CardTitle>
              <CardDescription>Ask questions about {meeting.title}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative z-10 bg-muted/10">
              <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
                <div className="space-y-6 pb-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-4 ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-card border text-foreground"
                      }`}>
                        {msg.role === "assistant" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      
                      <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                          msg.role === "assistant" 
                            ? "bg-card border border-border/50 text-foreground" 
                            : "bg-primary text-primary-foreground"
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isChatLoading && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
                        <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-card border border-border/50 shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t bg-card/80 backdrop-blur-sm flex-shrink-0">
                <div className="relative flex items-center w-full mx-auto">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask a question about this meeting..."
                    className="pr-12 h-14 bg-background border-border shadow-sm rounded-full pl-6"
                    disabled={isChatLoading}
                  />
                  <Button
                    size="icon"
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="absolute right-2 h-10 w-10 rounded-full"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval & Scheduling Modal */}
      <Dialog open={!!approvingTask} onOpenChange={(open) => !open && setApprovingTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{approvingTask?.status === 'pending' ? 'Schedule Task' : 'Reschedule Task'}</DialogTitle>
            <DialogDescription>
              Assign a due date and time for this task before approving it to your list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time (Optional)</label>
              <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingTask(null)}>Cancel</Button>
            <Button onClick={submitApproval}>Approve & Sync</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
