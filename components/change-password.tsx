"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Lock, Eye, EyeOff } from "lucide-react"

interface ChangePasswordProps {
    userId: string
}

export function ChangePassword({ userId }: ChangePasswordProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })

    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError("")
        setMessage("")

        // Validation
        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match")
            setIsSubmitting(false)
            return
        }

        if (formData.newPassword.length < 6) {
            setError("New password must be at least 6 characters long")
            setIsSubmitting(false)
            return
        }

        try {
            const response = await fetch("/api/profile/change-password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: userId,
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setMessage("Password changed successfully!")
                setFormData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                })
                setTimeout(() => {
                    setIsOpen(false)
                    setMessage("")
                }, 2000)
            } else {
                setError(data.message || "Failed to change password")
            }
        } catch (error) {
            setError("An error occurred. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
    }

    const resetForm = () => {
        setFormData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        })
        setError("")
        setMessage("")
    }

    return (
        <Card className="bg-white border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <Lock className="h-5 w-5 text-gray-600" />
                    Change Password
                </CardTitle>
                <CardDescription className="text-gray-600">
                    Update your account password. Make sure to use a strong, unique password.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                        <AlertDescription className="text-red-700">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {message && (
                    <Alert className="bg-green-50 border-green-200">
                        <AlertDescription className="text-green-700">
                            {message}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-gray-700 font-medium">
                            Current Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                id="currentPassword"
                                type={showPasswords.current ? "text" : "password"}
                                value={formData.currentPassword}
                                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                                className="pl-10 pr-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-black transition-colors duration-200"
                                placeholder="Enter your current password"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => togglePasswordVisibility("current")}
                            >
                                {showPasswords.current ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <Separator className="bg-gray-200" />

                    <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                            New Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                id="newPassword"
                                type={showPasswords.new ? "text" : "password"}
                                value={formData.newPassword}
                                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                                className="pl-10 pr-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-black transition-colors duration-200"
                                placeholder="Enter new password (min 6 characters)"
                                required
                                minLength={6}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => togglePasswordVisibility("new")}
                            >
                                {showPasswords.new ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Password must be at least 6 characters long
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                            Confirm New Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                id="confirmPassword"
                                type={showPasswords.confirm ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                className="pl-10 pr-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-black transition-colors duration-200"
                                placeholder="Confirm your new password"
                                required
                                minLength={6}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => togglePasswordVisibility("confirm")}
                            >
                                {showPasswords.confirm ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 text-base font-semibold bg-gray-600 text-white hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Changing Password...
                                </div>
                            ) : "Change Password"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
