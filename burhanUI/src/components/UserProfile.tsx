import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { User, Building2, Shield, Users, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner@2.0.3";

const organizationUsers: { id: string; name: string; email: string; role: string; status: string }[] = [];

export function UserProfile() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("auditor");
  const [invitePassword, setInvitePassword] = useState("");

  const handleInviteUser = () => {
    // Simulate user creation
    toast.success(`User ${inviteName} has been added successfully`);
    setInviteModalOpen(false);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("auditor");
    setInvitePassword("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>User Profile & Organization Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and organization configuration
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile
            </CardTitle>
            <CardDescription>
              Your personal account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 pb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h3></h3>
                <p className="text-sm text-muted-foreground">Internal Auditor</p>
                <Badge variant="outline" className="mt-1">Admin</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" defaultValue="" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select defaultValue="admin" disabled>
                <SelectTrigger id="role" className="cursor-not-allowed opacity-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="assessor">Assessor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">You cannot change your own role. Contact an administrator.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" defaultValue="" />
            </div>

            <Button className="w-full">Update Profile</Button>
          </CardContent>
        </Card>

        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organization Details
            </CardTitle>
            <CardDescription>
              Configure your organization settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input id="orgName" defaultValue="" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select defaultValue="financial">
                <SelectTrigger id="industry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial Services</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgSize">Organization Size</Label>
              <Select defaultValue="medium">
                <SelectTrigger id="orgSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">1-50 employees</SelectItem>
                  <SelectItem value="medium">51-500 employees</SelectItem>
                  <SelectItem value="large">501-5000 employees</SelectItem>
                  <SelectItem value="enterprise">5000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select defaultValue="sa">
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sa">Saudi Arabia</SelectItem>
                  <SelectItem value="ae">United Arab Emirates</SelectItem>
                  <SelectItem value="kw">Kuwait</SelectItem>
                  <SelectItem value="qa">Qatar</SelectItem>
                  <SelectItem value="bh">Bahrain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseKey">NCA License Key</Label>
              <Input id="licenseKey" defaultValue="NCA-2025-XXXX-XXXX" />
            </div>

            <Button className="w-full">Save Settings</Button>
          </CardContent>
        </Card>
      </div>

      {/* Access Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Access Management
              </CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </div>
            <Button onClick={() => setInviteModalOpen(true)}>
              <Users className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizationUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage authentication and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4>Session Timeout</h4>
              <p className="text-sm text-muted-foreground">
                Automatically log out after 30 minutes of inactivity
              </p>
            </div>
            <Select defaultValue="30">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
                <SelectItem value="120">120 min</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4>Change Password</h4>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
            <Button variant="outline">Change</Button>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Create a new user account for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select defaultValue={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="assessor">Assessor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} />
              <p className="text-xs text-muted-foreground">Create a temporary password for the user. They can change it after first login.</p>
            </div>
          </div>
          <Button className="w-full mt-4" onClick={handleInviteUser}>Add User</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}