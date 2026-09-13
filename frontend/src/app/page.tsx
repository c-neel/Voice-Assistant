import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, FileText, Zap, BrainCircuit, CheckCircle, Calendar } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="px-6 lg:px-8 h-16 flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">GLS NEXUS</span>
        </div>
        <nav className="hidden md:flex gap-6">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How it Works</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-sm font-medium">Log in</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="text-sm font-medium shadow-lg shadow-primary/20">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 xl:py-48 flex justify-center text-center relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50 pointer-events-none" />
          
          <div className="container px-4 md:px-6 flex flex-col items-center gap-8 max-w-[800px]">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Gemini 1.5 Flash Integration Live
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Meeting Intelligence & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Task Automation</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-[600px] leading-relaxed">
              Transform hours of meetings and documents into structured minutes, actionable tasks, and deep insights in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base shadow-xl shadow-primary/25 hover:scale-105 transition-transform">
                  Start for free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                  View Live Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="w-full py-20 bg-secondary/30 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Capture. Understand. Act.</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg/relaxed">
                GLS NEXUS orchestrates the entire meeting lifecycle.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="flex flex-col items-start space-y-4 p-6 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Mic className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Voice Transcription</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Record directly in the browser or upload audio. Powered by Faster-Whisper for high-accuracy, private transcription.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-start space-y-4 p-6 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold">Smart Document Analysis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload PDFs, DOCX, or CSVs. The system extracts text and runs it through the exact same intelligence pipeline.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-start space-y-4 p-6 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <BrainCircuit className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold">AI Minutes (MOM)</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generates an executive summary, topic breakdowns, and key decisions made during the meeting instantly.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-start space-y-4 p-6 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold">Task Extraction</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Automatically detects action items, assignees, and deadlines, and places them into your pending approval queue.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="flex flex-col items-start space-y-4 p-6 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold">Calendar Sync</h3>
                <p className="text-muted-foreground leading-relaxed">
                  One-click export of approved tasks and deadlines directly to your Google Calendar.
                </p>
              </div>
              
              {/* Feature 6 */}
              <div className="flex flex-col items-start space-y-4 p-6 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-pink-500/10 rounded-xl">
                  <Zap className="w-6 h-6 text-pink-500" />
                </div>
                <h3 className="text-xl font-bold">RAG Assistant</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ask questions across all your past meetings. "What did we decide about the Q3 budget?"
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 md:py-16 bg-background flex justify-center">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-semibold">GLS NEXUS</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Built with Next.js, FastAPI, and Google Gemini Flash.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Terms</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
