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
import { FileText, LogOut, User, Settings } from "lucide-react";
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
     const { checkAndCreateNotifications } = useNotifications(user?.id || '');

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
               checkAndCreateNotifications();
          }
     }, [user, checkAndCreateNotifications]);

     useEffect(() => {
          const onVisible = () => {
               if (document.visibilityState === 'visible' && user) {
                    checkAndCreateNotifications();
               }
          };
          const onUserUpdated = () => {
               if (user) checkAndCreateNotifications();
          };
          window.addEventListener('visibilitychange', onVisible);
          window.addEventListener('userUpdated', onUserUpdated as EventListener);
          return () => {
               window.removeEventListener('visibilitychange', onVisible);
               window.removeEventListener('userUpdated', onUserUpdated as EventListener);
          };
     }, [user, checkAndCreateNotifications]);

     const handleLogout = () => {
          localStorage.removeItem("user");
          router.push("/");
     };

     if (!user) {
          return (
               <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-3">
                         <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-slate-600 font-medium">
                              Loading dashboard...
                         </p>
                    </div>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
               <header className="bg-white border-b border-slate-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         <div className="flex justify-between items-center py-4">
                              <div className="flex items-center space-x-3">
                                   <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-600 rounded-xl shadow-md">
                                        <FileText className="h-6 w-6 text-white" />
                                   </div>
                                   <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                        Daily Report Tool
                                   </h1>
                              </div>

                              <div className="flex items-center gap-3">
                                   <NotificationPanel userId={user.id} />

                                   <DropdownMenu>
                                        <DropdownMenuTrigger
                                             asChild
                                        >
                                             <Button
                                                  variant="ghost"
                                                  className="relative h-12 w-12 rounded-full hover:bg-slate-100 transition-colors duration-200 p-0 overflow-hidden"
                                             >
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
                                                       width={48}
                                                       height={
                                                            48
                                                       }
                                                       className="rounded-full object-cover h-full w-full"
                                                       unoptimized
                                                  />
                                             </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                             className="w-64 bg-white border-slate-200 shadow-xl rounded-xl overflow-hidden"
                                             align="end"
                                             forceMount
                                        >
                                             <DropdownMenuLabel className="p-4 border-b border-slate-100">
                                                  <div className="flex flex-col space-y-1">
                                                       <p className="text-sm font-semibold text-slate-900">
                                                            {
                                                                 user.name
                                                            }
                                                       </p>
                                                       <p className="text-xs text-slate-500 truncate">
                                                            {
                                                                 user.email
                                                            }
                                                       </p>
                                                       <p className="text-xs text-slate-500">
                                                            {
                                                                 user.department
                                                            }
                                                       </p>
                                                  </div>
                                             </DropdownMenuLabel>
                                             <DropdownMenuSeparator className="bg-slate-100" />
                                             <DropdownMenuItem
                                                  asChild
                                                  className="group hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                                             >
                                                  <Link
                                                       href="/profile"
                                                       className="flex items-center"
                                                  >
                                                       <User className="mr-3 h-4 w-4 text-slate-500 group-hover:text-gray-600 transition-colors" />
                                                       <span className="text-slate-700 group-hover:text-gray-600">
                                                            Profile
                                                       </span>
                                                  </Link>
                                             </DropdownMenuItem>
                                             <DropdownMenuItem
                                                  asChild
                                                  className="group hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                                             >
                                                  <Link
                                                       href="/debug"
                                                       className="flex items-center"
                                                  >
                                                       <Settings className="mr-3 h-4 w-4 text-slate-500 group-hover:text-gray-600 transition-colors" />
                                                       <span className="text-slate-700 group-hover:text-gray-600">
                                                            Debug
                                                       </span>
                                                  </Link>
                                             </DropdownMenuItem>
                                             <DropdownMenuSeparator className="bg-slate-100" />
                                             <DropdownMenuItem
                                                  onClick={
                                                       handleLogout
                                                  }
                                                  className="group hover:bg-red-50 hover:text-red-600 transition-colors duration-150 cursor-pointer"
                                             >
                                                  <LogOut className="mr-3 h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors" />
                                                  <span className="font-medium">
                                                       Log out
                                                  </span>
                                             </DropdownMenuItem>
                                        </DropdownMenuContent>
                                   </DropdownMenu>
                              </div>
                         </div>
                    </div>
               </header>

               <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                         {children}
                    </div>
               </main>
          </div>
     );
}
