import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import "@livekit/components-styles";
import { Metadata } from "next";
import { Poppins } from "next/font/google";
import { FuturisticBackground } from "@/components/ui/futuristic-background";
import { cn } from "@/lib/utils";
import FeedbackHeader from "./components/Header";
// import { FuturisticBackground } from "@/components/ui/futuristic-background";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "Course Feedback",
  description: "Share your thoughts on the course",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn(
        poppins.variable,
        'font-sans antialiased bg-gradient-to-br from-[#0e0f23] to-[#1c1d3f] min-h-screen'
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="ambient-bg min-h-screen relative">
            <FeedbackHeader />
            <div className="pt-40">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
