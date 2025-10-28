"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
     Card,
     CardContent,
     CardDescription,
     CardFooter,
     CardHeader,
     CardTitle,
} from "@/components/ui/card";
import {
     Alert,
     AlertDescription,
} from "@/components/ui/alert";
import { Loader2, Mail, Lock, Sparkles } from "lucide-react";

export function LoginForm() {
     const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");
     const [companyCode, setCompanyCode] = useState("");
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState("");
     const router = useRouter();

     const handleSubmit = async (e: any) => {
          e.preventDefault();
          setIsLoading(true);
          setError("");

          try {
               const response = await fetch(
                    "/api/auth/login",
                    {
                         method: "POST",
                         headers: {
                              "Content-Type":
                                   "application/json",
                         },
                         body: JSON.stringify({
                              email,
                              password,
                              companyCode,
                         }),
                    }
               );

               const data = await response.json();

               if (response.ok) {
                    console.log("Login response data:", data);
                    console.log("User data:", data.user);
                    console.log("User role:", data.user.role);
                    console.log("User isAdmin:", data.user.isAdmin);

                    // Store user data in localStorage (in production, use proper session management)
                    localStorage.setItem(
                         "user",
                         JSON.stringify(data.user)
                    );
                    localStorage.setItem(
                         "token",
                         data.token
                    );
                    localStorage.setItem(
                         "tenant",
                         JSON.stringify(data.tenant)
                    );

                    // Redirect based on role and admin status
                    const isAdminUser = data.user.isAdmin || data.user.role === "superadmin" || data.user.role === "admin";
                    console.log("Is admin user:", isAdminUser);

                    if (isAdminUser) {
                         console.log("Redirecting to admin panel");
                         router.push("/admin");
                    } else {
                         console.log("Redirecting to dashboard");
                         router.push("/dashboard");
                    }
               } else {
                    setError(
                         data.message || "Login failed"
                    );
               }
          } catch (error) {
               setError(
                    "An error occurred. Please try again."
               );
          } finally {
               setIsLoading(false);
          }
     };

     return (
          <Card className="w-full max-w-md border-0 transform overflow-hidden p-10">
               <CardHeader className="relative space-y-4 text-center pb-2">
                    {/* Animated Logo */}
                    <div className="flex justify-center mb-4">
                         <div className="relative">
                              <div className="p-4 bg-gradient-to-r from-slate-500 via-gray-500 to-slate-500 rounded-2xl shadow-lg animate-pulse-glow">
                                   <Sparkles className="w-8 h-8 text-white" />
                              </div>
                              {/* Floating particles */}
                              <div className="absolute -top-2 -right-2 w-3 h-3 bg-gray-400 rounded-full animate-ping"></div>
                              <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-gray-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                         </div>
                    </div>

                    <CardTitle className="text-3xl font-bold text-black bg-clip-text">
                         Daily Report
                    </CardTitle>
               </CardHeader>

               <form onSubmit={handleSubmit} className="relative">
                    <CardContent className="space-y-6 pb-6">
                         {error && (
                              <Alert
                                   variant="destructive"
                                   className="border-red-200 bg-red-50/80 backdrop-blur-sm animate-shake"
                              >
                                   <AlertDescription className="flex items-center text-red-700 font-medium">
                                        <svg
                                             className="w-5 h-5 mr-2 flex-shrink-0"
                                             fill="currentColor"
                                             viewBox="0 0 20 20"
                                             xmlns="http://www.w3.org/2000/svg"
                                        >
                                             <path
                                                  fillRule="evenodd"
                                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                  clipRule="evenodd"
                                             />
                                        </svg>
                                        {error}
                                   </AlertDescription>
                              </Alert>
                         )}

                         <div className="space-y-3">
                              <Label
                                   htmlFor="companyCode"
                                   className="text-slate-700 font-semibold text-sm uppercase tracking-wide"
                              >
                                   Company Code
                              </Label>
                              <div className="relative group">
                                   <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                   </svg>
                                   <Input
                                        id="companyCode"
                                        type="text"
                                        placeholder="Enter your company code"
                                        value={companyCode}
                                        onChange={(e) =>
                                             setCompanyCode(
                                                  e.target
                                                       .value
                                             )
                                        }
                                        required
                                        className="pl-12 h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 rounded-xl text-base bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white"
                                   />
                                   <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-focus-within:from-blue-500/5 group-focus-within:via-blue-500/10 group-focus-within:to-purple-500/5 transition-all duration-500 pointer-events-none"></div>
                              </div>
                         </div>

                         <div className="space-y-3">
                              <Label
                                   htmlFor="email"
                                   className="text-slate-700 font-semibold text-sm uppercase tracking-wide"
                              >
                                   Email Address
                              </Label>
                              <div className="relative group">
                                   <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                                   <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) =>
                                             setEmail(
                                                  e.target
                                                       .value
                                             )
                                        }
                                        required
                                        className="pl-12 h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 rounded-xl text-base bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white"
                                   />
                                   <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-focus-within:from-blue-500/5 group-focus-within:via-blue-500/10 group-focus-within:to-purple-500/5 transition-all duration-500 pointer-events-none"></div>
                              </div>
                         </div>

                         <div className="space-y-3">
                              <Label
                                   htmlFor="password"
                                   className="text-slate-700 font-semibold text-sm uppercase tracking-wide"
                              >
                                   Password
                              </Label>
                              <div className="relative group">
                                   <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors duration-300" />
                                   <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) =>
                                             setPassword(
                                                  e.target
                                                       .value
                                             )
                                        }
                                        required
                                        className="pl-12 h-14 border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 rounded-xl text-base bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white"
                                   />
                                   <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-focus-within:from-purple-500/5 group-focus-within:via-purple-500/10 group-focus-within:to-pink-500/5 transition-all duration-500 pointer-events-none"></div>
                              </div>
                         </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 pt-0">
                         <Button
                              type="submit"
                              className="w-full h-14 text-base font-semibold bg-gray-500 hover:bg-gray-600 text-white transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-xl hover:shadow-2xl rounded-xl border-0 relative overflow-hidden group"
                              disabled={isLoading}
                         >
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                              {isLoading ? (
                                   <div className="flex items-center justify-center">
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                        <span>Signing in...</span>
                                   </div>
                              ) : (
                                   <>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Sign In
                                   </>
                              )}
                         </Button>
                    </CardFooter>
               </form>
          </Card>
     );
}
