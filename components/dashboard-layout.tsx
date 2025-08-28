"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
     DropdownMenu,
     DropdownMenuContent,
     DropdownMenuItem,
     DropdownMenuLabel,
     DropdownMenuSeparator,
     DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, LogOut, User, Settings, Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { NotificationPanel } from "@/components/notification-panel";
import { useNotifications } from "@/hooks/use-notifications";

interface DashboardLayoutProps {
     children: React.ReactNode;
}

export function DashboardLayout({
     children,
}: DashboardLayoutProps) {
     const [user, setUser] = useState<any | null>(null);
     const router = useRouter();
     const { fetchNotifications } = useNotifications(user?.id || '');

     useEffect(() => {
          const userData = localStorage.getItem("user");
          if (userData) {
               console.log(
                    "User data from localStorage:",
                    JSON.parse(userData)
               );
               setUser(JSON.parse(userData));
          } else {
               router.push("/");
          }
     }, [router]);

     useEffect(() => {
          const handleVisibilityChange = () => {
               if (document.visibilityState === "visible") {
                    const updatedUserData =
                         localStorage.getItem("user");
                    if (updatedUserData) {
                         setUser(
                              JSON.parse(updatedUserData)
                         );
                    }
               }
          };
          const handleUserUpdated = () => {
               const updatedUserData = localStorage.getItem("user");
               if (updatedUserData) {
                    setUser(JSON.parse(updatedUserData));
               }
          };
          window.addEventListener(
               "visibilitychange",
               handleVisibilityChange
          );
          window.addEventListener("userUpdated", handleUserUpdated as EventListener);
          return () => {
               window.removeEventListener(
                    "visibilitychange",
                    handleVisibilityChange
               );
               window.removeEventListener("userUpdated", handleUserUpdated as EventListener);
          };
     }, []);

     useEffect(() => {
          if (user) {
               fetchNotifications();
          }
     }, [user, fetchNotifications]);



     const handleLogout = () => {
          localStorage.removeItem("user");
          router.push("/");
     };

     if (!user) {
          return (
               <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center relative overflow-hidden">
                    {/* Beautiful Loading Background */}
                    <div className="absolute inset-0">
                         <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
                         <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center space-y-6">
                         <div className="relative">
                              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center animate-pulse-glow">
                                   <FileText className="w-8 h-8 text-white" />
                              </div>
                              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                         </div>

                         <div className="text-center">
                              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent mb-2">
                                   Loading Dashboard
                              </h2>
                              <p className="text-slate-600 font-medium">
                                   Please wait while we prepare your workspace...
                              </p>
                         </div>

                         {/* Beautiful Loading Animation */}
                         <div className="flex space-x-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                         </div>
                    </div>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative overflow-hidden">
               {/* Beautiful Background Elements */}
               <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
               </div>

               {/* Enhanced Header */}
               <header className="relative z-10 glass border-b border-white/20 shadow-lg backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         <div className="flex justify-between items-center py-6">
                              {/* Logo and Title */}
                              <div className="flex items-center space-x-4">
                                   <div className="relative group">
                                        <div className="p-3 bg-gray-500 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                                             <FileText className="h-7 w-7 text-white" />
                                        </div>
                                   </div>

                                   <div>
                                        <h1 className="text-2xl font-bold text-black bg-black">
                                             Daily Report
                                        </h1>
                                        <p className="text-sm text-slate-600 font-medium">
                                             Welcome back, {user.name}!
                                        </p>
                                   </div>
                              </div>

                              {/* Right Side Actions */}
                              <div className="flex items-center gap-4">
                                   {/* Notification Panel */}
                                   <div className="relative">
                                        <NotificationPanel userId={user._id || user.id} />
                                   </div>

                                   {/* User Profile Dropdown */}
                                   <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                             <Button
                                                  variant="ghost"
                                                  className="relative h-14 w-auto px-4 rounded-2xl hover:bg-white/20 transition-all duration-300 group border border-white/20 hover:border-white/40"
                                             >
                                                  <div className="flex items-center space-x-3">
                                                       <div className="relative">
                                                            <Image
                                                                 src={
                                                                      user.profileImage &&
                                                                           user
                                                                                .profileImage
                                                                                .length >
                                                                           0
                                                                           ? user.profileImage
                                                                           : "/placeholder.svg?height=48&width=48"
                                                                 }
                                                                 alt={
                                                                      user.name
                                                                 }
                                                                 width={40}
                                                                 height={
                                                                      40
                                                                 }
                                                                 className="rounded-xl object-cover h-10 w-10 ring-2 ring-white/50 group-hover:ring-white/80 transition-all duration-300"
                                                                 unoptimized
                                                            />
                                                            {/* Online indicator */}
                                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                                                       </div>

                                                       <div className="text-left">
                                                            <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                                                                 {user.name}
                                                            </p>
                                                            <p className="text-xs text-slate-600 group-hover:text-slate-700 transition-colors">
                                                                 {user.department}
                                                            </p>
                                                       </div>

                                                       <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-slate-700 transition-colors" />
                                                  </div>
                                             </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent
                                             className="w-72 glass border-white/20 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-md"
                                             align="end"
                                             forceMount
                                        >
                                             <DropdownMenuLabel className="p-6 border-b border-white/20 bg-purple-50/50">
                                                  <div className="flex flex-col space-y-2">
                                                       <p className="text-lg font-semibold text-slate-900">
                                                            {user.name}
                                                       </p>
                                                       <p className="text-sm text-slate-600 truncate">
                                                            {user.email}
                                                       </p>
                                                       <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full">
                                                            <span className="text-xs font-medium text-gray-700">
                                                                 {user.department}
                                                            </span>
                                                       </div>
                                                  </div>
                                             </DropdownMenuLabel>

                                             <div className="p-2">
                                                  <DropdownMenuItem
                                                       asChild
                                                       className="group hover:bg-white/20 transition-all duration-200 cursor-pointer rounded-xl p-3"
                                                  >
                                                       <Link
                                                            href="/profile"
                                                            className="flex items-center"
                                                       >
                                                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors duration-200 mr-3">
                                                                 <User className="h-4 w-4 text-gray-600" />
                                                            </div>
                                                            <span className="text-slate-700 group-hover:text-slate-900 font-medium">
                                                                 Profile Settings
                                                            </span>
                                                       </Link>
                                                  </DropdownMenuItem>

                                                  <DropdownMenuSeparator className="bg-white/20 my-2" />

                                                  <DropdownMenuItem
                                                       onClick={handleLogout}
                                                       className="group hover:bg-gray-50 hover:text-gray-600 transition-all duration-200 cursor-pointer rounded-xl p-3"
                                                  >
                                                       <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors duration-200 mr-3">
                                                            <LogOut className="h-4 w-4 text-gray-600" />
                                                       </div>
                                                       <span className="font-medium">
                                                            Sign Out
                                                       </span>
                                                  </DropdownMenuItem>
                                             </div>
                                        </DropdownMenuContent>
                                   </DropdownMenu>
                              </div>
                         </div>
                    </div>
               </header >

               {/* Main Content */}
               <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8" >
                    <div className="glass rounded-3xl border border-white/20 shadow-2xl backdrop-blur-md p-8">
                         {children}
                    </div>
               </main >
          </div >
     );
}
