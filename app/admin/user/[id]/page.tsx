"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Building, Calendar, Phone, ArrowLeft, User } from "lucide-react"
import { UserCalendar } from "@/components/user-calendar"
import Link from "next/link"

interface UserInterface {
    id: string
    name: string
    email: string
    department: string
    phone: string
    role: string
    createdAt: string
    lastReportDate?: string
    totalReports: number
    profileImage?: string
}

export default function UserPage() {
    const params = useParams()
    const router = useRouter()
    const [user, setUser] = useState<UserInterface | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.id) {
            fetchUser()
        }
    }, [params.id])

    const fetchUser = async () => {
        try {
            const response = await fetch("/api/admin/users")
            const data = await response.json()

            if (response.ok) {
                const foundUser = data.users.find((u: UserInterface) => u.id === params.id)
                if (foundUser) {
                    setUser(foundUser)
                } else {
                    router.push("/admin")
                }
            } else {
                router.push("/admin")
            }
        } catch (error) {
            console.error("Error fetching user:", error)
            router.push("/admin")
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-200 px-6 py-2"
                        >
                            <ArrowLeft className="mr-3 h-4 w-4" />
                            Back
                        </Button>
                    </div>
                    <Card className="border-2 border-gray-200 bg-white">
                        <CardContent className="p-12">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 mb-4">
                                    <User className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="text-xl font-medium text-gray-700">Loading user details...</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-white p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="flex items-center gap-6">
                        <Link href="/admin">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-700 hover:text-black hover:bg-gray-100 border border-gray-300 px-6 py-2 font-medium"
                            >
                                <ArrowLeft className="mr-3 h-4 w-4" />
                                Back to Admin
                            </Button>
                        </Link>
                    </div>
                    <Card className="border-2 border-gray-200  bg-white">
                        <CardContent className="p-12">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 mb-4">
                                    <User className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="text-xl font-medium text-gray-700">User not found</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b-2 border-gray-200">
                    <div className="flex items-center gap-8">
                        <Link href="/admin">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-700 hover:text-black hover:bg-gray-100 border border-gray-300 px-6 py-3 font-medium"
                            >
                                <ArrowLeft className="mr-3 h-4 w-4" />
                                Back to Admin
                            </Button>
                        </Link>
                        <div className="h-12 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-gray-300">
                                <AvatarImage
                                    src={user.profileImage}
                                    alt={user.name}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-black text-white font-bold text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-2xl font-bold text-black mb-1">{user.name}</h1>
                                <p className="text-sm text-gray-600 font-medium">{user.department}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {user.role === "superadmin" && (
                            <Badge
                                variant="destructive"
                                className="bg-black text-white px-4 py-2 text-sm font-bold uppercase tracking-wide"
                            >
                                Admin
                            </Badge>
                        )}
                        <Badge
                            variant="outline"
                            className="border-2 border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium bg-white"
                        >
                            {user.totalReports} reports
                        </Badge>
                    </div>
                </div>

                {/* User Details Card */}
                <Card className="border-2 border-gray-200 bg-white">
                    <CardHeader className="bg-gray-50 border-b border-gray-200 pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold text-black">
                            <div className="p-1.5 bg-black ">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            Contact Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200">
                                <div className="p-2 bg-white border border-gray-200">
                                    <Mail className="h-4 w-4 text-gray-700" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                                    <p className="text-sm font-medium text-black">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200">
                                <div className="p-2 bg-white border border-gray-200">
                                    <Building className="h-4 w-4 text-gray-700" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Department</p>
                                    <p className="text-sm font-medium text-black">{user.department}</p>
                                </div>
                            </div>
                            {user.phone && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200">
                                    <div className="p-2 bg-white border border-gray-200">
                                        <Phone className="h-4 w-4 text-gray-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                                        <p className="text-sm font-medium text-black">{user.phone}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200">
                                <div className="p-2 bg-white border border-gray-200">
                                    <Calendar className="h-4 w-4 text-gray-700" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Joined</p>
                                    <p className="text-sm font-medium text-black">{formatDate(user.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                        {user.lastReportDate && (
                            <div className="mt-6 p-4 bg-black border-2 border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white">
                                        <Calendar className="h-4 w-4 text-black" />
                                    </div>
                                    <span className="text-sm font-medium text-white">
                                        Last report submitted on <span className="font-bold">{formatDate(user.lastReportDate)}</span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Calendar */}
                <div className="border-2 border-gray-200 bg-white">
                    <UserCalendar userId={user.id} userName={user.name} />
                </div>
            </div>
        </div>
    )
}