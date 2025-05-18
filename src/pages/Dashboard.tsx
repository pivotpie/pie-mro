
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
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
          <h1 className="text-3xl font-bold">MRO Workforce Management</h1>
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
              <CardTitle>Employee Info</CardTitle>
              <CardDescription>Your employee information</CardDescription>
            </CardHeader>
            <CardContent>
              {user.employee ? (
                <div className="space-y-2">
                  <div><span className="font-medium">Name:</span> {user.employee.name}</div>
                  <div><span className="font-medium">Employee #:</span> {user.employee.e_number}</div>
                  <div><span className="font-medium">Status:</span> {user.employee.employee_status || 'Active'}</div>
                  {user.employee.mobile_number && (
                    <div><span className="font-medium">Mobile:</span> {user.employee.mobile_number}</div>
                  )}
                </div>
              ) : (
                <div>No employee information available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <CardDescription>Your current certifications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 italic">Certification data will be displayed here</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Training</CardTitle>
              <CardDescription>Upcoming training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 italic">Training data will be displayed here</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Roster Schedule</CardTitle>
            <CardDescription>Your current work schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 italic">Roster data will be displayed here</p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          {(user.username === 'admin' || user.username === 'manager') && (
            <>
              <Button 
                variant="default" 
                onClick={() => navigate('/manager-dashboard')}
                className="bg-slate-800 hover:bg-slate-700"
              >
                Manager Dashboard
              </Button>
              <Button 
                variant="default" 
                onClick={() => navigate('/admin-workforce')}
                className="bg-blue-700 hover:bg-blue-800"
              >
                Workforce Management
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
