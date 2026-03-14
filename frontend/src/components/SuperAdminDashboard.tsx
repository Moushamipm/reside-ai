import { useState } from 'react';
import { 
  Users, 
  Home, 
  CheckCircle, 
  XCircle, 
  Clock,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useGetAllUsers, 
  useGetAllProperties,
  useListApprovals,
  useSetApproval
} from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { TamilRole, PropertyStatus } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SuperAdminDashboardProps {
  bypassActive?: boolean;
}

export default function SuperAdminDashboard({ bypassActive = false }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: allUsers = [], isLoading: usersLoading, error: usersError } = useGetAllUsers();
  const { data: allProperties = [], isLoading: propertiesLoading } = useGetAllProperties();
  const { data: approvals = [], isLoading: approvalsLoading, refetch: refetchApprovals, error: approvalsError } = useListApprovals();
  const setApprovalMutation = useSetApproval();

  const handleUserApproval = async (principal: any, approved: boolean) => {
    try {
      await setApprovalMutation.mutateAsync({
        user: principal,
        status: approved ? 'approved' : 'rejected'
      });
      toast.success(approved ? 'User approved | பயனர் அங்கீகரிக்கப்பட்டார்' : 'User rejected | பயனர் நிராகரிக்கப்பட்டார்');
      refetchApprovals();
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to update approval status';
      toast.error(errorMsg);
    }
  };

  // Calculate statistics
  const totalUsers = allUsers.length;
  const usersByRole = {
    owners: allUsers.filter(([_, profile]) => profile.tamilRole === TamilRole.owners).length,
    brokers: allUsers.filter(([_, profile]) => profile.tamilRole === TamilRole.brokersBuilders).length,
    customers: allUsers.filter(([_, profile]) => profile.tamilRole === TamilRole.customers).length,
    superAdmin: allUsers.filter(([_, profile]) => profile.tamilRole === TamilRole.superAdmin).length,
  };

  const pendingApprovals = approvals.filter(a => a.status.__kind__ === 'pending').length;
  const totalProperties = allProperties.length;
  const approvedProperties = allProperties.filter(p => p.status === PropertyStatus.approved).length;
  const pendingProperties = allProperties.filter(p => p.status === PropertyStatus.pending);

  const propertiesByType = {
    house: allProperties.filter(p => p.propertyType.toLowerCase() === 'house').length,
    flat: allProperties.filter(p => p.propertyType.toLowerCase() === 'flat').length,
    pg: allProperties.filter(p => p.propertyType.toLowerCase() === 'pg').length,
    land: allProperties.filter(p => p.propertyType.toLowerCase() === 'land').length,
  };

  const transactionData = [
    { name: 'Rent | வாடகை', value: allProperties.filter(p => p.transactionType.toLowerCase() === 'rent').length },
    { name: 'Purchase | வாங்க', value: allProperties.filter(p => p.transactionType.toLowerCase() === 'purchase').length },
  ];

  const propertyTypeData = [
    { name: 'House | வீடு', value: propertiesByType.house },
    { name: 'Flat | குடியிருப்பு', value: propertiesByType.flat },
    { name: 'PG', value: propertiesByType.pg },
    { name: 'Land | நிலம்', value: propertiesByType.land },
  ];

  const COLORS = ['oklch(var(--chart-1))', 'oklch(var(--chart-2))', 'oklch(var(--chart-3))', 'oklch(var(--chart-4))'];

  return (
    <div className="container py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">SuperAdmin Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">சூப்பர் நிர்வாகி டாஷ்போர்டு</p>
        </div>

        {/* Bypass Mode Warning */}
        {bypassActive && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Development Mode:</strong> Admin authentication is bypassed. This mode should never be used in production.
            </AlertDescription>
          </Alert>
        )}

        {/* Non-blocking error messages */}
        {(usersError || approvalsError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some admin data could not be loaded. You may not have the required permissions, or the backend may be unavailable.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">
              Overview | கண்ணோட்டம்
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm py-2">
              Users | பயனர்கள்
            </TabsTrigger>
            <TabsTrigger value="properties" className="text-xs sm:text-sm py-2">
              Properties | சொத்துகள்
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{totalUsers}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">மொத்த பயனர்கள்</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{pendingApprovals}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">நிலுவையில் உள்ளவை</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Properties</CardTitle>
                  <Home className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{totalProperties}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">மொத்த சொத்துகள்</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Active Listings</CardTitle>
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{approvedProperties}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">செயலில் உள்ளவை</p>
                </CardContent>
              </Card>
            </div>

            {/* User Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">User Distribution | பயனர் விநியோகம்</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Breakdown by user roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Owners</p>
                    <p className="text-xl sm:text-2xl font-bold">{usersByRole.owners}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">உரிமையாளர்கள்</p>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Brokers</p>
                    <p className="text-xl sm:text-2xl font-bold">{usersByRole.brokers}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">தரகர்கள்</p>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Customers</p>
                    <p className="text-xl sm:text-2xl font-bold">{usersByRole.customers}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">வாடிக்கையாளர்கள்</p>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Admins</p>
                    <p className="text-xl sm:text-2xl font-bold">{usersByRole.superAdmin}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">நிர்வாகிகள்</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Transaction Types | பரிவர்த்தனை வகைகள்</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={transactionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {transactionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Property Types | சொத்து வகைகள்</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={propertyTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="oklch(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Pending User Approvals | நிலுவையில் உள்ள பயனர் அங்கீகாரங்கள்</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Review and approve user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {approvalsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : approvals.filter(a => a.status.__kind__ === 'pending').length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm sm:text-base text-muted-foreground">No pending approvals</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">நிலுவையில் உள்ள அங்கீகாரங்கள் இல்லை</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {approvals
                      .filter(a => a.status.__kind__ === 'pending')
                      .map((approval) => {
                        const user = allUsers.find(([p]) => p.toString() === approval.principal.toString());
                        const profile = user?.[1];
                        
                        return (
                          <div key={approval.principal.toString()} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg">
                            <div className="space-y-1">
                              <p className="text-sm sm:text-base font-medium">{profile?.name || 'Unknown User'}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {profile?.tamilRole === TamilRole.owners && 'Owner | உரிமையாளர்'}
                                {profile?.tamilRole === TamilRole.brokersBuilders && 'Broker/Builder | தரகர்/கட்டுபவர்'}
                                {profile?.tamilRole === TamilRole.customers && 'Customer | வாடிக்கையாளர்'}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                {profile?.email}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate max-w-[200px] sm:max-w-none">
                                {approval.principal.toString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUserApproval(approval.principal, true)}
                                disabled={setApprovalMutation.isPending}
                                className="flex-1 sm:flex-none"
                              >
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUserApproval(approval.principal, false)}
                                disabled={setApprovalMutation.isPending}
                                className="flex-1 sm:flex-none"
                              >
                                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">All Users | அனைத்து பயனர்கள்</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Complete list of registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : allUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm sm:text-base text-muted-foreground">No users found</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">பயனர்கள் இல்லை</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {allUsers.map(([principal, profile]) => {
                      const approval = approvals.find(a => a.principal.toString() === principal.toString());
                      const status = approval?.status.__kind__ || 'unknown';
                      
                      return (
                        <div key={principal.toString()} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm sm:text-base font-medium">{profile.name}</p>
                              <Badge variant={status === 'approved' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] sm:text-xs">
                                {status}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {profile.tamilRole === TamilRole.owners && 'Owner | உரிமையாளர்'}
                              {profile.tamilRole === TamilRole.brokersBuilders && 'Broker/Builder | தரகர்/கட்டுபவர்'}
                              {profile.tamilRole === TamilRole.customers && 'Customer | வாடிக்கையாளர்'}
                              {profile.tamilRole === TamilRole.superAdmin && 'SuperAdmin | சூப்பர் நிர்வாகி'}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {profile.email}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Pending Property Approvals | நிலுவையில் உள்ள சொத்து அங்கீகாரங்கள்</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Properties awaiting approval (approval feature coming soon)</CardDescription>
              </CardHeader>
              <CardContent>
                {propertiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : pendingProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm sm:text-base text-muted-foreground">No pending property approvals</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">நிலுவையில் உள்ள சொத்து அங்கீகாரங்கள் இல்லை</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {pendingProperties.map((property) => (
                      <div key={property.id.toString()} className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm sm:text-base font-medium">{property.title}</p>
                          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
                            <span className="capitalize">{property.propertyType}</span>
                            <span>•</span>
                            <span>{property.location}</span>
                            <span>•</span>
                            <span>₹{Number(property.price).toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Owner: {property.owner.toString().slice(0, 20)}...
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Property approval functionality will be available soon
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">All Properties | அனைத்து சொத்துகள்</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Complete list of all property listings</CardDescription>
              </CardHeader>
              <CardContent>
                {propertiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : allProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm sm:text-base text-muted-foreground">No properties found</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">சொத்துகள் இல்லை</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {allProperties.map((property) => (
                      <div key={property.id.toString()} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm sm:text-base font-medium">{property.title}</p>
                          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
                            <span className="capitalize">{property.propertyType}</span>
                            <span>•</span>
                            <span>{property.location}</span>
                            <span>•</span>
                            <span>₹{Number(property.price).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
