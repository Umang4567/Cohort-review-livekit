import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import "@livekit/components-styles";
import { Metadata } from "next";
import { Inter, Playfair_Display, Fira_Code } from "next/font/google";
import { FuturisticBackground } from "@/components/ui/futuristic-background";
import { cn } from "@/lib/utils";
// import { FuturisticBackground } from "@/components/ui/futuristic-background";

const inter = Inter({
  weight: "400",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira-code',
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
        playfair.variable,
        firaCode.variable,
        'font-sans antialiased bg-gradient-to-br from-[#0e0f23] to-[#1c1d3f] min-h-screen'
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="ambient-bg min-h-screen">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
