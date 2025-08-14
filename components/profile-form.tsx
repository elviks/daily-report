"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, Building, Lock, Camera, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  department: string
  profileImage?: string
}

export function ProfileForm() {
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    phone: "",
    department: "",
  })
  const [currentPassword, setCurrentPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [profileImage, setProfileImage] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const userData = localStorage.getItem("user")
      if (!userData) return
      const localUser = JSON.parse(userData)

      try {
        const resp = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: localUser.id, email: localUser.email })
        })
        if (resp.ok) {
          const data = await resp.json()
          const dbUser = data.user
          const merged = {
            id: dbUser?.id || localUser.id,
            name: dbUser?.name || localUser.name,
            email: dbUser?.email || localUser.email,
            phone: dbUser?.phone || localUser.phone || "",
            department: dbUser?.department || localUser.department || "",
            profileImage: dbUser?.profileImage || localUser.profileImage || "",
          }
          setProfile(merged)
          setProfileImage(merged.profileImage || "")
          // Sync localStorage so navbars get consistent info
          localStorage.setItem("user", JSON.stringify({ ...localUser, ...merged }))
          window.dispatchEvent(new Event("userUpdated"))
        } else {
          // fallback to local
          setProfile({
            id: localUser.id,
            name: localUser.name,
            email: localUser.email,
            phone: localUser.phone || "",
            department: localUser.department || "",
            profileImage: localUser.profileImage || "",
          })
          setProfileImage(localUser.profileImage || "")
        }
      } catch {
        // ignore; fallback to local
        setProfile({
          id: localUser.id,
          name: localUser.name,
          email: localUser.email,
          phone: localUser.phone || "",
          department: localUser.department || "",
          profileImage: localUser.profileImage || "",
        })
        setProfileImage(localUser.profileImage || "")
      }
    }

    loadProfile()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }

      setImageFile(file)
      setError("")

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setProfileImage("")
    setError("")
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsUpdating(true)
    setError("")
    setMessage("")

    if (!currentPassword) {
      setError("Please enter your current password to confirm changes")
      setIsUpdating(false)
      return
    }

    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profile,
          currentPassword,
          profileImage: profileImage,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Update localStorage with new user data
        const updatedUser = {
          ...JSON.parse(localStorage.getItem("user") || "{}"),
          ...profile,
          profileImage: profileImage
        }
        localStorage.setItem("user", JSON.stringify(updatedUser))

        // Notify other tabs/components to refresh user data
        window.dispatchEvent(new Event("userUpdated"))

        setMessage("Profile updated successfully!")
        setCurrentPassword("")
      } else {
        setError(data.message || "Failed to update profile")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen text-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-white border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
              Personal Information
            </CardTitle>
            <CardDescription className="text-gray-600">
              Update your personal details. Changes require password confirmation.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertDescription className="flex items-center text-red-700">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="flex items-center text-green-700">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Profile Image Upload Section */}
              <div className="space-y-4">
                <Label className="text-gray-700 font-medium">Profile Picture</Label>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-2 border-gray-200">
                      <AvatarImage src={profileImage} alt={profile.name} />
                      <AvatarFallback className="text-lg font-semibold bg-gray-100 text-gray-600">
                        {profile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {profileImage && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={removeImage}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('profile-image-input')?.click()}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                      {profileImage && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeImage}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF up to 5MB. Recommended size: 200x200px.
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-200 my-4" />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="pl-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-black transition-colors duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="pl-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-black transition-colors duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="pl-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-black transition-colors duration-200"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-gray-700 font-medium">
                    Department
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="department"
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                      className="pl-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-black transition-colors duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-200 my-4" />

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-700 font-medium">
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-black transition-colors duration-200"
                    placeholder="Enter your current password to confirm changes"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mb-2 mt-4">Required to confirm profile changes</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full h-12 text-base font-semibold bg-black text:white hover:bg-gray-800 hover:text-white transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {isUpdating ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating...
                  </div>
                ) : "Update Profile"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}