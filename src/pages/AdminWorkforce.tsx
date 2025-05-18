
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";

const AdminWorkforce = () => {
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
          <h1 className="text-3xl font-bold">Workforce Management</h1>
          <div className="flex gap-4 items-center">
            <span className="font-medium">
              {user.employee ? `${user.employee.name} (${user.employee.e_number})` : user.username}
            </span>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">243</p>
              <p className="text-sm text-gray-500">+5 this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">18</p>
              <p className="text-sm text-gray-500">3 need attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Training Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">94%</p>
              <p className="text-sm text-gray-500">2% below target</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Certification Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">97%</p>
              <p className="text-sm text-gray-500">On target</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Personnel Requirements</CardTitle>
              <CardDescription>Upcoming maintenance visit staffing needs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visit</TableHead>
                    <TableHead>Aircraft</TableHead>
                    <TableHead>Hangar</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Required Staff</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>A32-C0522</TableCell>
                    <TableCell>A7-BAC</TableCell>
                    <TableCell>H2</TableCell>
                    <TableCell>May 20, 2025</TableCell>
                    <TableCell>May 25, 2025</TableCell>
                    <TableCell className="text-right">18</TableCell>
                    <TableCell className="text-right">16</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>B78-A0525</TableCell>
                    <TableCell>A7-BEF</TableCell>
                    <TableCell>H1</TableCell>
                    <TableCell>May 22, 2025</TableCell>
                    <TableCell>May 24, 2025</TableCell>
                    <TableCell className="text-right">12</TableCell>
                    <TableCell className="text-right">12</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>B77-D0601</TableCell>
                    <TableCell>A7-BCG</TableCell>
                    <TableCell>H3</TableCell>
                    <TableCell>June 1, 2025</TableCell>
                    <TableCell>June 10, 2025</TableCell>
                    <TableCell className="text-right">24</TableCell>
                    <TableCell className="text-right">18</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Allocation</CardTitle>
              <CardDescription>Staff distribution by skill area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Avionics</span>
                    <span>32 / 35</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '91%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Airframe</span>
                    <span>45 / 50</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '90%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Engines</span>
                    <span>28 / 35</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '80%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Cabin Systems</span>
                    <span>18 / 25</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '72%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Line Maintenance</span>
                    <span>40 / 40</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Training Schedule</CardTitle>
              <CardDescription>Upcoming training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                <div className="py-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">Boeing 777 Recurrent Training</p>
                      <p className="text-sm text-gray-500">May 24-26, 2025</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">12 attendees</p>
                      <p className="text-sm text-gray-500">Room 302</p>
                    </div>
                  </div>
                </div>
                <div className="py-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">Airbus A350 Type Rating</p>
                      <p className="text-sm text-gray-500">June 1-10, 2025</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">8 attendees</p>
                      <p className="text-sm text-gray-500">Simulator Hall</p>
                    </div>
                  </div>
                </div>
                <div className="py-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">Safety Management System</p>
                      <p className="text-sm text-gray-500">June 15, 2025</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">All Staff</p>
                      <p className="text-sm text-gray-500">Auditorium</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 text-right">
          <Button 
            variant="default" 
            onClick={() => navigate('/manager-dashboard')}
            className="bg-slate-800 hover:bg-slate-700"
          >
            Go to Manager Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkforce;
