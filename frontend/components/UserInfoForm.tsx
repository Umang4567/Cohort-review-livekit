"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface UserInfo {
  name: string;
  email: string;
  skillLevel: "junior" | "mid" | "senior" | "staff";
  courseName: string;
  experience?: string;
}

interface UserInfoFormProps {
  onSubmit: (userInfo: UserInfo) => void;
}

export default function UserInfoForm({ onSubmit }: UserInfoFormProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "",
    email: "",
    skillLevel: "mid",
    courseName: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (userInfo.name.trim() && userInfo.email.trim()) {
      onSubmit(userInfo);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white w-full p-4 min-w-full bg-gradient-to-br from-[#0e0f23] to-[#1c1d3f]">
      <div className="w-full max-w-xl rounded-2xl shadow-2xl p-8 border border-white/10 animate-fade-in bg-opacity- backdrop-blur-sm bg-blue-900">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white">Cohort Review Bot</h1>
          {/* <p className="text-blue-300 mt-2">
            Please provide your information to start the feedback session
          </p> */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium mb-1 text-white">Full Name</Label>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={userInfo.name}
              onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
              // className="w-full px-4 py-2 border border-white/20 rounded-lg bg-[#1c1c1c] text-white focus-visible:border-blue-500 focus-visible:ring-0"
              className="bg-black border border-white/20 text-white placeholder-white/40 focus-visible:ring-blue-500 "
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium mb-1 text-white">Email Address</Label>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={userInfo.email}
              onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
              className="bg-black border border-white/20 text-white placeholder-white/40 focus-visible:ring-blue-500"
              required
            />
          </div>

          <div>
            <Label className="block text-sm font-medium mb-1">Course Name</Label>
            <Input
              type="text"
              placeholder="Enter the course name"
              value={userInfo.courseName}
              onChange={(e) =>
                setUserInfo({ ...userInfo, courseName: e.target.value })
              }
              className="bg-black border border-white/20 text-white placeholder-white/40 focus-visible:ring-blue-500 "
              required
            />
          </div>

          {/* <div>
            <Label className="block text-sm font-medium mb-1 text-white">Experience Level</Label>
            <Select
              value={userInfo.skillLevel}
              defaultValue="mid"
              onValueChange={(value) =>
                setUserInfo({ ...userInfo, skillLevel: value as UserInfo["skillLevel"] })
              }
            >
              <SelectTrigger className="bg-[#1c1c1c] border border-white/20 text-white rounded-lg">
                <SelectValue placeholder="Select an experience level" />
              </SelectTrigger>
              <SelectContent className="bg-[#1c1c1c] text-white border border-white/20">
                <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                <SelectItem value="mid">Mid-level (2-5 years)</SelectItem>
                <SelectItem value="senior">Senior (5-8 years)</SelectItem>
                <SelectItem value="staff">Staff/Principal (8+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          <Button
            type="submit"
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-300"
            disabled={
              !userInfo.name || !userInfo.email || !userInfo.courseName || !userInfo.skillLevel || isLoading
            }
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Start Feedback"}
          </Button>
        </form>
      </div>
    </div>
  );
}
