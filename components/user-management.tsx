"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Mail, Building, Calendar, Phone, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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

export function UserManagement() {
  const [users, setUsers] = useState<UserInterface[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserInterface[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserInterface | null>(null)
  const [userReports, setUserReports] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserInterface | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    setFilteredUsers(filtered)
  }

  const fetchUserDetails = async (user: UserInterface) => {
    setSelectedUser(user)
    setLoadingReports(true)
    setShowUserDetails(true)

    try {
      const response = await fetch(`/api/admin/reports/user/${user.id}`)
      const data = await response.json()

      if (response.ok) {
        setUserReports(Array.isArray(data.reports) ? data.reports : [])
      } else {
        setUserReports([])
      }
    } catch (error) {
      console.error("Error fetching user reports:", error)
      setUserReports([])
    } finally {
      setLoadingReports(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, user: UserInterface) => {
    e.stopPropagation()
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove user from local state
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
        setDeleteDialogOpen(false)
        setUserToDelete(null)

        // Close user details if it was the deleted user
        if (selectedUser?.id === userToDelete.id) {
          setShowUserDetails(false)
          setSelectedUser(null)
        }
      } else {
        const error = await response.json()
        console.error('Failed to delete user:', error)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setDeleting(false)
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
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading users...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Click on any member to view their details and reports ({filteredUsers.length} members)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Members List */}
          <ScrollArea className="h-[600px]">
            <div className="grid gap-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fetchUserDetails(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage
                        src={user.profileImage}
                        alt={user.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.department}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {user.totalReports} reports
                    </Badge>
                    {user.role === "superadmin" && (
                      <Badge variant="destructive" className="text-xs">
                        Admin
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleDeleteClick(e, user)}
                      disabled={user.role === "superadmin"}
                      title={user.role === "superadmin" ? "Cannot delete admin users" : "Delete user"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage
                  src={selectedUser?.profileImage}
                  alt={selectedUser?.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {selectedUser?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>Member details and daily reports</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedUser.department}</span>
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedUser.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Joined {formatDate(selectedUser.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Reports ({(userReports && userReports.length) ? userReports.length : 0})</CardTitle>
                  {selectedUser.lastReportDate && (
                    <CardDescription>
                      Last report submitted on {formatDate(selectedUser.lastReportDate)}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {loadingReports ? (
                    <div className="text-center py-8">Loading reports...</div>
                  ) : (
                    <div className="space-y-4">
                      {(userReports && userReports.length === 0) ? (
                        <div className="text-center text-muted-foreground py-8">No reports submitted yet</div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-4 pr-4">
                            {userReports.map((report) => (
                              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(report.date)}
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {report.createdAt !== report.updatedAt ? "Updated" : "Submitted"}
                                  </Badge>
                                </div>

                                <div className="text-sm leading-relaxed">
                                  <p>{report.content}</p>
                                </div>

                                <div className="text-xs text-muted-foreground space-y-1">
                                  <div>Submitted: {new Date(report.createdAt).toLocaleString()}</div>
                                  {report.createdAt !== report.updatedAt && (
                                    <div>Last Updated: {new Date(report.updatedAt).toLocaleString()}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{userToDelete?.name}</span> and all their reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
