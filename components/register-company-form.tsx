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
import { Loader2, Building, Mail, Lock, Sparkles } from "lucide-react";

export function RegisterCompanyForm() {
     const [companyName, setCompanyName] = useState("");
     const [adminEmail, setAdminEmail] = useState("");
     const [adminPassword, setAdminPassword] = useState("");
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState("");
     const [success, setSuccess] = useState("");
     const router = useRouter();

     const handleSubmit = async (e: any) => {
          e.preventDefault();
          setIsLoading(true);
          setError("");
          setSuccess("");

          try {
               const response = await fetch(
                    "/api/register-company",
                    {
                         method: "POST",
                         headers: {
                              "Content-Type":
                                   "application/json",
                         },
                         body: JSON.stringify({
                              companyName,
                              adminEmail,
                              adminPassword,
                         }),
                    }
               );

               const data = await response.json();

               if (response.ok) {
                    setSuccess(`Company registered successfully! Your company code is: ${data.slug}`);
                    // Clear form
                    setCompanyName("");
                    setAdminEmail("");
                    setAdminPassword("");
               } else {
                    setError(data.message || "Registration failed");
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
                              <div className="p-4 bg-gradient-to-r from-gray-500 via-gray-500 to-gray-500 rounded-2xl shadow-lg animate-pulse-glow">
                                   <Building className="w-8 h-8 text-white" />
                              </div>
                              {/* Floating particles */}
                              <div className="absolute -top-2 -right-2 w-3 h-3 bg-gray-400 rounded-full animate-ping"></div>
                              <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-gray-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                         </div>
                    </div>

                    <CardTitle className="text-3xl font-bold text-black bg-clip-text">
                         Register Company
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                         Create your company account to get started
                    </CardDescription>
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

                         {success && (
                              <Alert className="border-green-200 bg-green-50/80 backdrop-blur-sm">
                                   <AlertDescription className="flex items-center text-green-700 font-medium">
                                        <svg
                                             className="w-5 h-5 mr-2 flex-shrink-0"
                                             fill="currentColor"
                                             viewBox="0 0 20 20"
                                             xmlns="http://www.w3.org/2000/svg"
                                        >
                                             <path
                                                  fillRule="evenodd"
                                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                  clipRule="evenodd"
                                             />
                                        </svg>
                                        {success}
                                   </AlertDescription>
                              </Alert>
                         )}

                         <div className="space-y-3">
                              <Label
                                   htmlFor="companyName"
                                   className="text-slate-700 font-semibold text-sm uppercase tracking-wide"
                              >
                                   Company Name
                              </Label>
                              <div className="relative group">
                                   <Building className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-gray-500 transition-colors duration-300" />
                                   <Input
                                        id="companyName"
                                        type="text"
                                        placeholder="Enter your company name"
                                        value={companyName}
                                        onChange={(e) =>
                                             setCompanyName(
                                                  e.target
                                                       .value
                                             )
                                        }
                                        required
                                        className="pl-12 h-14 border-2 border-slate-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 rounded-xl text-base bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white"
                                   />
                                   <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gray-500/0 via-gray-500/0 to-gray-500/0 group-focus-within:from-gray-500/5 group-focus-within:via-gray-500/10 group-focus-within:to-gray-500/5 transition-all duration-500 pointer-events-none"></div>
                              </div>
                         </div>

                         <div className="space-y-3">
                              <Label
                                   htmlFor="adminEmail"
                                   className="text-slate-700 font-semibold text-sm uppercase tracking-wide"
                              >
                                   Admin Email
                              </Label>
                              <div className="relative group">
                                   <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-gray-500 transition-colors duration-300" />
                                   <Input
                                        id="adminEmail"
                                        type="email"
                                        placeholder="Enter admin email"
                                        value={adminEmail}
                                        onChange={(e) =>
                                             setAdminEmail(
                                                  e.target
                                                       .value
                                             )
                                        }
                                        required
                                        className="pl-12 h-14 border-2 border-slate-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 rounded-xl text-base bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white"
                                   />
                                   <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gray-500/0 via-gray-500/0 to-gray-500/0 group-focus-within:from-gray-500/5 group-focus-within:via-gray-500/10 group-focus-within:to-gray-500/5 transition-all duration-500 pointer-events-none"></div>
                              </div>
                         </div>

                         <div className="space-y-3">
                              <Label
                                   htmlFor="adminPassword"
                                   className="text-slate-700 font-semibold text-sm uppercase tracking-wide"
                              >
                                   Admin Password
                              </Label>
                              <div className="relative group">
                                   <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-gray-500 transition-colors duration-300" />
                                   <Input
                                        id="adminPassword"
                                        type="password"
                                        placeholder="Enter admin password"
                                        value={adminPassword}
                                        onChange={(e) =>
                                             setAdminPassword(
                                                  e.target
                                                       .value
                                             )
                                        }
                                        required
                                        className="pl-12 h-14 border-2 border-slate-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 rounded-xl text-base bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white"
                                   />
                                   <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gray-500/0 via-gray-500/0 to-gray-500/0 group-focus-within:from-gray-500/5 group-focus-within:via-gray-500/10 group-focus-within:to-gray-500/5 transition-all duration-500 pointer-events-none"></div>
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
                                        <span>Creating company...</span>
                                   </div>
                              ) : (
                                   <>
                                        <Building className="mr-2 h-5 w-5" />
                                        Register Company
                                   </>
                              )}
                         </Button>

                    </CardFooter>
               </form>
          </Card>
     );
}
