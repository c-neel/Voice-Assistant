"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Clock, FileText, Zap, Loader2, Calendar as CalendarIcon, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [meetingsData, tasksData] = await Promise.all([
          fetchApi("/meetings"),
          fetchApi("/tasks")
        ]);
        setMeetings(meetingsData.meetings || []);
        setTasks(tasksData.tasks || tasksData || []);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Basic Stats
  const totalMeetings = meetings.length;
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const avgQuality = totalMeetings > 0 
    ? Math.round(meetings.reduce((acc, m) => acc + (m.quality_score || 0), 0) / totalMeetings)
    : 0;
  
  const recentMeetings = meetings.slice(0, 4);

  // Infographics Data
  const taskStatusData = [
    { name: 'Pending', value: pendingTasks, color: '#f59e0b' }, // Amber 500
    { name: 'Completed', value: completedTasks, color: '#10b981' } // Emerald 500
  ];

  // Group meetings by day for the last 7 days
  const getMeetingChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      
      const count = meetings.filter(m => {
        if (!m.meeting_date) return false;
        const mDate = new Date(m.meeting_date);
        return mDate.toDateString() === d.toDateString();
      }).length;
      
      data.push({ name: dayName, meetings: count });
    }
    return data;
  };
  const meetingChartData = getMeetingChartData();

  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-base">Welcome back. Here's an overview of your meeting intelligence.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/meetings/upload">
            <Button variant="outline" className="shadow-sm">
              <FileText className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </Link>
          <Link href="/meetings/record">
            <Button className="shadow-sm">
              <Zap className="mr-2 h-4 w-4" />
              New Voice Meeting
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
              <CalendarIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <div className="text-3xl font-bold">{totalMeetings}</div>
                <p className="text-xs text-muted-foreground mt-1">Processed by AI</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <div className="text-3xl font-bold">{pendingTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">Require your action</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <div className="text-3xl font-bold">{completedTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">Successfully resolved</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Quality Score</CardTitle>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> : (
              <>
                <div className="text-3xl font-bold">{avgQuality}/100</div>
                <p className="text-xs text-muted-foreground mt-1">Based on clarity & outcomes</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Infographics Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              Meeting Volume (Last 7 Days)
            </CardTitle>
            <CardDescription>Number of meetings processed daily.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            {isLoading ? (
               <div className="flex justify-center items-center h-[250px]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={meetingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="meetings" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-muted-foreground" />
              Task Breakdown
            </CardTitle>
            <CardDescription>Ratio of pending to completed action items.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? (
               <div className="flex justify-center items-center h-[250px]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : tasks.length === 0 ? (
               <div className="flex justify-center items-center h-[250px] text-muted-foreground text-sm">No tasks generated yet.</div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-1">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Recent Meetings</CardTitle>
            <CardDescription>
              Your most recently analyzed meetings and documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : recentMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">No meetings found.</p>
              ) : (
                recentMeetings.map(meeting => (
                  <div key={meeting.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border">
                        <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm line-clamp-1">{meeting.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : 'No date'} • {meeting.source === 'voice_recording' ? 'Voice Recording' : 'Document'}
                        </p>
                      </div>
                    </div>
                    <Link href={`/meetings/${meeting.id}`}>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
