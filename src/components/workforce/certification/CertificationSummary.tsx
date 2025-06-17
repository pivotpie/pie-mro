
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export const CertificationSummary = () => {
  const [stats, setStats] = useState({
    valid: 0,
    expiringSoon: 0,
    expired: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificationStats = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('certifications')
          .select('*');
        
        if (error) {
          throw error;
        }

        // Process certifications to get stats
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const valid = data.filter(cert => new Date(cert.expiry_date) > thirtyDaysFromNow).length;
        const expiringSoon = data.filter(cert => {
          const expiryDate = new Date(cert.expiry_date);
          return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
        }).length;
        const expired = data.filter(cert => new Date(cert.expiry_date) < now).length;
        
        setStats({
          valid,
          expiringSoon,
          expired,
          total: data.length
        });
      } catch (error: any) {
        toast.error(`Error loading certification stats: ${error.message}`);
        console.error("Error fetching certification stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificationStats();
  }, []);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="mb-6">
          <div className="relative w-full h-40 flex items-center justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            ) : (
              <>
                <div className="relative w-40 h-50">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="12"
                    />
                    {stats.total > 0 && (
                      <>
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="12"
                          strokeDasharray="251.3"
                          strokeDashoffset={251.3 * (1 - stats.expired / stats.total)}
                          transform="rotate(-90 50 50)"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="12"
                          strokeDasharray="251.3"
                          strokeDashoffset={251.3 * (1 - (stats.expired + stats.expiringSoon) / stats.total)}
                          transform="rotate(-90 50 50)"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="12"
                          strokeDasharray="251.3"
                          strokeDashoffset={251.3 * (1 - (stats.expired + stats.expiringSoon + stats.valid) / stats.total)}
                          transform="rotate(-90 50 50)"
                        />
                      </>
                    )}
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-6">
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Valid ({stats.valid})</span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-orange-500 mr-2"></span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Expiring soon ({stats.expiringSoon})</span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Expired ({stats.expired})</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
