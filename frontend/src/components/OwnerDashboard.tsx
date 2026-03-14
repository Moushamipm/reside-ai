
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useGetCallerUserProfile, useGetMyProperties, useGetOwnerRequests, useApproveRequest, useRejectRequest, useDeleteProperty } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Home,
  Users,
  IndianRupee,
  Plus,
  Settings,
  Building,
  User,
  Inbox,
  MapPin,
  Wrench,
  CreditCard
} from 'lucide-react';
import PropertyForm from './PropertyForm';
import PropertyCard from './PropertyCard';
import PropertyFullScreenView from './PropertyFullScreenView';
import RequestDetailsModal from './RequestDetailsModal';
import { PropertyStatus, Property } from '../types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import api from '../lib/api';
import { RentStatusGraph } from './RentStatusGraph';
import { useGetOwnerRentHistory } from '../hooks/useQueries';

export default function OwnerDashboard() {
  const { t } = useLanguage();
  const { data: userProfile, refetch: refetchUserProfile } = useGetCallerUserProfile();

  const { data: myProperties = [] } = useGetMyProperties();
  const { data: requests = [] } = useGetOwnerRequests();
  const { data: rentHistory } = useGetOwnerRentHistory();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const deletePropertyMutation = useDeleteProperty();

  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [idProofImage, setIdProofImage] = useState<string | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>({
    expected: 0,
    collected: 0,
    pending: 0,
    overdue: 0,
    breakdown: []
  });
  const [rentDetailsType, setRentDetailsType] = useState<
    | null
    | 'totalProperties'
    | 'occupiedProperties'
    | 'vacantProperties'
    | 'totalTenants'
    | 'expectedRent'
    | 'pendingRent'
  >(null);
  const [overviewActiveSection, setOverviewActiveSection] = useState<
    'none' | 'rentRequests' | 'maintenanceRequests' | 'paymentRequests'
  >('none');
  const [maintenanceOverview, setMaintenanceOverview] = useState<any[]>([]);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [selectedPropertyInitialTab, setSelectedPropertyInitialTab] = useState<
    'tenant' | 'payments' | 'maintenance' | 'agreements' | 'vacate'
  >('tenant');

  const pendingRentCount = requests.filter((r: any) => r.type === 'rent' && r.status === 'pending').length;
  const pendingMaintenanceCount = maintenanceOverview.filter((m: any) => m.status === 'pending').length;
  const pendingPaymentCount = paymentRequests.filter((p: any) => p.status === 'pending').length;
  const totalPendingRequests = pendingRentCount + pendingMaintenanceCount + pendingPaymentCount;

  // Notification for pending requests
  useEffect(() => {
    if (totalPendingRequests > 0) {
      const toastId = 'pending-requests-notification'; // Unique ID to prevent duplicates
      toast.info(
        t(
          `You have ${totalPendingRequests} pending requests`,
          `${totalPendingRequests} நிலுவையில் உள்ள கோரிக்கைகள் உள்ளன`
        ),
        {
          id: toastId,
          duration: 6000,
          description: t('Check the Tenant Requests Overview', 'குத்தகைதாரர் கோரிக்கைகள் கண்ணோட்டத்தைச் சரிபார்க்கவும்'),
          action: {
            label: t('View', 'பார்வை'),
            onClick: () => {
              const element = document.getElementById('tenant-requests-overview');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Optional: Highlight effect
                element.classList.add('ring-2', 'ring-primary');
                setTimeout(() => element.classList.remove('ring-2', 'ring-primary'), 2000);
              }
            }
          }
        }
      );
    }
  }, [totalPendingRequests, t]);

  useEffect(() => {
    const fetchPaymentRequests = async () => {
      try {
        const res = await api.get('/payments/owner/requests');
        setPaymentRequests(res.data);
      } catch (err) {
        console.error('Error fetching payment requests:', err);
      }
    };

    const fetchFinancialSummary = async () => {
      try {
        const res = await api.get('/payments/owner/summary');
        setFinancialSummary(res.data);
      } catch (err) {
        console.error('Error fetching financial summary:', err);
      }
    };

    const fetchMaintenanceOverview = async () => {
      try {
        const res = await api.get('/requests/maintenance/owner');
        setMaintenanceOverview(res.data);
      } catch (err) {
        console.error('Error fetching maintenance requests overview:', err);
      }
    };

    fetchPaymentRequests();
    fetchFinancialSummary();
    fetchMaintenanceOverview();
  }, []);

  const handleApproveRequest = (requestId: string) => {
    const request = (requests as any[]).find((r) => r._id === requestId);

    if (request && request.status === 'approved') {
      toast.info(t('This request is already approved', 'இந்த கோரிக்கை ஏற்கனவே அங்கீகரிக்கப்பட்டது'));
      return;
    }

    if (request && request.status === 'rejected') {
      toast.info(t('This request has been rejected', 'இந்த கோரிக்கை நிராகரிக்கப்பட்டுவிட்டது'));
      return;
    }

    approveRequest.mutate(requestId, {
      onSuccess: () => toast.success(t('Request approved successfully', 'கோரிக்கை வெற்றிகரமாக அங்கீகரிக்கப்பட்டது')),
      onError: (error: any) => {
        const msg = error?.response?.data?.msg || t('Failed to approve request', 'கோரிக்கையை அங்கீகரிக்க முடியவில்லை');
        toast.error(msg);
      }
    });
  };

  const handleRejectRequest = (requestId: string) => {
    rejectRequest.mutate(requestId, {
      onSuccess: () => toast.success(t('Request rejected', 'கோரிக்கை நிராகரிக்கப்பட்டது')),
      onError: () => toast.error(t('Failed to reject request', 'கோரிக்கையை நிராகரிக்க முடியவில்லை'))
    });
  };

  const handleApprovePayment = async (input: any) => {
    try {
      await api.put(`/payments/${input._id}/approve`, {});
      toast.success('Payment approved! Receipt generated.');
      // Refresh list
      const res = await api.get('/payments/owner/requests');
      setPaymentRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve payment');
    }
  };

  const handleRejectPayment = async (id: string) => {
    try {
      await api.put(`/payments/${id}/reject`, {});
      toast.success('Payment rejected.');
      // Refresh list
      const res = await api.get('/payments/owner/requests');
      setPaymentRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject payment');
    }
  };

  const handleEditProperty = (property: Property) => {
    console.log('Editing property:', property);
    setEditingProperty(property);
    setIsPropertyFormOpen(true);
  };

  const handleDeleteProperty = (property: Property) => {
    setDeletingProperty(property);
  };

  const confirmDeleteProperty = () => {
    if (deletingProperty) {
      deletePropertyMutation.mutate(deletingProperty.id || (deletingProperty as any)._id, {
        onSuccess: () => {
          toast.success(t('Property deleted successfully', 'சொத்து வெற்றிகரமாக நீக்கப்பட்டது'));
          setDeletingProperty(null);
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.msg || t('Failed to delete property', 'சொத்தை நீக்க முடியவில்லை');
          toast.error(msg);
        }
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const updateData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        aadhar: formData.get('aadhar'),
        address: formData.get('address'),
        dateOfBirth: formData.get('dateOfBirth'),
        gender: formData.get('gender'),
        occupation: formData.get('occupation'),
        companyName: formData.get('companyName'),
        monthlyIncome: formData.get('monthlyIncome')
          ? parseInt(formData.get('monthlyIncome') as string)
          : undefined,
        maritalStatus: formData.get('maritalStatus'),
        familyMembers: formData.get('familyMembers')
          ? parseInt(formData.get('familyMembers') as string)
          : undefined,
        idType: formData.get('idType'),
        idNumber: formData.get('idNumber'),
        idProofImage: idProofImage || undefined,
        notificationsEnabled: formData.get('notificationsEnabled') === 'on'
      };

      await api.put('/users/profile', updateData);

      await refetchUserProfile();
      toast.success(t('Profile updated successfully', 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது'));
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error(t('Failed to update profile', 'சுயவிவரத்தைப் புதுப்பிக்க முடியவில்லை'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const currentPassword = (formData.get('currentPassword') as string) || '';
      const newPassword = (formData.get('newPassword') as string) || '';
      const confirmPassword = (formData.get('confirmPassword') as string) || '';

      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error(
          t('Please fill all password fields', 'கடவுச்சொல் தொடர்பான அனைத்து புலங்களையும் நிரப்பவும்')
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error(
          t('New password and confirm password do not match', 'புதிய கடவுச்சொல் மற்றும் உறுதிப்படுத்தல் கடவுச்சொல் பொருந்தவில்லை')
        );
        return;
      }

      await api.put('/auth/change-password', { currentPassword, newPassword });

      form.reset();
      toast.success(
        t('Password updated successfully', 'கடவுச்சொல் வெற்றிகரமாக புதுப்பிக்கப்பட்டது')
      );
    } catch (err: any) {
      console.error('Change password error:', err);
      const msg =
        err?.response?.data?.msg ||
        t('Failed to update password', 'கடவுச்சொல்லை புதுப்பிக்க முடியவில்லை');
      toast.error(msg);
    }
  };

  const totalProperties = myProperties.length;
  const occupiedProperties = myProperties.filter((p: any) => p.tenant).length;
  const vacantProperties = totalProperties - occupiedProperties;
  const totalTenants = (() => {
    const ids = new Set<string>();
    (myProperties as any[]).forEach((p) => {
      if (!p.tenant) return;
      if (typeof p.tenant === 'string') {
        ids.add(p.tenant);
      } else if (p.tenant._id) {
        ids.add(p.tenant._id);
      } else if (p.tenant.email) {
        ids.add(p.tenant.email);
      } else if (p.tenant.name) {
        ids.add(p.tenant.name);
      }
    });
    return ids.size;
  })();

  const allPropertiesList = myProperties as any[];
  const occupiedPropertiesList = allPropertiesList.filter((p: any) => p.tenant);
  const vacantPropertiesList = allPropertiesList.filter((p: any) => !p.tenant);

  const tenantSummary = (() => {
    const map = new Map<string, any>();
    occupiedPropertiesList.forEach((p: any) => {
      const t = p.tenantDetails || p.tenant;
      if (!t) return;
      let key = '';
      if (typeof t === 'string') {
        key = t;
      } else if (t._id) {
        key = t._id;
      } else if (t.email) {
        key = t.email;
      } else if (t.name) {
        key = t.name;
      }
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: typeof t === 'object' && t.name ? t.name : '',
          email: typeof t === 'object' && t.email ? t.email : '',
          phone: typeof t === 'object' && t.phone ? t.phone : '',
          properties: []
        });
      }
      const entry = map.get(key);
      entry.properties.push(p.title || '');
    });
    return Array.from(map.values());
  })();

  const currentPropertyList =
    rentDetailsType === 'totalProperties'
      ? allPropertiesList
      : rentDetailsType === 'occupiedProperties'
        ? occupiedPropertiesList
        : rentDetailsType === 'vacantProperties'
          ? vacantPropertiesList
          : [];

  const maintenanceProperties = (() => {
    const byId = new Map<
      string,
      {
        propertyId: string;
        title: string;
        location: string;
        total: number;
        pending: number;
        inProgress: number;
        latestAt: number;
      }
    >();

    const getPropertyId = (p: any) => String(p?._id || p?.id || '');

    (maintenanceOverview || []).forEach((m: any) => {
      const p = m?.property;
      const propertyId = getPropertyId(p);
      if (!propertyId) return;

      const title = String(p?.title || t('Property', 'சொத்து'));
      const location = String(p?.location || '');

      const existing = byId.get(propertyId) || {
        propertyId,
        title,
        location,
        total: 0,
        pending: 0,
        inProgress: 0,
        latestAt: 0
      };

      existing.total += 1;
      if (m?.status === 'pending') existing.pending += 1;
      if (m?.status === 'in-progress') existing.inProgress += 1;

      const ts = new Date(m?.createdAt || m?.updatedAt || Date.now()).getTime();
      if (!Number.isNaN(ts)) existing.latestAt = Math.max(existing.latestAt, ts);

      byId.set(propertyId, existing);
    });

    return Array.from(byId.values()).sort((a, b) => {
      if (b.pending !== a.pending) return b.pending - a.pending;
      if (b.inProgress !== a.inProgress) return b.inProgress - a.inProgress;
      return b.latestAt - a.latestAt;
    });
  })();

  const openMaintenanceForProperty = (propertyId: string) => {
    const match = (myProperties as any[]).find((p: any) => String(p?._id || p?.id) === propertyId);
    if (!match) {
      toast.error(t('Property not found for this request', 'இந்த கோரிக்கைக்கான சொத்து கிடைக்கவில்லை'));
      return;
    }
    setMaintenanceModalOpen(false);
    setSelectedPropertyInitialTab('maintenance');
    setSelectedProperty(match);
  };

  return (
    <>
      {selectedProperty ? (
        // Show full-screen property view
        <PropertyFullScreenView 
          property={selectedProperty}
          initialTab={selectedPropertyInitialTab}
          onBack={() => {
            setSelectedProperty(null);
            setSelectedPropertyInitialTab('tenant');
          }}
        />
      ) : (
        // Show Owner Dashboard
        <div className="container py-8 sm:py-12 lg:py-16 px-4 sm:px-6">
          <div className="mx-auto max-w-7xl space-y-8">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('Owner Dashboard', 'உரிமையாளர் கட்டுப்பாட்டு அறை')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('Welcome back', 'மீண்டும் வருக')}, {userProfile?.name || 'Owner'}
            </p>
          </div>
          <Button onClick={() => setIsPropertyFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('Add Property', 'சொத்தைச் சேர்க்கவும்')}
          </Button>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <Home className="w-4 h-4 mr-2" />
              {t('Overview', 'கண்ணோட்டம்')}
            </TabsTrigger>
            <TabsTrigger value="properties">
              <Building className="w-4 h-4 mr-2" />
              {t('My Properties', 'என் சொத்துக்கள்')}
            </TabsTrigger>
            <TabsTrigger value="requests">
              <Inbox className="w-4 h-4 mr-2" />
              {t('Requests', 'கோரிக்கைகள்')}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              {t('Settings', 'அமைப்புகள்')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-8">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card
                className="cursor-pointer"
                onClick={() => setRentDetailsType('totalProperties')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('Total Properties', 'மொத்த சொத்துக்கள்')}
                  </CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProperties}</div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer"
                onClick={() => setRentDetailsType('occupiedProperties')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('Occupied Properties', 'குடியேற்றப்பட்ட சொத்துக்கள்')}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{occupiedProperties}</div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer"
                onClick={() => setRentDetailsType('vacantProperties')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('Vacant Properties', 'காலியாக உள்ள சொத்துக்கள்')}
                  </CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vacantProperties}</div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer"
                onClick={() => setRentDetailsType('totalTenants')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('Total Tenants', 'மொத்த குத்தகைதாரர்கள்')}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTenants}</div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer"
                onClick={() => setRentDetailsType('expectedRent')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('This Month Expected Rent', 'இந்த மாத எதிர்பார்க்கப்படும் வாடகை')}
                  </CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{financialSummary.expected.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer"
                onClick={() => setRentDetailsType('pendingRent')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('This Month Pending Rent', 'இந்த மாத நிலுவை வாடகை')}
                  </CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{financialSummary.pending.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card 
                id="tenant-requests-overview"
                className={totalPendingRequests > 0 ? "border-amber-500/50 shadow-md transition-all duration-500 relative overflow-hidden" : ""}
              >
                {totalPendingRequests > 0 && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping -mr-1 -mt-1" />
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {t('Tenant Requests Overview', 'குத்தகைதாரர் கோரிக்கைகள் கண்ணோட்டம்')}
                    {totalPendingRequests > 0 && (
                      <Badge variant="destructive" className="ml-2 animate-pulse">
                        {totalPendingRequests} {t('New', 'புதியது')}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      'Quick view of rent, maintenance and payment requests',
                      'வாடகை, பராமரிப்பு மற்றும் கட்டண கோரிக்கைகளின் விரைவு கண்ணோட்டம்'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors hover:bg-muted/50 ${
                      overviewActiveSection === 'rentRequests' ? 'bg-muted' : ''
                    } ${pendingRentCount > 0 ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}`}
                    onClick={() => {
                      setActiveTab('requests');
                      setOverviewActiveSection('rentRequests');
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${pendingRentCount > 0 ? 'bg-blue-100' : 'bg-muted'}`}>
                        <Home className={`h-4 w-4 ${pendingRentCount > 0 ? 'text-blue-600' : 'text-blue-500'}`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {t('Rent Requests', 'வாடகை கோரிக்கைகள்')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            'Incoming rent enquiries from tenants',
                            'குத்தகைதாரர்களிடமிருந்து வரும் வாடகை தொடர்பான கோரிக்கைகள்'
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant={pendingRentCount > 0 ? "destructive" : "secondary"} className={pendingRentCount > 0 ? "animate-pulse" : ""}>
                      {pendingRentCount}
                    </Badge>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors hover:bg-muted/50 ${
                      overviewActiveSection === 'maintenanceRequests' ? 'bg-muted' : ''
                    } ${pendingMaintenanceCount > 0 ? 'border-l-4 border-l-amber-500 bg-amber-50/50' : ''}`}
                    onClick={() => {
                      setOverviewActiveSection('maintenanceRequests');
                      setMaintenanceModalOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${pendingMaintenanceCount > 0 ? 'bg-amber-100' : 'bg-muted'}`}>
                        <Wrench className={`h-4 w-4 ${pendingMaintenanceCount > 0 ? 'text-amber-600' : 'text-amber-500'}`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {t('Maintenance Requests', 'பராமரிப்பு கோரிக்கைகள்')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            'Issues raised by tenants for your properties',
                            'உங்கள் சொத்துகளுக்காக குத்தகைதாரர்கள் எழுப்பிய சிக்கல்கள்'
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant={pendingMaintenanceCount > 0 ? "destructive" : "secondary"} className={pendingMaintenanceCount > 0 ? "animate-pulse" : ""}>
                      {pendingMaintenanceCount}
                    </Badge>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors hover:bg-muted/50 ${
                      overviewActiveSection === 'paymentRequests' ? 'bg-muted' : ''
                    } ${pendingPaymentCount > 0 ? 'border-l-4 border-l-green-500 bg-green-50/50' : ''}`}
                    onClick={() => {
                      setActiveTab('overview');
                      setOverviewActiveSection('paymentRequests');
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${pendingPaymentCount > 0 ? 'bg-green-100' : 'bg-muted'}`}>
                        <CreditCard className={`h-4 w-4 ${pendingPaymentCount > 0 ? 'text-green-600' : 'text-green-500'}`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {t('Payment Requests', 'கட்டண கோரிக்கைகள்')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            'Pending rent payments submitted by tenants',
                            'குத்தகைதாரர்களால் சமர்ப்பிக்கப்பட்ட நிலுவை வாடகை கட்டணங்கள்'
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant={pendingPaymentCount > 0 ? "destructive" : "secondary"} className={pendingPaymentCount > 0 ? "animate-pulse" : ""}>
                      {pendingPaymentCount}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <RentStatusGraph 
                data={rentHistory?.graph || []} 
                payments={rentHistory?.lastPayments || []}
                title={t('Rent Status Summary', 'வாடகை நிலை சுருக்கம்')}
                role="owner"
              />
            </div>
          </TabsContent>

          {/* My Properties Tab */}
          <TabsContent value="properties" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myProperties.length > 0 ? (
                myProperties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => {
                      setSelectedPropertyInitialTab('tenant');
                      setSelectedProperty(property);
                    }}
                    className="cursor-pointer"
                  >
                    <PropertyCard 
                      property={property} 
                      showRequestButton={false} 
                      onEdit={handleEditProperty}
                      onDelete={handleDeleteProperty}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  {t('No properties found. Add your first property!', 'சொத்துக்கள் எதுவும் காணப்படவில்லை. உங்கள் முதல் சொத்தைச் சேர்க்கவும்!')}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('Property Requests', 'சொத்து கோரிக்கைகள்')}</CardTitle>
                <CardDescription>
                  {t('Manage incoming rent and buy requests from potential tenants.', 'சாத்தியமான குத்தகைதாரர்களிடமிருந்து வரும் வாடகை மற்றும் கொள்முதல் கோரிக்கைகளை நிர்வகிக்கவும்.')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Inbox className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
                    {t('No pending requests found.', 'நிலுவையில் உள்ள கோரிக்கைகள் எதுவும் காணப்படவில்லை.')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request: any) => (
                      <div key={request._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <div className="space-y-1 mb-4 md:mb-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${request.type === 'rent' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                              {request.type === 'rent' ? t('Rent Request', 'வாடகை கோரிக்கை') : t('Buy Request', 'வாங்க கோரிக்கை')}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              request.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {request.status.toUpperCase()}
                            </span>
                          </div>
                          <h4 className="font-semibold text-lg">{request.property?.title}</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>{request.tenant?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span>{request.property?.location}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          className="w-full md:w-auto"
                          onClick={() => setSelectedRequest(request)}
                        >
                          {t('View Details', 'விவரங்களைப் காண்க')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('Profile Settings', 'சுயவிவர அமைப்புகள்')}</CardTitle>
                <CardDescription>{t('Manage your personal information', 'உங்கள் தனிப்பட்ட தகவல்களை நிர்வகிக்கவும்')}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Profile Completion Progress */}
                {(() => {
                  const fields = [
                    { key: 'name', label: t('Full Name', 'முழு பெயர்'), value: userProfile?.name },
                    { key: 'phone', label: t('Phone Number', 'தொலைபேசி எண்'), value: userProfile?.phone },
                    { key: 'address', label: t('Address', 'முகவரி'), value: userProfile?.address },
                    { key: 'dateOfBirth', label: t('Date of Birth', 'பிறந்த தேதி'), value: userProfile?.dateOfBirth },
                    { key: 'gender', label: t('Gender', 'பாலினம்'), value: userProfile?.gender },
                    { key: 'occupation', label: t('Occupation', 'தொழில்'), value: userProfile?.occupation },
                    { key: 'companyName', label: t('Company Name', 'நிறுவனத்தின் பெயர்'), value: userProfile?.companyName },
                    { key: 'monthlyIncome', label: t('Monthly Income', 'மாத வருமானம்'), value: userProfile?.monthlyIncome },
                    { key: 'familyMembers', label: t('Family Members', 'குடும்ப உறுப்பினர்கள்'), value: userProfile?.familyMembers },
                    { key: 'maritalStatus', label: t('Marital Status', 'திருமண நிலை'), value: userProfile?.maritalStatus },
                    { key: 'aadhar', label: t('ID Number', 'அடையாள எண்'), value: userProfile?.aadhar || userProfile?.idNumber },
                    { key: 'idType', label: t('ID Type', 'அடையாள வகை'), value: userProfile?.idType },
                  ];
                  const total = fields.length;
                  const filled = fields.filter(f => f.value !== undefined && f.value !== null && String(f.value).trim() !== '').length;
                  const percent = Math.round((filled / total) * 100);
                  const missingFields = fields.filter(f => !(f.value !== undefined && f.value !== null && String(f.value).trim() !== ''));
                  const size = 140;
                  const stroke = 12;
                  const radius = (size - stroke) / 2;
                  const circumference = 2 * Math.PI * radius;
                  const dashOffset = circumference * (1 - percent / 100);
                  const color = percent < 40 ? '#ef4444' : percent < 80 ? '#f97316' : '#16a34a';

                  const handleMissingFieldClick = (key: string) => {
                    const el = document.getElementById(key);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.focus();
                      el.classList.add('ring-2', 'ring-red-400', 'border-red-500');
                      setTimeout(() => {
                        el.classList.remove('ring-2', 'ring-red-400', 'border-red-500');
                      }, 2000);
                    }
                  };

                  return (
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                      <div className="relative" style={{ width: size, height: size }}>
                        <svg width={size} height={size}>
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="#e5e7eb"
                            strokeWidth={stroke}
                            fill="none"
                          />
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={color}
                            strokeWidth={stroke}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{percent}%</div>
                            <div className="text-xs text-muted-foreground">{t('Profile Complete', 'சுயவிவரம் நிறைவு')}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 w-full">
                        {percent < 100 && (
                          <div className="rounded-md border p-3">
                            <div className="text-sm font-medium mb-2">{t('Missing Fields', 'இல்லாத புலங்கள்')}</div>
                            <div className="flex flex-wrap gap-2">
                              {missingFields.map((field) => (
                                <button
                                  key={field.key}
                                  type="button"
                                  onClick={() => handleMissingFieldClick(field.key)}
                                  className="text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80 focus:outline-none"
                                >
                                  {field.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                  <div className="space-y-2">
                    <Label>{t('Profile Picture', 'சுயவிவரப் படம்')}</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border">
                        {profilePreview ? (
                          <img src={profilePreview} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('Upload a picture from your local files (JPG, PNG)', 'உங்கள் உள்ளூர் கோப்புகளிலிருந்து ஒரு படத்தை பதிவேற்றவும் (JPG, PNG)')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">{t('Full Name', 'முழு பெயர்')}</Label>
                    <Input id="name" name="name" defaultValue={userProfile?.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('Email', 'மின்னஞ்சல்')}</Label>
                    <Input id="email" type="email" defaultValue={userProfile?.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('Phone Number', 'தொலைபேசி எண்')}</Label>
                    <Input id="phone" name="phone" defaultValue={userProfile?.phone} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">{t('Address', 'முகவரி')}</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={userProfile?.address}
                      placeholder="Your permanent address"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">{t('Date of Birth', 'பிறந்த தேதி')}</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        defaultValue={
                          userProfile?.dateOfBirth
                            ? new Date(userProfile.dateOfBirth).toISOString().split('T')[0]
                            : ''
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">{t('Gender', 'பாலினம்')}</Label>
                      <select
                        id="gender"
                        name="gender"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                        defaultValue={userProfile?.gender || ''}
                      >
                        <option value="">{t('Select Gender', 'பாலினத்தை தேர்வு செய்யவும்')}</option>
                        <option value="Male">{t('Male', 'ஆண்')}</option>
                        <option value="Female">{t('Female', 'பெண்')}</option>
                        <option value="Other">{t('Other', 'மற்றவை')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="familyMembers">{t('Family Members', 'குடும்ப உறுப்பினர்கள்')}</Label>
                      <Input
                        id="familyMembers"
                        name="familyMembers"
                        type="number"
                        min="1"
                        placeholder={t('e.g., 4', 'எ.கா., 4')}
                        defaultValue={userProfile?.familyMembers || ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="occupation">{t('Occupation', 'தொழில்')}</Label>
                      <Input
                        id="occupation"
                        name="occupation"
                        placeholder={t('e.g., Landlord', 'எ.கா., உரிமையாளர்')}
                        defaultValue={userProfile?.occupation || ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName">{t('Company Name', 'நிறுவனத்தின் பெயர்')}</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder={t('e.g., ABC Pvt Ltd', 'எ.கா., ABC Pvt Ltd')}
                        defaultValue={userProfile?.companyName || ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlyIncome">
                        {t('Monthly Income (Optional)', 'மாத வருமானம் (விருப்பம்)')}
                      </Label>
                      <Input
                        id="monthlyIncome"
                        name="monthlyIncome"
                        type="number"
                        min="0"
                        placeholder={t('e.g., 75000', 'எ.கா., 75000')}
                        defaultValue={userProfile?.monthlyIncome || ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">{t('Marital Status', 'திருமண நிலை')}</Label>
                      <select
                        id="maritalStatus"
                        name="maritalStatus"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                        defaultValue={userProfile?.maritalStatus || ''}
                      >
                        <option value="">{t('Select Status', 'நிலையை தேர்வு செய்யவும்')}</option>
                        <option value="Single">{t('Single', 'திருமணம் ஆகாதவர்')}</option>
                        <option value="Married">{t('Married', 'திருமணமானவர்')}</option>
                        <option value="Divorced">{t('Divorced', 'விவாகரத்து')}</option>
                        <option value="Widowed">{t('Widowed', 'விதவை')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aadhar">{t('ID Number', 'அடையாள எண்')}</Label>
                      <Input
                        id="aadhar"
                        name="aadhar"
                        placeholder="XXXX XXXX XXXX"
                        defaultValue={userProfile?.aadhar || userProfile?.idNumber}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idType">{t('ID Type', 'அடையாள வகை')}</Label>
                      <select
                        id="idType"
                        name="idType"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                        defaultValue={userProfile?.idType || ''}
                      >
                        <option value="">{t('Select ID Type', 'அடையாள வகையை தேர்வு செய்யவும்')}</option>
                        <option value="Aadhaar">Aadhaar</option>
                        <option value="PAN">PAN</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idProof">{t('Upload ID Proof', 'அடையாள ஆதாரத்தை பதிவேற்றவும்')}</Label>
                      <Input
                        id="idProof"
                        type="file"
                        accept="image/*"
                        onChange={handleIdProofChange}
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label htmlFor="notificationsEnabled">{t('Notifications', 'அறிவிப்புகள்')}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="notificationsEnabled"
                        name="notificationsEnabled"
                        type="checkbox"
                        defaultChecked={userProfile?.notificationsEnabled ?? true}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-muted-foreground">
                        {t(
                          'Receive important updates and alerts',
                          'முக்கிய புதுப்பிப்புகள் மற்றும் எச்சரிக்கைகளை பெறவும்'
                        )}
                      </span>
                    </div>
                  </div>

                  <Button type="submit">{t('Save Changes', 'மாற்றங்களைச் சேமிக்கவும்')}</Button>
                </form>

                <div className="mt-10 border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {t('Change Password', 'கடவுச்சொல்லை மாற்றவும்')}
                  </h3>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">
                        {t('Current Password', 'தற்போதைய கடவுச்சொல்')}
                      </Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        autoComplete="current-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">
                        {t('New Password', 'புதிய கடவுச்சொல்')}
                      </Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        {t('Confirm New Password', 'புதிய கடவுச்சொல்லை உறுதிப்படுத்தவும்')}
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                      />
                    </div>
                    <Button type="submit" variant="outline">
                      {t('Update Password', 'கடவுச்சொல்லை புதுப்பிக்கவும்')}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Property Modal */}
        <PropertyForm
          open={isPropertyFormOpen}
          onOpenChange={(open) => {
            setIsPropertyFormOpen(open);
            if (!open) setEditingProperty(null);
          }}
          initialData={editingProperty}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingProperty} onOpenChange={(open) => !open && setDeletingProperty(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('Are you sure?', 'நிச்சயமாகவா?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'This action cannot be undone. This will permanently delete the property.',
                  'இந்தச் செயலைத் தவிர்க்க முடியாது. இது சொத்தை நிரந்தரமாக நீக்கும்.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('Cancel', 'ரத்து')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteProperty} className="bg-red-600 hover:bg-red-700">
                {t('Delete', 'நீக்கு')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </div>
      )}

      <Dialog open={maintenanceModalOpen} onOpenChange={setMaintenanceModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Maintenance Requests', 'பராமரிப்பு கோரிக்கைகள்')}</DialogTitle>
            <DialogDescription>
              {t(
                'Select a property to open its Maintenance tab',
                'Maintenance தாளைத் திறக்க ஒரு சொத்தைத் தேர்ந்தெடுக்கவும்'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {maintenanceProperties.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                {t('No maintenance requests found.', 'பராமரிப்பு கோரிக்கைகள் எதுவும் இல்லை.')}
              </div>
            ) : (
              maintenanceProperties.map((p) => (
                <button
                  key={p.propertyId}
                  type="button"
                  onClick={() => openMaintenanceForProperty(p.propertyId)}
                  className="w-full text-left border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.title}</p>
                      {p.location && <p className="text-xs text-muted-foreground truncate">{p.location}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={p.pending > 0 ? 'destructive' : 'secondary'}>
                        {p.pending > 0 ? `${p.pending} ${t('New', 'புதியது')}` : `${p.total}`}
                      </Badge>
                      {p.inProgress > 0 && (
                        <Badge variant="outline" className="bg-background/80">
                          {p.inProgress} {t('In progress', 'செயல்பாட்டில்')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <RequestDetailsModal
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        isLoading={approveRequest.isPending || rejectRequest.isPending}
      />

      <Dialog open={rentDetailsType !== null} onOpenChange={() => setRentDetailsType(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {rentDetailsType === 'expectedRent'
                ? t('Expected Rent Breakdown', 'எதிர்பார்க்கப்படும் வாடகை விவரம்')
                : rentDetailsType === 'pendingRent'
                  ? t('Pending Rent Breakdown', 'நிலுவை வாடகை விவரம்')
                  : rentDetailsType === 'totalProperties'
                    ? t('All Properties', 'அனைத்து சொத்துக்கள்')
                    : rentDetailsType === 'occupiedProperties'
                      ? t('Occupied Properties', 'குடியேற்றப்பட்ட சொத்துக்கள்')
                      : rentDetailsType === 'vacantProperties'
                        ? t('Vacant Properties', 'காலியாக உள்ள சொத்துக்கள்')
                        : t('Tenants', 'குத்தகைதாரர்கள்')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'Detailed information for this metric.',
                'இந்த அளவுக்கான விரிவான தகவல்.'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {rentDetailsType === 'expectedRent' || rentDetailsType === 'pendingRent' ? (
              <div className="space-y-4">
                <div className="border rounded-md px-4 py-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('Expected Rent (this month)', 'இந்த மாத எதிர்பார்க்கப்படும் வாடகை')}</span>
                    <span className="font-medium">
                      ₹{Number(financialSummary.expected || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('Total Paid (this month)', 'இந்த மாதம் செலுத்தப்பட்ட மொத்தம்')}</span>
                    <span className="font-medium">
                      ₹{Number(financialSummary.collected || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('Pending Rent (this month)', 'இந்த மாத நிலுவை வாடகை')}</span>
                    <span className="font-medium">
                      ₹{Number(financialSummary.pending || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t(
                      'Pending = Expected Rent - Total Paid for all occupied properties.',
                      'நிலுவை = அனைத்து குடியேற்றப்பட்ட சொத்துகளின் எதிர்பார்க்கப்படும் வாடகை − செலுத்தப்பட்ட மொத்தம்.'
                    )}
                  </div>
                </div>
                {(!financialSummary.breakdown || financialSummary.breakdown.length === 0) ? (
                  <p className="text-sm text-muted-foreground">
                    {t('No occupied properties with rent for this month.', 'இந்த மாதத்திற்கு வாடகையுடன் கூடிய குடியேற்றப்பட்ட சொத்துக்கள் எதுவும் இல்லை.')}
                  </p>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-4 gap-2 bg-muted px-4 py-2 text-sm font-medium">
                      <div>{t('Property', 'சொத்து')}</div>
                      <div className="text-right">{t('Monthly Rent', 'மாத வாடகை')}</div>
                      <div className="text-right">{t('Paid This Month', 'இந்த மாதம் செலுத்தப்பட்டது')}</div>
                      <div className="text-right">{t('Pending This Month', 'இந்த மாத நிலுவை')}</div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {financialSummary.breakdown.map((item: any) => (
                        <div
                          key={item.propertyId}
                          className="grid grid-cols-4 gap-2 px-4 py-2 text-sm border-t"
                        >
                          <div>
                            <div className="font-medium">
                              {item.propertyTitle || t('Property', 'சொத்து')}
                            </div>
                            {item.propertyLocation && (
                              <div className="text-xs text-muted-foreground">
                                {item.propertyLocation}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            ₹{Number(item.rentAmount || 0).toLocaleString()}
                          </div>
                          <div className="text-right">
                            ₹{Number(item.totalPaid || 0).toLocaleString()}
                          </div>
                          <div className="text-right">
                            ₹{Number(item.balance || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : rentDetailsType === 'totalProperties' ||
              rentDetailsType === 'occupiedProperties' ||
              rentDetailsType === 'vacantProperties' ? (
              currentPropertyList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('No properties to display.', 'காண்பிக்க சொத்துக்கள் இல்லை.')}
                </p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-3 gap-2 bg-muted px-4 py-2 text-sm font-medium">
                    <div>{t('Property', 'சொத்து')}</div>
                    <div>{t('Location', 'இடம்')}</div>
                    <div className="text-right">{t('Status', 'நிலை')}</div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {currentPropertyList.map((p: any) => (
                      <div
                        key={p.id}
                        className="grid grid-cols-3 gap-2 px-4 py-2 text-sm border-t"
                      >
                        <div className="font-medium">{p.title}</div>
                        <div>{p.location}</div>
                        <div className="text-right">
                          {p.tenant
                            ? t('Occupied', 'குடியேற்றப்பட்டுள்ளது')
                            : t('Vacant', 'காலியாக உள்ளது')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : rentDetailsType === 'totalTenants' ? (
              tenantSummary.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('No tenants to display.', 'காண்பிக்க குத்தகைதாரர்கள் இல்லை.')}
                </p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-3 gap-2 bg-muted px-4 py-2 text-sm font-medium">
                    <div>{t('Tenant', 'குத்தகைதாரர்')}</div>
                    <div>{t('Contact', 'தொடர்பு')}</div>
                    <div className="text-right">{t('Properties', 'சொத்துக்கள்')}</div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {tenantSummary.map((tenant: any) => (
                      <div
                        key={tenant.id}
                        className="grid grid-cols-3 gap-2 px-4 py-2 text-sm border-t"
                      >
                        <div className="font-medium">
                          {tenant.name || t('Tenant', 'குத்தகைதாரர்')}
                        </div>
                        <div className="text-xs">
                          {tenant.email && <div>{tenant.email}</div>}
                          {tenant.phone && <div>{tenant.phone}</div>}
                        </div>
                        <div className="text-right">
                          {tenant.properties.length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
