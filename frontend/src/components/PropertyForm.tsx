import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddProperty, useUpdateProperty } from '../hooks/useQueries';
import { PropertyStatus, ExternalBlob, Property } from '../types';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import ImageUploadSection from './ImageUploadSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Images } from 'lucide-react';

interface PropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Property | null;
}

export default function PropertyForm({ open, onOpenChange, initialData }: PropertyFormProps) {
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [facing, setFacing] = useState('');
  const [images, setImages] = useState<(ExternalBlob | string)[]>([]);
  const [currentTab, setCurrentTab] = useState('details');
  const { t } = useLanguage();
  
  const addPropertyMutation = useAddProperty();
  const updatePropertyMutation = useUpdateProperty();

  useEffect(() => {
    if (open && initialData) {
      setTitle(initialData.title || '');
      setPropertyType(initialData.propertyType || '');
      setLocation(initialData.location || '');
      setPrice(initialData.price?.toString() || '');
      setTransactionType(initialData.transactionType || '');
      setTotalArea(initialData.totalArea?.toString() || '');
      setBedrooms(initialData.bedrooms?.toString() || '');
      setFacing(initialData.facing || '');
      setImages(initialData.images || []);
    } else if (open && !initialData) {
      // Reset form for new entry
      setTitle('');
      setPropertyType('');
      setLocation('');
      setPrice('');
      setTransactionType('');
      setTotalArea('');
      setBedrooms('');
      setFacing('');
      setImages([]);
      setCurrentTab('details');
    }
  }, [open, initialData]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !propertyType || !location.trim() || !price || !transactionType || !totalArea || !bedrooms || !facing) {
      toast.error(t('Please fill all required fields', 'அனைத்து அவசியமான புலங்களையும் நிரப்பவும்'));
      return;
    }

    if (images.length === 0) {
      toast.error(
        t(
          'Please upload at least one image',
          'குறைந்தது ஒரு படத்தையாவது பதிவேற்றவும்'
        )
      );
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error(t('Please enter a valid price', 'சரியான விலையை உள்ளிடவும்'));
      return;
    }

    const totalAreaNum = parseFloat(totalArea);
    if (isNaN(totalAreaNum) || totalAreaNum <= 0) {
      toast.error(t('Please enter a valid total area', 'சரியான மொத்த பரப்பளவைக் குறிப்பிடவும்'));
      return;
    }

    const bedroomsNum = parseInt(bedrooms, 10);
    if (isNaN(bedroomsNum) || bedroomsNum <= 0) {
      toast.error(t('Please enter a valid number of bedrooms', 'சரியான படுக்கையறை எண்ணிக்கையை உள்ளிடவும்'));
      return;
    }

    try {
      // Separate new blobs and existing strings
      const newImages = images.filter(img => typeof img !== 'string') as ExternalBlob[];
      const existingImages = images.filter(img => typeof img === 'string') as string[];

      // Convert new images to Base64
      const base64NewImages = await Promise.all(newImages.map(img => blobToBase64(img.blob)));
      
      // Combine all images
      const allImages = [...existingImages, ...base64NewImages];

      if (initialData) {
        const propertyId = (initialData as any)._id || initialData.id;
        console.log('[DEBUG] Updating property. ID:', propertyId, 'Full initialData:', initialData);
        
        if (!propertyId) {
          console.error('Property ID is missing');
          toast.error("Property ID is missing");
          return;
        }

        await updatePropertyMutation.mutateAsync({
          id: propertyId,
          data: {
            title: title.trim(),
            propertyType,
            location: location.trim(),
            price: Number(priceNum),
            transactionType: (transactionType as any),
            totalArea: Number(totalAreaNum),
            bedrooms: Number(bedroomsNum),
            facing,
            images: allImages,
          }
        });
        toast.success(t('Property updated successfully!', 'சொத்து வெற்றிகரமாக புதுப்பிக்கப்பட்டது!'));
      } else {
        await addPropertyMutation.mutateAsync({
          title: title.trim(),
          propertyType,
          location: location.trim(),
          price: Number(priceNum), // Send as number
          transactionType: (transactionType as any),
          totalArea: Number(totalAreaNum),
          bedrooms: Number(bedroomsNum),
          facing,
          status: PropertyStatus.pending,
          images: base64NewImages, // For new property, all images are new
          geoLocatedImage: null,
          geoLocation: null,
        });
        toast.success(
          t(
            'Property added successfully! Pending approval.',
            'சொத்து வெற்றிகரமாக சேர்க்கப்பட்டது! அங்கீகாரத்திற்காக காத்திருக்கிறது.'
          )
        );
      }
      
      // Reset form
      setTitle('');
      setPropertyType('');
      setLocation('');
      setPrice('');
      setTransactionType('');
      setTotalArea('');
      setBedrooms('');
      setFacing('');
      setImages([]);
      setCurrentTab('details');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Save property error:', error);
      toast.error(error.message || t('Failed to save property', 'சொத்தை சேமிக்க முடியவில்லை'));
    }
  };

  const handleDialogChange = (open: boolean) => {
    // Reset logic is now in useEffect when opening
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? t('Edit Property', 'சொத்தை திருத்தவும்') : t('Add Property', 'சொத்து சேர்க்கவும்')}</DialogTitle>
          <DialogDescription>
            {t(
              'Fill in the details and upload images to list your property',
              'உங்கள் சொத்தை பட்டியலிட விவரங்களையும் படங்களையும் பதிவேற்றவும்'
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">
              {t('Details', 'விவரங்கள்')}
            </TabsTrigger>
            <TabsTrigger value="images">
              <Images className="w-4 h-4 mr-2" />
              {t('Images', 'படங்கள்')} ({images.length}/20)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                {t('Title', 'தலைப்பு')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder={t('e.g., 3BHK Luxury Apartment', 'எ.கா., 3BHK ஆடம்பர அபார்ட்மெண்ட்')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">
                {t('Property Type', 'சொத்து வகை')} <span className="text-destructive">*</span>
              </Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder={t('Select type', 'வகையை தேர்ந்தெடுக்கவும்')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">{t('Flat', 'பிளாட்')}</SelectItem>
                  <SelectItem value="house">{t('House', 'வீடு')}</SelectItem>
                  <SelectItem value="pg">PG</SelectItem>
                  <SelectItem value="land">{t('Land', 'நிலம்')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">
                {t('Location', 'இடம்')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                placeholder={t('e.g., Chennai, T Nagar', 'எ.கா., சென்னை, டி நகர்')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">
                {t('Price (₹)', 'விலை (₹)')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                placeholder={t('e.g., 8500000', 'எ.கா., 8500000')}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="totalArea">
                {t('Total Area (in sq ft)', 'மொத்த பரப்பளவு (சதுர அடி)')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="totalArea"
                type="number"
                placeholder={t('e.g., 1200', 'எ.கா., 1200')}
                value={totalArea}
                onChange={(e) => setTotalArea(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bedrooms">
                {t('Number of Bedrooms (BHK)', 'படுக்கையறை எண்ணிக்கை (BHK)')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bedrooms"
                type="number"
                placeholder={t('e.g., 2', 'எ.கா., 2')}
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="facing">
                {t('Property Facing', 'சொத்து திசை')} <span className="text-destructive">*</span>
              </Label>
              <Select value={facing} onValueChange={setFacing}>
                <SelectTrigger id="facing">
                  <SelectValue placeholder={t('Select facing', 'திசையைத் தேர்ந்தெடுக்கவும்')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North">{t('North', 'வடக்கு')}</SelectItem>
                  <SelectItem value="South">{t('South', 'தெற்கு')}</SelectItem>
                  <SelectItem value="East">{t('East', 'கிழக்கு')}</SelectItem>
                  <SelectItem value="West">{t('West', 'மேற்கு')}</SelectItem>
                  <SelectItem value="North-East">{t('North-East', 'வடகிழக்கு')}</SelectItem>
                  <SelectItem value="North-West">{t('North-West', 'வடமேற்கு')}</SelectItem>
                  <SelectItem value="South-East">{t('South-East', 'தென்கிழக்கு')}</SelectItem>
                  <SelectItem value="South-West">{t('South-West', 'தென்மேற்கு')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transaction">
                {t('Transaction Type', 'பரிவர்த்தனை வகை')} <span className="text-destructive">*</span>
              </Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger id="transaction">
                  <SelectValue placeholder={t('Select type', 'வகையை தேர்ந்தெடுக்கவும்')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">{t('Rent', 'வாடகை')}</SelectItem>
                  <SelectItem value="purchase">{t('Purchase', 'வாங்க')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => setCurrentTab('images')} 
              variant="outline" 
              className="w-full"
            >
              {t('Next: Upload Images', 'அடுத்தது: படங்களை பதிவேற்றவும்')}
            </Button>
          </TabsContent>

          <TabsContent value="images" className="mt-4">
            <ImageUploadSection images={images} onImagesChange={setImages} />
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => setCurrentTab('details')} 
                variant="outline"
                className="flex-1"
              >
                {t('Back', 'பின்னால்')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => handleDialogChange(false)}>
            {t('Cancel', 'ரத்து செய்')}
          </Button>
          <Button onClick={handleSubmit} disabled={addPropertyMutation.isPending || updatePropertyMutation.isPending}>
            {addPropertyMutation.isPending || updatePropertyMutation.isPending
              ? (initialData ? t('Updating...', 'புதுப்பிக்கிறது...') : t('Adding...', 'சேர்க்கிறது...'))
              : (initialData ? t('Save Changes', 'மாற்றங்களைச் சேமிக்கவும்') : t('Add Property', 'சேர்க்கவும்'))}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
