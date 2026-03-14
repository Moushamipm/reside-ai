import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

export default function AdminLoginPage({ onLoginSuccess }: AdminLoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error(t('Please enter username', 'பயனர்பெயரை உள்ளிடவும்'));
      return;
    }

    if (!password) {
      toast.error(t('Please enter password', 'கடவுச்சொல்லை உள்ளிடவும்'));
      return;
    }

    setIsLoading(true);

    try {
      // Backend admin login is not yet implemented
      // The admin authentication happens via the caffeineAdminToken in the URL hash
      toast.error(
        t(
          'Admin login via username/password is not yet implemented. Use the bootstrap token URL instead.',
          'பயனர்பெயர்/கடவுச்சொல் மூலம் நிர்வாகி உள்நுழைவு இன்னும் செயல்படுத்தப்படவில்லை. பூட்ஸ்ட்ராப் டோக்கன் URL ஐப் பயன்படுத்தவும்.'
        )
      );
    } catch (error: any) {
      console.error('Admin login error:', error);
      const errorMessage = error.message || t(
        'Login failed. Please try again.',
        'உள்நுழைவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.'
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {t('Admin Login', 'நிர்வாகி உள்நுழைவு')}
          </CardTitle>
          <CardDescription className="text-center">
            {t(
              'Enter your admin credentials to access the dashboard',
              'டாஷ்போர்டை அணுக உங்கள் நிர்வாக சான்றுகளை உள்ளிடவும்'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t(
                'Admin authentication currently requires the bootstrap token in the URL. Username/password login will be available in a future update.',
                'நிர்வாக அங்கீகாரத்திற்கு தற்போது URL இல் பூட்ஸ்ட்ராப் டோக்கன் தேவை. பயனர்பெயர்/கடவுச்சொல் உள்நுழைவு எதிர்கால புதுப்பிப்பில் கிடைக்கும்.'
              )}
            </AlertDescription>
          </Alert>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                {t('Username', 'பயனர்பெயர்')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={t('Enter username', 'பயனர்பெயரை உள்ளிடவும்')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {t('Password', 'கடவுச்சொல்')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('Enter password', 'கடவுச்சொல்லை உள்ளிடவும்')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? t('Hide password', 'கடவுச்சொல்லை மறை') : t('Show password', 'கடவுச்சொல்லைக் காட்டு')}
                  </span>
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full gap-2" 
              disabled={isLoading}
            >
              <Shield className="h-4 w-4" />
              {isLoading 
                ? t('Logging in...', 'உள்நுழைகிறது...') 
                : t('Login as Admin', 'நிர்வாகியாக உள்நுழை')
              }
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              {t(
                'This is a secure admin area. Only authorized personnel should access this page.',
                'இது பாதுகாப்பான நிர்வாக பகுதி. அங்கீகரிக்கப்பட்ட பணியாளர்கள் மட்டுமே இந்த பக்கத்தை அணுக வேண்டும்.'
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
