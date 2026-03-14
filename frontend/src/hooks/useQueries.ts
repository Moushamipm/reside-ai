import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import api from '../lib/api';
import type { Property, UserProfile, PropertyStatus, PropertyRequest } from '../types';
import { TamilRole, ExternalBlob } from '../types';

const API_URL = 'http://localhost:5000/api';

// Define simplified types that might be used in components
// You may need to expand these based on usage
interface PropertyInput {
  title: string;
  propertyType: string;
  location: string;
  price: bigint | number;
  transactionType: string;
  status: any;
  images: any[];
  geoLocatedImage: any;
  geoLocation: any;
  totalArea?: number;
  bedrooms?: number;
  facing?: string;
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      try {
        // Primary path: authenticated current user from /auth/me
        const primaryRes = await api.get('/auth/me');
        const primaryUser = primaryRes.data;
        if (primaryUser) {
          const profile: UserProfile = {
            id: primaryUser._id || primaryUser.id,
            name: primaryUser.name,
            email: primaryUser.email,
            role: primaryUser.tamilRole as TamilRole,
            approved: primaryUser.approved,
            walletAddress: 'MERN-Wallet-Placeholder',
            phone: primaryUser.phone,
            address: primaryUser.address,
            aadhar: primaryUser.aadhar,
            gender: primaryUser.gender,
            age: primaryUser.age,
            dateOfBirth: primaryUser.dateOfBirth,
            familyMembers: primaryUser.familyMembers,
            religion: primaryUser.religion,
            occupation: primaryUser.occupation,
            companyName: primaryUser.companyName,
            monthlyIncome: primaryUser.monthlyIncome,
            maritalStatus: primaryUser.maritalStatus,
            idType: primaryUser.idType,
            idNumber: primaryUser.idNumber,
            idProofImage: primaryUser.idProofImage,
            notificationsEnabled: primaryUser.notificationsEnabled,
            profileCompletion: primaryUser.profileCompletion
          };
          return profile;
        }
        return null;
      } catch (error) {
        // Fallback path: fetch from resideai.users using stored user email
        try {
          const storedUserRaw = localStorage.getItem('user');
          if (storedUserRaw) {
            const storedUser = JSON.parse(storedUserRaw) as { email?: string };
            if (storedUser.email) {
              const res = await axios.get(`${API_URL}/users`);
              const users = res.data as any[];
              const matched = users.find((u) => u.email === storedUser.email);
              if (matched) {
                const profile: UserProfile = {
                  id: matched._id || matched.id,
                  name: matched.name,
                  email: matched.email,
                  role: matched.tamilRole as TamilRole,
                  approved: matched.approved,
                  walletAddress: 'MERN-Wallet-Placeholder',
                  phone: matched.phone,
                  address: matched.address,
                  aadhar: matched.aadhar,
                  gender: matched.gender,
                  age: matched.age,
                  dateOfBirth: matched.dateOfBirth,
                  familyMembers: matched.familyMembers,
                  religion: matched.religion,
                  occupation: matched.occupation,
                  companyName: matched.companyName,
                  monthlyIncome: matched.monthlyIncome,
                  maritalStatus: matched.maritalStatus,
                  idType: matched.idType,
                  idNumber: matched.idNumber,
                  idProofImage: matched.idProofImage,
                  notificationsEnabled: matched.notificationsEnabled,
                  profileCompletion: matched.profileCompletion
                };
                return profile;
              }
            }
          }
        } catch {
          // Ignore fallback errors and return null below
        }
        return null;
      }
    },
    retry: false,
  });

  return {
    ...query,
    isLoading: query.isLoading,
    isFetched: query.isFetched,
  };
}

export function useRegisterUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, email, role, password }: { name: string; email: string; role: TamilRole; password?: string }) => {
      const finalPassword = password || 'defaultPassword123';
      const res = await api.post('/auth/register', { 
        name, 
        email, 
        password: finalPassword, 
        tamilRole: role 
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['approvalStatus'] });
      queryClient.invalidateQueries({ queryKey: ['callerAdmin'] });
    },
  });
}

// Admin Authorization Query
export function useIsCallerAdmin() {
  const { data: profile, isLoading, refetch } = useGetCallerUserProfile();
  
  return {
    data: profile?.role === TamilRole.superAdmin,
    isLoading,
    refetch
  };
}

// Approval Queries
export function useIsCallerApproved() {
  const { data: profile, isLoading } = useGetCallerUserProfile();
  
  return {
    data: profile?.approved ?? false,
    isLoading
  };
}

export function useSaveCallerUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// --- New Hooks for MERN Stack ---

// Properties
export function useAddProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (property: PropertyInput) => {
      // Convert BigInt to string/number for JSON serialization if needed
      // but Axios might handle it or we cast it
      const payload = {
        ...property,
        // Backend expects `propertyFacing`; frontend form uses `facing`
        propertyFacing: (property as any).facing,
        price: Number(property.price) // Convert BigInt to number for MongoDB
      };
      
      const res = await api.post('/properties', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProperties'] });
      queryClient.invalidateQueries({ queryKey: ['myProperties'] });
    }
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PropertyInput> }) => {
      const payload = {
        ...data,
        propertyFacing: (data as any).facing,
        price: data.price ? Number(data.price) : undefined,
        totalArea: data.totalArea ? Number(data.totalArea) : undefined,
        bedrooms: data.bedrooms ? Number(data.bedrooms) : undefined,
      };
      
      const res = await api.put(`/properties/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProperties'] });
      queryClient.invalidateQueries({ queryKey: ['myProperties'] });
    }
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/properties/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProperties'] });
      queryClient.invalidateQueries({ queryKey: ['myProperties'] });
    }
  });
}

export function useGetAllProperties() {
  return useQuery({
    queryKey: ['allProperties'],
    queryFn: async () => {
      const res = await api.get('/properties');
      // Ensure id property exists for frontend components
      return res.data.map((p: any) => ({
        ...p,
        id: p._id || p.id,
        facing: p.facing ?? p.propertyFacing
      }));
    }
  });
}

export function useGetMyProperties() {
  return useQuery({
    queryKey: ['myProperties'],
    queryFn: async () => {
      const res = await api.get('/properties/my');
      // Ensure id property exists for frontend components
      return res.data.map((p: any) => ({
        ...p,
        id: p._id || p.id,
        facing: p.facing ?? p.propertyFacing
      }));
    }
  });
}

// Users Management (Admin)
export function useGetAllUsers() {
  return useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const res = await api.get('/users');
      // Format to match what components expect: [principal, profile][]
      // MERN backend returns array of user objects
      return res.data.map((user: any) => [
        { 
          toText: () => user._id || user.id,
          toString: () => user._id || user.id 
        }, // Mock Principal
        {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          tamilRole: user.tamilRole,
          approved: user.approved,
          role: user.tamilRole // Alias for components using role
        }
      ]);
    }
  });
}

export function useListApprovals() {
  return useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const res = await api.get('/users');
      // Filter for users needing approval
      // And format as expected by PendingApprovalScreen/SuperAdminDashboard
      // The dashboard expects { principal: Principal, profile: UserProfile, status: { __kind__: 'pending' } }
      
      const pendingUsers = res.data.filter((u: any) => !u.approved);
      
      return pendingUsers.map((user: any) => ({
        principal: { 
          toText: () => user._id || user.id,
          toString: () => user._id || user.id
        },
        profile: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          tamilRole: user.tamilRole,
        },
        status: { __kind__: 'pending' }
      }));
    }
  });
}

export function useSetApproval() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ user, status }: { user: any, status: string }) => {
      // Extract ID from mock Principal if needed, or assume it's passed as ID
      const userId = user.toText ? user.toText() : user;
      
      if (status === 'approved') {
        const res = await api.put(`/users/${userId}/approve`);
        return res.data;
      } else {
        // Handle rejection (maybe delete user or mark as rejected)
        // For now, let's assume rejection isn't implemented fully on backend yet or just deletes
        // We'll just return null
        return null; 
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    }
  });
}

// Request Hooks

export const useCreateRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { propertyId: string; type: 'rent' | 'buy'; message?: string }) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/requests`, data, {
        headers: { 'x-auth-token': token },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-requests'] });
    },
  });
};

export const useGetOwnerRequests = () => {
  return useQuery({
    queryKey: ['owner-requests'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get<PropertyRequest[]>(`${API_URL}/requests/owner`, {
        headers: { 'x-auth-token': token },
      });
      return response.data;
    },
  });
};

export const useGetTenantRequests = () => {
  return useQuery({
    queryKey: ['tenant-requests'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get<PropertyRequest[]>(`${API_URL}/requests/tenant`, {
        headers: { 'x-auth-token': token },
      });
      return response.data;
    },
  });
};

export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/requests/${requestId}/approve`, {}, {
        headers: { 'x-auth-token': token },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
    },
  });
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/requests/${requestId}/reject`, {}, {
        headers: { 'x-auth-token': token },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-requests'] });
    },
  });
};

// Vacate Request Hooks

export const useCreateVacateRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { propertyId: string; reason: string; requestedVacateDate: string }) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/vacate-request`, data, {
        headers: { 'x-auth-token': token },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vacate-requests'] });
    },
  });
};

export const useGetMyVacateRequests = () => {
  return useQuery({
    queryKey: ['my-vacate-requests'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/vacate-request/my`, {
        headers: { 'x-auth-token': token },
      });
      return response.data as any[];
    },
  });
};

export const useCancelVacateRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/vacate-request/${id}`, {
        headers: { 'x-auth-token': token },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vacate-requests'] });
    },
  });
};

export const useGetVacateRequestsForProperty = (propertyId: string | null) => {
  return useQuery({
    queryKey: ['vacate-requests-property', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/vacate-request/property/${propertyId}`, {
        headers: { 'x-auth-token': token },
      });
      return response.data as any[];
    },
  });
};

export const useApproveVacateRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/vacate-request/${id}/approve`, {}, {
        headers: { 'x-auth-token': token },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacate-requests-property'] });
      queryClient.invalidateQueries({ queryKey: ['myProperties'] });
      queryClient.invalidateQueries({ queryKey: ['agreements-owner'] });
    },
  });
};

export const useRejectVacateRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/vacate-request/${id}/reject`, {}, {
        headers: { 'x-auth-token': token },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacate-requests-property'] });
    },
  });
};

export const useCompleteVacateRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/vacate-request/${id}/complete`, {}, {
        headers: { 'x-auth-token': token },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacate-requests-property'] });
      queryClient.invalidateQueries({ queryKey: ['myProperties'] });
      queryClient.invalidateQueries({ queryKey: ['agreements-owner'] });
      queryClient.invalidateQueries({ queryKey: ['agreements-tenant'] });
    },
  });
};

// Rent History Queries
export function useGetOwnerRentHistory() {
  return useQuery({
    queryKey: ['ownerRentHistory'],
    queryFn: async () => {
      const res = await api.get('/payments/owner/rent-history');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGetTenantRentHistory() {
  return useQuery({
    queryKey: ['tenantRentHistory'],
    queryFn: async () => {
      const res = await api.get('/payments/tenant/rent-history');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
