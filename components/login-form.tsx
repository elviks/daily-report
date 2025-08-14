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
import { Loader2, Mail, Lock } from "lucide-react";

export function LoginForm() {
     const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");
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
                         }),
                    }
               );

               const data = await response.json();

               if (response.ok) {
                    // Store user data in localStorage (in production, use proper session management)
                    localStorage.setItem(
                         "user",
                         JSON.stringify(data.user)
                    );

                    // Redirect based on role
                    if (data.user.role === "superadmin") {
                         router.push("/admin");
                    } else {
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
          <Card className="w-full max-w-md shadow-xl hover:shadow-2xl transition-shadow duration-300">
               <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-2">
                         <div className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full">
                              <svg
                                   className="w-8 h-8 text-white"
                                   fill="none"
                                   stroke="currentColor"
                                   viewBox="0 0 24 24"
                                   xmlns="http://www.w3.org/2000/svg"
                              >
                                   <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                   />
                              </svg>
                         </div>
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                         Welcome Back
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                         Enter your credentials to access
                         your account
                    </CardDescription>
               </CardHeader>
               <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                         {error && (
                              <Alert
                                   variant="destructive"
                                   className="border-red-200 bg-red-50"
                              >
                                   <AlertDescription className="flex items-center text-red-700">
                                        <svg
                                             className="w-5 h-5 mr-2"
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
                         <div className="space-y-2">
                              <Label
                                   htmlFor="email"
                                   className="text-slate-700 font-medium"
                              >
                                   Email Address
                              </Label>
                              <div className="relative">
                                   <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
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
                                        className="pl-10 h-12 border-slate-300 focus:border-gray-500 focus:ring-gray-500 transition-colors duration-200"
                                   />
                              </div>
                         </div>
                         <div className="space-y-2">
                              <Label
                                   htmlFor="password"
                                   className="text-slate-700 font-medium"
                              >
                                   Password
                              </Label>
                              <div className="relative">
                                   <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
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
                                        className="pl-10 h-12 border-slate-300 focus:border-gray-500 focus:ring-gray-500 transition-colors duration-200"
                                   />
                              </div>
                         </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 mt-6">
                         <Button
                              type="submit"
                              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-gray-600 to-gray-600 hover:from-gray-700 hover:to-gray-700 text-white transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                              disabled={isLoading}
                         >
                              {isLoading && (
                                   <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              )}
                              {isLoading
                                   ? "Signing in..."
                                   : "Sign In"}
                         </Button>

                         <div className="text-center text-sm text-slate-500">
                              <p>
                                   Don't have an account?{" "}
                                   <a
                                        href="/register"
                                        className="font-medium text-gray-600 hover:text-gray-500 hover:underline transition-colors duration-150"
                                   >
                                        Sign up
                                   </a>
                              </p>
                         </div>
                    </CardFooter>
               </form>
          </Card>
     );
}
