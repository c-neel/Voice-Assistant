import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, CheckSquare } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground mt-1">Manage your schedule and synchronize tasks with Google Calendar.</p>
        </div>
        <Button>
          <CalendarIcon className="mr-2 h-4 w-4" /> Sync with Google
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm min-h-[500px] flex items-center justify-center">
         <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <CalendarIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Calendar Integration Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mb-6">
               Connect your Google Calendar to automatically schedule meetings, block off time for your AI-generated tasks, and get meeting reminders.
            </p>
            <Button variant="outline">Learn More</Button>
         </CardContent>
      </Card>
    </div>
  );
}
