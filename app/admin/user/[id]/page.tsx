"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Mail, Building, Calendar, Phone, ArrowLeft, User, Edit } from "lucide-react"
import { UserCalendar } from "@/components/user-calendar"
import { toast } from "sonner"
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
    isActive?: boolean
}

export default function UserPage() {
    const params = useParams()
    const router = useRouter()
    const [user, setUser] = useState<UserInterface | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        department: "",
        phone: ""
    })
    const [overridePassword, setOverridePassword] = useState("")
    const [pincode, setPincode] = useState("")
    const [pincodeError, setPincodeError] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (params.id) {
            fetchUser()
        }
    }, [params.id])

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No authentication token found");
                router.push("/admin");
                return;
            }

            const response = await fetch("/api/admin/users", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json()

            if (response.ok) {
                const foundUser = data.users.find((u: UserInterface) => u.id === params.id)
                if (foundUser) {
                    setUser(foundUser)
                } else {
                    router.push("/admin")
                }
            } else {
                console.error("Failed to fetch users:", data.error);
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

    const handleEditClick = () => {
        if (user) {
            setEditForm({
                name: user.name,
                email: user.email,
                department: user.department,
                phone: user.phone || ""
            })
            setOverridePassword("")
            setPincode("")
            setPincodeError("")
            setIsEditDialogOpen(true)
        }
    }

    const handleSaveEdit = async () => {
        try {
            setIsSaving(true)
            setPincodeError("")

            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Please login first")
                return
            }

            // If password override is provided, PIN code is required
            if (overridePassword && !pincode.trim()) {
                setPincodeError("PIN code is required when overriding password")
                setIsSaving(false)
                return
            }

            // If PIN is provided, it must be valid even if password is empty
            if (pincode.trim() && !overridePassword) {
                setPincodeError("Password must be provided when entering PIN code")
                setIsSaving(false)
                return
            }

            const response = await fetch(`/api/admin/users/${params.id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...editForm,
                    ...(overridePassword && { password: overridePassword, pincode: pincode.trim() })
                })
            })

            const data = await response.json()

            if (response.ok) {
                if (overridePassword) {
                    toast.success("User information and password updated successfully")
                } else {
                    toast.success("User information updated successfully")
                }
                setUser(prev => prev ? { ...prev, ...editForm } : null)
                setOverridePassword("")
                setPincode("")
                setIsEditDialogOpen(false)
            } else {
                // Check if it's a PIN code error
                if (response.status === 403 || data.error?.toLowerCase().includes("pin")) {
                    setPincodeError(data.error || "Invalid PIN code")
                }
                toast.error(data.error || "Failed to update user")
            }
        } catch (error) {
            console.error("Error updating user:", error)
            toast.error("Failed to update user")
        } finally {
            setIsSaving(false)
        }
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
                        {user.isActive === false && (
                            <Badge
                                variant="secondary"
                                className="bg-gray-500 text-white px-4 py-2 text-sm font-bold uppercase tracking-wide"
                            >
                                Disabled
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
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg font-bold text-black">
                                <div className="p-1.5 bg-black ">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                                Contact Information
                            </CardTitle>
                            <Button
                                onClick={handleEditClick}
                                className="bg-black hover:bg-gray-800 text-white px-4 py-2"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </div>
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

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit User Information</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                value={editForm.department}
                                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Password Override Section */}
                    <div className="border-t pt-4 space-y-4">
                        <div>
                            <Label className="text-sm font-semibold text-gray-800">Password Override (Optional)</Label>
                            <p className="text-xs text-gray-500 mt-1 mb-3">
                                Leave empty to keep current password. If you want to override, you must provide both the new password and PIN code.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="overridePassword">New Password</Label>
                                <Input
                                    id="overridePassword"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={overridePassword}
                                    onChange={(e) => {
                                        setOverridePassword(e.target.value)
                                        setPincodeError("")
                                    }}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="pincode">Admin PIN Code</Label>
                                <Input
                                    id="pincode"
                                    type="password"
                                    placeholder="Enter admin PIN"
                                    value={pincode}
                                    onChange={(e) => {
                                        setPincode(e.target.value)
                                        setPincodeError("")
                                    }}
                                    className={`mt-1 ${pincodeError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                />
                                {pincodeError && (
                                    <p className="text-xs text-red-600 mt-1">{pincodeError}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="bg-black hover:bg-gray-800 text-white"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}