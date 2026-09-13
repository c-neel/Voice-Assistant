"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Calendar as CalendarIcon, User, Plus, Filter, MoreHorizontal, CalendarPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchApi } from "@/lib/api";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "completed">("pending");
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Approval Modal State
  const [approvingTask, setApprovingTask] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await fetchApi("/tasks");
        setTasks(data.tasks || []);
      } catch (err) {
        console.error("Failed to fetch tasks", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, []);

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await fetchApi(`/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
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
      
      // Open Google Calendar if scheduled
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

      setTasks(prev => prev.map(t => t.id === approvingTask.id ? { ...t, approved: true, status: 'in_progress', due_date: finalDueDate } : t));
      
      setApprovingTask(null);
      setSelectedDate("");
      setSelectedTime("");
    } catch (err) {
      console.error("Failed to approve task", err);
      alert("Failed to approve task");
    }
  };

  const handleApproveAll = async () => {
    const pendingIds = pendingTasks.map(t => t.id);
    for (const id of pendingIds) {
      try {
        await fetchApi(`/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ approved: true, status: 'in_progress' })
        });
        setTasks(prev => prev.map(t => t.id === id ? { ...t, approved: true, status: 'in_progress' } : t));
      } catch (err) {
        console.error("Failed to approve task", err);
      }
    }
  };

  const handleToggleComplete = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    try {
      await fetchApi(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
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

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const approvedTasks = tasks.filter(t => t.status !== "pending" && t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Task Automation</h2>
          <p className="text-muted-foreground mt-1">Review AI-extracted tasks and sync them to your calendar.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            New Manual Task
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending Review ({pendingTasks.length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "approved"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Upcoming Tasks ({approvedTasks.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "completed"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="space-y-4">
          <Card className="border-amber-500/20 shadow-sm bg-amber-500/5">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base text-amber-700 dark:text-amber-400">Review Required</CardTitle>
                  <CardDescription className="text-amber-900/70 dark:text-amber-200/70">
                    The AI detected these action items in recent meetings. Approve them to add to your queue.
                  </CardDescription>
                </div>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleApproveAll}>
                  Approve All
                </Button>
              </div>
            </CardHeader>
          </Card>

          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : pendingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending tasks found.</p>
          ) : (
            pendingTasks.map(task => (
              <div key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-card gap-4">
                <div className="flex gap-4 flex-1">
                  <div className="mt-1">
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Source: AI Analysis • Confidence: {Math.round((task.confidence_score || 0.9) * 100)}%
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="inline-flex items-center text-xs bg-muted px-2 py-1 rounded-md">
                        <User className="w-3 h-3 mr-1" /> {task.assignee || "Unassigned"}
                      </div>
                      {task.due_date && (
                        <div className="inline-flex items-center text-xs bg-muted px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3 mr-1 text-destructive" /> {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="ghost" size="sm" className="flex-1 sm:flex-none text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTask(task.id)}>Remove</Button>
                  <Button size="sm" className="flex-1 sm:flex-none" onClick={() => setApprovingTask(task)}>Approve</Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "approved" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-medium text-muted-foreground">Upcoming Tasks</h3>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : approvedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved tasks found.</p>
          ) : (
            approvedTasks.map(task => (
              <div key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-card gap-4 group">
                <div className="flex gap-4 flex-1">
                  <div className="mt-1">
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-primary bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors flex items-center justify-center"
                      onClick={() => handleToggleComplete(task)}
                    >
                      {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-primary" />}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">{task.title}</h4>
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
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => syncToCalendar(task)} className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10" title="Sync to Calendar">
                    <CalendarPlus className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md h-8 w-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setApprovingTask(task)}>Reschedule Task</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTask(task.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "completed" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-medium text-muted-foreground">Completed Tasks</h3>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : completedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed tasks yet.</p>
          ) : (
            completedTasks.map(task => (
              <div key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-card gap-4 group opacity-75">
                <div className="flex gap-4 flex-1">
                  <div className="mt-1">
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-primary bg-primary cursor-pointer hover:bg-primary/80 transition-colors flex items-center justify-center"
                      onClick={() => handleToggleComplete(task)}
                    >
                      <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm line-through text-muted-foreground">{task.title}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="inline-flex items-center text-xs bg-muted px-2 py-1 rounded-md">
                        <User className="w-3 h-3 mr-1" /> {task.assignee || "Unassigned"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md h-8 w-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTask(task.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Approval & Scheduling Modal */}
      <Dialog open={!!approvingTask} onOpenChange={(open) => !open && setApprovingTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Task</DialogTitle>
            <DialogDescription>
              Assign a due date and time for this task before approving it to your list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time (Optional)</label>
              <Input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} />
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
