import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account preferences and AI settings.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
         <CardHeader>
           <CardTitle>Profile Settings</CardTitle>
           <CardDescription>Update your personal information.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="john.doe@example.com" />
            </div>
            <Button>Save Changes</Button>
         </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
         <CardHeader>
           <CardTitle>AI Preferences</CardTitle>
           <CardDescription>Configure how Gemini analyzes your meetings.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="model">Preferred Model</Label>
              <Input id="model" defaultValue="gemini-2.5-flash" disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tone">Summary Tone</Label>
              <Input id="tone" defaultValue="Professional & Concise" />
            </div>
            <Button variant="outline">Update Preferences</Button>
         </CardContent>
      </Card>
    </div>
  );
}
