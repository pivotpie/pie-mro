
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <div className="flex gap-4 items-center">
            <span className="font-medium">
              {user.employee ? `${user.employee.name} (${user.employee.e_number})` : user.username}
            </span>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Overview</CardTitle>
              <CardDescription>Current team statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Active Personnel:</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between">
                  <span>On Leave:</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span>Training Required:</span>
                  <span className="font-medium text-amber-600">5</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <CardDescription>Team certification status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Current:</span>
                  <span className="font-medium">18</span>
                </div>
                <div className="flex justify-between">
                  <span>Expiring Soon:</span>
                  <span className="font-medium text-amber-600">3</span>
                </div>
                <div className="flex justify-between">
                  <span>Expired:</span>
                  <span className="font-medium text-red-600">1</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roster Status</CardTitle>
              <CardDescription>Today's schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Day Shift:</span>
                  <span className="font-medium">12/12</span>
                </div>
                <div className="flex justify-between">
                  <span>Night Shift:</span>
                  <span className="font-medium text-amber-600">9/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Available for Call:</span>
                  <span className="font-medium">3</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Maintenance Visits</CardTitle>
              <CardDescription>Active maintenance visits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                <div className="py-3">
                  <p className="font-medium">A7-BAC (777-300ER)</p>
                  <p className="text-sm text-gray-500">C-Check, Hangar 2, Due: May 25</p>
                </div>
                <div className="py-3">
                  <p className="font-medium">A7-BEF (787-9)</p>
                  <p className="text-sm text-gray-500">A-Check, Hangar 1, Due: May 22</p>
                </div>
                <div className="py-3">
                  <p className="font-medium">A7-BCG (777-200LR)</p>
                  <p className="text-sm text-gray-500">D-Check, Hangar 3, Due: June 10</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Alerts</CardTitle>
              <CardDescription>Important notices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                <div className="py-3">
                  <p className="font-medium text-amber-600">Training Deadline</p>
                  <p className="text-sm">5 team members need recurrent training by June 1</p>
                </div>
                <div className="py-3">
                  <p className="font-medium text-red-600">Certification Alert</p>
                  <p className="text-sm">1 expired certification needs immediate action</p>
                </div>
                <div className="py-3">
                  <p className="font-medium text-blue-600">Roster Update</p>
                  <p className="text-sm">June schedule published, review by May 25</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 text-right">
          <Button 
            variant="default" 
            onClick={() => navigate('/admin-workforce')}
            className="bg-slate-800 hover:bg-slate-700"
          >
            Go to Workforce Management
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
