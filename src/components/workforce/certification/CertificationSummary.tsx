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

  // Calculate percentages and cumulative offsets for proper donut chart rendering
  const getChartData = () => {
    if (stats.total === 0) return { segments: [], circumference: 0 };
    
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate percentages
    const expiredPercentage = stats.expired / stats.total;
    const expiringSoonPercentage = stats.expiringSoon / stats.total;
    const validPercentage = stats.valid / stats.total;
    
    // Calculate stroke-dasharray (segment length) and stroke-dashoffset (starting position)
    const expiredLength = circumference * expiredPercentage;
    const expiringSoonLength = circumference * expiringSoonPercentage;
    const validLength = circumference * validPercentage;
    
    // Calculate cumulative offsets - each segment starts where the previous one ended
    const expiredOffset = 0;
    const expiringSoonOffset = circumference - expiredLength;
    const validOffset = circumference - expiredLength - expiringSoonLength;
    
    return {
      segments: [
        {
          color: '#ef4444', // red for expired
          length: expiredLength,
          offset: expiredOffset,
          count: stats.expired
        },
        {
          color: '#f97316', // orange for expiring soon
          length: expiringSoonLength,
          offset: expiringSoonOffset,
          count: stats.expiringSoon
        },
        {
          color: '#22c55e', // green for valid
          length: validLength,
          offset: validOffset,
          count: stats.valid
        }
      ],
      circumference
    };
  };

  const chartData = getChartData();

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="mb-6">
          <div className="relative w-full h-48 flex flex-col items-center justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            ) : (
              <>
                <div className="relative w-40 h-40 mb-6">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="12"
                    />
                    
                    {/* Data segments - only render if we have data */}
                    {stats.total > 0 && chartData.segments.map((segment, index) => (
                      segment.count > 0 && (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={segment.color}
                          strokeWidth="12"
                          strokeDasharray={`${segment.length} ${chartData.circumference}`}
                          strokeDashoffset={segment.offset}
                          transform="rotate(-90 50 50)"
                          strokeLinecap="round"
                        />
                      )
                    ))}
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex justify-center space-x-6">
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
