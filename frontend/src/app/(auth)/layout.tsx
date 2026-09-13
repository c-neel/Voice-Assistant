import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 space-y-8 bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative z-10">
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-block group mb-4">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30 mx-auto group-hover:scale-110 transition-transform duration-300">
               <Zap className="w-6 h-6 text-white" />
             </div>
          </Link>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 tracking-tight">
            GLS NEXUS
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
