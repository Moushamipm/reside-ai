import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, AlertCircle, Clock, FileText, Wrench, CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { generateReceipt } from '../utils/receiptGenerator';
import { toast } from 'sonner';
import {
  useCreateVacateRequest,
  useGetMyVacateRequests,
  useCancelVacateRequest,
} from '../hooks/useQueries';

interface RentalDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreement: any;
  rentRecords: any[];
  onPayClick: (record: any) => void;
  onViewAgreement: () => void;
}

export default function RentalDetailsDialog({
  open,
  onOpenChange,
  agreement,
  rentRecords,
  onPayClick,
  onViewAgreement,
}: RentalDetailsDialogProps) {
  const { t } = useLanguage();
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [newIssue, setNewIssue] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [documents, setDocuments] = useState<any[]>(agreement?.documents || []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [vacateReason, setVacateReason] = useState('');
  const [vacateDate, setVacateDate] = useState('');

  const { data: myVacateRequests = [], isLoading: vacateLoading } = useGetMyVacateRequests();
  const createVacateRequest = useCreateVacateRequest();
  const cancelVacateRequest = useCancelVacateRequest();

  // Fetch maintenance requests
  useEffect(() => {
    const fetchMaintenanceRequests = async () => {
      if (!agreement?.property?._id && !agreement?.property?.id) return;
      const propertyId = agreement.property._id || agreement.property.id;
      const token = localStorage.getItem('token');
      
      try {
        const res = await axios.get(
          `http://localhost:5000/api/requests/property/${propertyId}/maintenance`,
          { headers: { 'x-auth-token': token } }
        );
        setMaintenanceRequests(res.data);
      } catch (err) {
        console.error('Error fetching maintenance requests:', err);
      }
    };

    if (open && agreement) {
      fetchMaintenanceRequests();
      setDocuments(agreement.documents || []);
    }
  }, [open, agreement]);

  if (!agreement) return null;

  const propertyId = agreement.property?._id || agreement.property?.id;
  const vacateRequestsForThisProperty = myVacateRequests.filter((r: any) => {
    const rProp = r.property?._id || r.property?.id || r.property;
    return propertyId && rProp && String(rProp) === String(propertyId);
  });
  const latestVacateRequest = vacateRequestsForThisProperty[0];

  const handleCreateVacate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) {
      toast.error(t('Property information missing', 'சொத்து தகவல் இல்லை'));
      return;
    }
    if (!vacateDate || !vacateReason.trim()) {
      toast.error(
        t('Please provide vacate date and reason', 'வெளியேறும் தேதி மற்றும் காரணத்தை நிரப்பவும்')
      );
      return;
    }
    try {
      await createVacateRequest.mutateAsync({
        propertyId,
        reason: vacateReason.trim(),
        requestedVacateDate: vacateDate,
      });
      setVacateReason('');
      setVacateDate('');
      toast.success(
        t('Vacate request submitted successfully', 'வெளியேறும் கோரிக்கை வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது')
      );
    } catch (err: any) {
      console.error('Error creating vacate request:', err);
      const msg =
        err?.response?.data?.msg ||
        t('Failed to submit vacate request', 'வெளியேறும் கோரிக்கையை சமர்ப்பிக்க முடியவில்லை');
      toast.error(msg);
    }
  };

  const handleCancelVacate = async () => {
    if (!latestVacateRequest?._id && !latestVacateRequest?.id) return;
    const id = latestVacateRequest._id || latestVacateRequest.id;
    try {
      await cancelVacateRequest.mutateAsync(id);
      toast.success(
        t('Vacate request cancelled', 'வெளியேறும் கோரிக்கை ரத்து செய்யப்பட்டது')
      );
    } catch (err: any) {
      console.error('Error cancelling vacate request:', err);
      const msg =
        err?.response?.data?.msg ||
        t('Failed to cancel vacate request', 'வெளியேறும் கோரிக்கையை ரத்து செய்ய முடியவில்லை');
      toast.error(msg);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    setSelectedFile(file || null);
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      toast.error(t('Please choose a file to upload', 'பதிவேற்ற ஒரு கோப்பைத் தேர்ந்தெடுக்கவும்'));
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const agreementId = agreement._id || agreement.id;
      if (!agreementId) {
        toast.error(t('Agreement ID is missing', 'ஒப்பந்த ஐடி இல்லை'));
        setUploading(false);
        return;
      }
      const reader = new FileReader();

      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(selectedFile);
      });

      const res = await axios.put(
        `http://localhost:5000/api/agreements/${agreementId}/documents`,
        {
          name: selectedFile.name,
          data: dataUrl
        },
        { headers: { 'x-auth-token': token } }
      );

      setDocuments(res.data.documents || []);
      setSelectedFile(null);
      toast.success(t('Document uploaded successfully', 'ஆவணம் வெற்றிகரமாக பதிவேற்றப்பட்டது'));
    } catch (err: any) {
      console.error('Error uploading document:', err);
      const msg =
        err?.response?.data?.msg ||
        err?.message ||
        t('Failed to upload document', 'ஆவணம் பதிவேற்றப்படவில்லை');
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = (doc: any) => {
    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssue || !newDescription) {
        toast.error(t('Please fill all fields', 'அனைத்து புலங்களையும் நிரப்பவும்'));
        return;
    }

    try {
      const token = localStorage.getItem('token');
      const propertyId = agreement.property._id || agreement.property.id;

      const res = await axios.post(
        'http://localhost:5000/api/requests/maintenance',
        {
          propertyId,
          issue: newIssue,
          description: newDescription
        },
        { headers: { 'x-auth-token': token } }
      );

      setMaintenanceRequests([res.data, ...maintenanceRequests]);
      setNewIssue('');
      setNewDescription('');
      toast.success(t('Maintenance request submitted', 'பராமரிப்பு கோரிக்கை சமர்ப்பிக்கப்பட்டது'));
    } catch (err) {
      console.error('Error submitting maintenance request:', err);
      toast.error(t('Failed to submit request', 'கோரிக்கையை சமர்ப்பிக்க முடியவில்லை'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agreement.property?.title || t('Property Details', 'சொத்து விவரங்கள்')}</DialogTitle>
          <DialogDescription>
            {agreement.property?.location} • {t('Owner:', 'உரிமையாளர்:')} {agreement.owner?.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="payments" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payments">
              <CreditCard className="mr-2 h-4 w-4" />
              {t('Payments', 'கட்டணங்கள்')}
            </TabsTrigger>
            <TabsTrigger value="agreements">
              <FileText className="mr-2 h-4 w-4" />
              {t('Agreements', 'ஒப்பந்தங்கள்')}
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="mr-2 h-4 w-4" />
              {t('Maintenance', 'பராமரிப்பு')}
            </TabsTrigger>
            <TabsTrigger value="vacate">
              <AlertCircle className="mr-2 h-4 w-4" />
              {t('Vacate', 'வெளியேறு')}
            </TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('Payment History', 'கட்டண வரலாறு')}</CardTitle>
                <CardDescription>
                  {t('Track your rent payments and dues', 'உங்கள் வாடகை கட்டணங்கள் மற்றும் நிலுவைகளை கண்காணிக்கவும்')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rentRecords.length > 0 ? (
                    rentRecords.map((record) => (
                      <div key={record._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              record.status === 'paid'
                                ? 'bg-green-100 text-green-600'
                                : record.status === 'pending'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-orange-100 text-orange-600'
                            }`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {new Date(record.month).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t('Due:', 'கெடு:')} {new Date(record.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{record.rentAmount.toLocaleString()}</p>
                          <p
                            className={`text-xs ${
                              record.status === 'paid'
                                ? 'text-green-600'
                                : record.status === 'pending'
                                ? 'text-gray-600'
                                : 'text-orange-600'
                            }`}
                          >
                            {record.status.toUpperCase()}
                          </p>
                          {record.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 h-7 text-xs"
                              onClick={() => onPayClick(record)}
                            >
                              {t('Pay Now', 'இப்போது செலுத்தவும்')}
                            </Button>
                          )}
                          {record.status === 'paid' && record.balance === 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-1 h-7 text-xs"
                              onClick={() => {
                                const payment =
                                  record.payments &&
                                  [...record.payments].reverse().find((p) => p.status === 'approved');
                                const mockPayment = payment || {
                                  amount: record.rentAmount,
                                  date: record.month,
                                  mode: 'Paid',
                                  receiptNumber: 'REC-' + record._id.slice(-6).toUpperCase(),
                                };
                                generateReceipt(mockPayment, record);
                              }}
                            >
                              {t('Download Receipt', 'ரசீது பதிவிறக்கவும்')}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('No payment records found.', 'கட்டண பதிவுகள் எதுவும் இல்லை.')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agreements Tab */}
          <TabsContent value="agreements" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('Rental Agreement Details', 'வாடகை ஒப்பந்த விவரங்கள்')}</CardTitle>
                <Button variant="outline" size="sm" onClick={onViewAgreement}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('View Full Agreement', 'முழு ஒப்பந்தத்தைக் காண்க')}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('Start Date', 'தொடக்க தேதி')}</p>
                    <p>{new Date(agreement.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('End Date', 'முடிவு தேதி')}</p>
                    <p>{new Date(agreement.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('Monthly Rent', 'மாதாந்திர வாடகை')}</p>
                    <p>₹{agreement.rentAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('Security Deposit', 'பாதுகாப்பு வைப்பு')}</p>
                    <p>₹{agreement.depositAmount?.toLocaleString()}</p>
                  </div>
                   <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('Status', 'நிலை')}</p>
                    <Badge variant={agreement.status === 'active' ? 'default' : 'secondary'}>
                      {agreement.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {agreement.terms && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {t('Terms & Conditions', 'விதிமுறைகள் மற்றும் நிபந்தனைகள்')}
                      </p>
                      <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                        {agreement.terms}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {t('Agreement Documents', 'ஒப்பந்த ஆவணங்கள்')}
                      </p>
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          <Input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={handleFileChange}
                            className="sm:w-64"
                          />
                          <Button
                            type="button"
                            onClick={handleUploadDocument}
                            disabled={uploading}
                          >
                            {uploading
                              ? t('Uploading...', 'பதிவேற்றுகிறது...')
                              : t('Upload Document', 'ஆவணத்தை பதிவேற்றவும்')}
                          </Button>
                        </div>
                        {documents && documents.length > 0 && (
                          <div className="border rounded-md divide-y">
                            {documents.map((doc, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between px-3 py-2 text-sm"
                              >
                                <span className="truncate max-w-[60%]">{doc.name}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadDocument(doc)}
                                >
                                  {t('Download', 'பதிவிறக்கவும்')}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4 mt-4">
             <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('New Request', 'புதிய கோரிக்கை')}</CardTitle>
                  <CardDescription>{t('Submit a new maintenance issue', 'புதிய பராமரிப்பு சிக்கலைச் சமர்ப்பிக்கவும்')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitMaintenance} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="issue">{t('Issue Type', 'சிக்கல் வகை')}</Label>
                      <Input 
                        id="issue" 
                        placeholder="e.g. Plumbing, Electrical" 
                        value={newIssue}
                        onChange={(e) => setNewIssue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">{t('Description', 'விளக்கம்')}</Label>
                      <Textarea 
                        id="description" 
                        placeholder={t('Describe the issue...', 'சிக்கலை விவரிக்கவும்...')} 
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                      />
                    </div>
                    <Button type="submit">{t('Submit Request', 'கோரிக்கையை சமர்ப்பிக்கவும்')}</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('Recent Requests', 'சமீபத்திய கோரிக்கைகள்')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {maintenanceRequests.length > 0 ? (
                      maintenanceRequests.map((req) => (
                        <div key={req._id || req.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">{req.issue}</p>
                            {(req.category || req.priority) && (
                              <div className="flex gap-2 flex-wrap mt-1">
                                {req.category && (
                                  <Badge variant="outline" className="bg-background/80">
                                    {req.category}
                                  </Badge>
                                )}
                                {req.priority && (
                                  <Badge
                                    variant="secondary"
                                    className={
                                      req.priority === 'High'
                                        ? 'bg-red-100 text-red-800'
                                        : req.priority === 'Medium'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-green-100 text-green-800'
                                    }
                                  >
                                    {req.priority}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <p className="text-sm text-muted-foreground">
                                {new Date(req.createdAt || req.date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{req.description}</p>
                          </div>
                          <div className={`text-sm px-2 py-1 rounded-full ${
                            req.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            req.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {req.status === 'in-progress' ? 'In Progress' : 
                             req.status === 'completed' ? 'Completed' : 
                             req.status === 'pending' ? 'Pending' : req.status}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t('No maintenance requests found.', 'பராமரிப்பு கோரிக்கைகள் எதுவும் இல்லை.')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vacate Tab */}
          <TabsContent value="vacate" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  {t('Vacate Request', 'வெளியேறும் கோரிக்கை')}
                </CardTitle>
                <CardDescription>
                  {t(
                    'Request to vacate this property and track approval status',
                    'இந்த சொத்திலிருந்து வெளியேறும் கோரிக்கையை சமர்ப்பித்து அங்கீகார நிலையைப் பின்தொடரவும்'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Agreement Status', 'ஒப்பந்த நிலை')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        agreement.status === 'active'
                          ? 'default'
                          : agreement.status === 'notice_period'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {agreement.status?.toUpperCase()}
                    </Badge>
                    {agreement.status === 'notice_period' && agreement.vacateDate && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t('Vacating on', 'வெளியேறும் தேதி')}{' '}
                        {new Date(agreement.vacateDate).toLocaleDateString()}
                      </span>
                    )}
                    {agreement.status === 'closed' && (
                      <span className="text-xs text-muted-foreground">
                        {t('Agreement closed', 'ஒப்பந்தம் முடிவடைந்தது')}
                      </span>
                    )}
                  </div>
                </div>

                {vacateLoading ? (
                  <p className="text-sm text-muted-foreground">
                    {t('Loading vacate requests...', 'வெளியேறும் கோரிக்கைகளை ஏற்றுகிறது...')}
                  </p>
                ) : vacateRequestsForThisProperty.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('Your recent requests', 'உங்கள் சமீபத்திய கோரிக்கைகள்')}
                    </p>
                    <div className="space-y-2">
                      {vacateRequestsForThisProperty.map((r: any) => (
                        <div
                          key={r._id || r.id}
                          className="border rounded-md px-3 py-2 text-sm flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {new Date(r.requestedVacateDate).toLocaleDateString()}
                            </span>
                            <Badge
                              variant={
                                r.status === 'pending'
                                  ? 'outline'
                                  : r.status === 'approved'
                                  ? 'default'
                                  : r.status === 'completed'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {r.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{r.reason}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {t('Requested on', 'கோரிக்கப்பட்ட தேதி')}{' '}
                            {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                          {r.status === 'pending' && r._id === latestVacateRequest?._id && (
                            <div className="mt-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleCancelVacate}
                              >
                                {t('Cancel Request', 'கோரிக்கையை ரத்து செய்யவும்')}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('No vacate requests submitted for this property yet.', 'இந்த சொத்திற்கான வெளியேறும் கோரிக்கைகள் எதுவும் இல்லை.')}
                  </p>
                )}

                {agreement.status === 'active' && (!latestVacateRequest || latestVacateRequest.status !== 'pending') && (
                  <form onSubmit={handleCreateVacate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="vacateDate">
                        {t('Requested Vacate Date', 'வெளியேறும் தேதி')}
                      </Label>
                      <Input
                        id="vacateDate"
                        type="date"
                        value={vacateDate}
                        onChange={(e) => setVacateDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vacateReason">
                        {t('Reason for vacating', 'வெளியேறும் காரணம்')}
                      </Label>
                      <Textarea
                        id="vacateReason"
                        value={vacateReason}
                        onChange={(e) => setVacateReason(e.target.value)}
                        placeholder={t('Explain why you want to vacate...', 'நீங்கள் ஏன் வெளியேற விரும்புகிறீர்கள் என்பதை விளக்கவும்...')}
                      />
                    </div>
                    <Button type="submit">
                      {t('Submit Vacate Request', 'வெளியேறும் கோரிக்கையை சமர்ப்பிக்கவும்')}
                    </Button>
                  </form>
                )}

                {agreement.status !== 'active' && (
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'New vacate requests can only be raised for active agreements.',
                      'செயலில் உள்ள ஒப்பந்தங்களுக்கு மட்டுமே புதிய வெளியேறும் கோரிக்கைகளை சமர்ப்பிக்கலாம்.'
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
