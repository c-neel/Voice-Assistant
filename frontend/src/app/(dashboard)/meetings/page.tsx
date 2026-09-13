"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, FileText, Zap, ArrowRight, MoreHorizontal, Calendar, Clock, Loader2 } from "lucide-react";
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
import { fetchApi } from "@/lib/api";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const data = await fetchApi("/meetings");
        setMeetings(data.meetings || []);
      } catch (err) {
        console.error("Failed to load meetings", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMeetings();
  }, []);
  const handleDeleteMeeting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await fetchApi(`/meetings/${id}`, { method: 'DELETE' });
      setMeetings(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Failed to delete meeting", err);
      alert("Failed to delete meeting");
    }
  };

  const handleShare = async (id: string, title: string) => {
    const url = `${window.location.origin}/meetings/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Meeting Notes: ${title}`,
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
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meeting History</h2>
          <p className="text-muted-foreground mt-1">Browse, search, and review past meetings and uploaded documents.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/meetings/upload">
            <Button variant="outline">
              Upload Document
            </Button>
          </Link>
          <Link href="/meetings/record">
            <Button className="shadow-lg shadow-primary/20">
              <Zap className="mr-2 h-4 w-4" />
              New Meeting
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-lg blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search meetings by title or content..." className="pl-9 bg-card/60 backdrop-blur-md border-border/50" />
          </div>
        </div>
        <Button variant="outline" className="bg-card/50 backdrop-blur-md hover:bg-muted/80">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : meetings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No meetings found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">Upload a document or record a voice meeting to get started.</p>
              <Link href="/meetings/upload" className="mt-4">
                <Button>Upload Document</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          meetings.map((meeting) => (
            <Card key={meeting.id} className="hover:border-primary/50 transition-all duration-300 group bg-card/40 backdrop-blur-md hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                      <FileText className="h-6 w-6 text-blue-500 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <Link href={`/meetings/${meeting.id}`} className="hover:underline decoration-primary underline-offset-4">
                        <h3 className="font-semibold text-lg">{meeting.title}</h3>
                      </Link>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : 'No date'}</span>
                        {meeting.duration_seconds && (
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {Math.round(meeting.duration_seconds / 60)} min</span>
                        )}
                        <span className="text-primary/80 font-medium">Quality Score: {meeting.quality_score || 0}/100</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 max-w-2xl line-clamp-2">
                        {meeting.summaries && meeting.summaries.length > 0 
                          ? meeting.summaries[0].executive_summary 
                          : "No summary available."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <Link href={`/meetings/${meeting.id}`}>
                      <Button variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        Review <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md h-9 w-9 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleShare(meeting.id, meeting.title)}>Share Link</DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <Link href={`/meetings/${meeting.id}`}>Export PDF (View First)</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteMeeting(meeting.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
