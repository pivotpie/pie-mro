
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, Search, Plus, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CertificationSummary } from "../certification/CertificationSummary";
import { CertificationTable } from "../certification/CertificationTable";
import { useState } from "react";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

export const CertificationView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Certification Status</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Add Certification
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search certifications..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Aircraft">Aircraft</SelectItem>
            <SelectItem value="Engine">Engine</SelectItem>
            <SelectItem value="Cabin">Cabin</SelectItem>
            <SelectItem value="Avionics">Avionics</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || filterType) && (
          <Button variant="outline" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CertificationSummary />
      <CertificationTable />
    </div>
  );
};
