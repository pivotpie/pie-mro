
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-xl">
        <h1 className="text-4xl font-bold mb-6">MRO Workforce Management</h1>
        <p className="text-xl text-gray-600 mb-8">
          Streamline your aviation maintenance operations with our comprehensive workforce management solution.
        </p>
        <div className="space-y-4">
          <Link to="/auth">
            <Button size="lg" className="w-full">Login to Dashboard</Button>
          </Link>
        </div>
        <div className="mt-8 text-gray-500">
          <p>Manage certifications, training, and schedules all in one place.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
