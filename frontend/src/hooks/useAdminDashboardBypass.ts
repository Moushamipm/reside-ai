import { useState, useEffect } from 'react';

const BYPASS_KEY = 'admin-dashboard-bypass';

export function useAdminDashboardBypass() {
  const [bypassActive, setBypassActive] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem(BYPASS_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(BYPASS_KEY, bypassActive ? 'true' : 'false');
    } catch (error) {
      console.error('Failed to persist bypass state:', error);
    }
  }, [bypassActive]);

  const activateBypass = () => setBypassActive(true);
  const deactivateBypass = () => setBypassActive(false);

  return {
    bypassActive,
    activateBypass,
    deactivateBypass,
  };
}
