import { Building2, Moon, Sun, LogIn, LogOut, User, Menu, Shield, X, LayoutDashboard, Home } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HeaderProps {
  onLogout?: () => void;
  onAdminLoginClick?: () => void;
  bypassActive?: boolean;
  onDeactivateBypass?: () => void;
  onDashboardClick?: () => void;
  onHomeClick?: () => void;
  isDashboardActive?: boolean;
  onLoginClick?: () => void;
}

export default function Header({ 
  onLogout, 
  onAdminLoginClick, 
  bypassActive = false, 
  onDeactivateBypass,
  onDashboardClick,
  onHomeClick,
  isDashboardActive = false,
  onLoginClick
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout, isInitializing } = useAuth();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdminUser } = useIsCallerAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const isAuthenticated = !!user;
  const isLoggingIn = isInitializing; // Simplified
  
  // SuperAdmin status is determined by backend isCallerAdmin check OR bypass
  // Backend isCallerAdmin is the source of truth for authorization
  const isSuperAdmin = isAdminUser === true || bypassActive;

  const handleLogout = async () => {
    logout();
    if (onLogout) {
      onLogout();
    }
    setMobileMenuOpen(false);
  };

  const handleAdminLogin = () => {
    if (onAdminLoginClick) {
      onAdminLoginClick();
    }
    setMobileMenuOpen(false);
  };

  const handleExitAdminMode = () => {
    if (onDeactivateBypass) {
      onDeactivateBypass();
    }
    setMobileMenuOpen(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superAdmin':
        return t('Super Admin', 'சூப்பர் நிர்வாகி');
      case 'owners':
      case 'Owner':
        return t('Owner', 'உரிமையாளர்');
      case 'brokersBuilders':
        return t('Broker/Builder', 'தரகர்/கட்டுபவர்');
      case 'customers':
      case 'Tenant':
      case 'Buyer':
        return t('Customer', 'வாடிக்கையாளர்');
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div 
          className="flex items-center gap-2 font-bold text-xl text-primary cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onHomeClick}
        >
          <Building2 className="h-6 w-6" />
          <span>Reside</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder={t('Language', 'மொழி')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ta">தமிழ்</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAuthenticated && !bypassActive && (
            <Button
              variant="default"
              size="sm"
              onClick={onDashboardClick}
              className="hidden lg:flex gap-2"
            >
              {isDashboardActive ? <Home className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
              {isDashboardActive ? t('Back to Home', 'முகப்புக்கு திரும்பவும்') : t('Go to Dashboard', 'டாஷ்போர்டுக்கு செல்லவும்')}
            </Button>
          )}

          {bypassActive ? (
            <Button 
              variant="destructive" 
              onClick={handleExitAdminMode}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t('Exit Admin Mode', 'நிர்வாகி பயன்முறையிலிருந்து வெளியேறு')}
            </Button>
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">
                    {userProfile?.name || user?.name || t('User', 'பயனர்')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {t('My Account', 'என் கணக்கு')}
                  {(userProfile?.role || user?.role) && (
                    <span className="block text-xs font-normal text-muted-foreground">
                      {getRoleLabel(userProfile?.role || user?.role || '')}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDashboardClick}>
                  {isDashboardActive ? <Home className="mr-2 h-4 w-4" /> : <LayoutDashboard className="mr-2 h-4 w-4" />}
                  {isDashboardActive ? t('Back to Home', 'முகப்புக்கு திரும்பவும்') : t('Go to Dashboard', 'டாஷ்போர்டுக்கு செல்லவும்')}
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <DropdownMenuItem onClick={handleAdminLogin}>
                    <Shield className="mr-2 h-4 w-4" />
                    {t('Admin Dashboard', 'நிர்வாகி கட்டுப்பாட்டு அறை')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('Logout', 'வெளியேறு')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                onClick={() => {
                  if (onLoginClick) {
                    onLoginClick();
                  }
                }}
                disabled={isLoggingIn}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {t('Login', 'உள்நுழைய')}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAdminLogin}
                className="text-muted-foreground text-xs"
              >
                {t('Admin', 'நிர்வாகி')}
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{t('Menu', 'பட்டியல்')}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <div className="flex items-center justify-between">
                  <span>{t('Theme', 'தீம்')}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span>{t('Language', 'மொழி')}</span>
                  <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder={t('Language', 'மொழி')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ta">தமிழ்</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bypassActive ? (
                  <Button 
                    variant="destructive" 
                    onClick={handleExitAdminMode}
                    className="w-full gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('Exit Admin Mode', 'நிர்வாகி பயன்முறையிலிருந்து வெளியேறு')}
                  </Button>
                ) : isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md">
                      <User className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{userProfile?.name || user?.name || 'User'}</span>
                        {(userProfile?.role || user?.role) && (
                          <span className="text-xs text-muted-foreground">
                            {getRoleLabel(userProfile?.role || user?.role || '')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="default" onClick={onDashboardClick} className="w-full justify-start">
                      {isDashboardActive ? <Home className="mr-2 h-4 w-4" /> : <LayoutDashboard className="mr-2 h-4 w-4" />}
                      {isDashboardActive ? t('Back to Home', 'முகப்புக்கு திரும்பவும்') : t('Go to Dashboard', 'டாஷ்போர்டுக்கு செல்லவும்')}
                    </Button>
                    {isSuperAdmin && (
                      <Button variant="outline" onClick={handleAdminLogin} className="w-full justify-start">
                        <Shield className="mr-2 h-4 w-4" />
                        {t('Admin Dashboard', 'நிர்வாகி கட்டுப்பாட்டு அறை')}
                      </Button>
                    )}
                    <Button variant="destructive" onClick={handleLogout} className="w-full justify-start">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('Logout', 'வெளியேறு')}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        if (onLoginClick) {
                          onLoginClick();
                        }
                        setMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      {t('Login', 'உள்நுழைய')}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={handleAdminLogin}
                      className="w-full text-muted-foreground"
                    >
                      {t('Admin Access', 'நிர்வாகி அணுகல்')}
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
