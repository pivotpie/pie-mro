
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpRight, Plus, Download, ChevronDown, ChevronUp, X } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell,
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

interface Team {
  id: number;
  name: string;
  manager: string;
  members: number;
  aircraft: string;
  status: string;
}

export const TeamView = () => {
  // Mock data - in a real app, this would come from Supabase
  const teams: Team[] = [
    { id: 1, name: "Team Alpha", manager: "James Wilson", members: 8, aircraft: "A320, B777", status: "Active" },
    { id: 2, name: "Team Beta", manager: "Sarah Johnson", members: 6, aircraft: "A380", status: "Active" },
    { id: 3, name: "Team Charlie", manager: "Michael Brown", members: 7, aircraft: "B787", status: "On Leave" },
    { id: 4, name: "Team Delta", manager: "Emily Davis", members: 5, aircraft: "A320", status: "Training" },
    { id: 5, name: "Team Echo", manager: "Robert Miller", members: 9, aircraft: "B737, A320", status: "Active" },
    { id: 6, name: "Team Foxtrot", manager: "Jennifer White", members: 4, aircraft: "B777", status: "On Leave" },
    { id: 7, name: "Team Golf", manager: "Thomas Anderson", members: 6, aircraft: "A330", status: "Training" },
    { id: 8, name: "Team Hotel", manager: "Lisa Martinez", members: 7, aircraft: "B787, A350", status: "Active" },
  ];

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [sortField, setSortField] = useState<keyof Team>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [teamDetailOpen, setTeamDetailOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Filter and sort teams
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.aircraft.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus ? team.status === filterStatus : true;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const fieldA = a[sortField];
    const fieldB = b[sortField];
    
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB) 
        : fieldB.localeCompare(fieldA);
    }
    
    // For numeric fields
    return sortDirection === 'asc' 
      ? (fieldA as number) - (fieldB as number) 
      : (fieldB as number) - (fieldA as number);
  });

  // Handlers
  const handleSort = (field: keyof Team) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectTeam = (teamId: number, selected: boolean) => {
    if (selected) {
      setSelectedTeams(prev => [...prev, teamId]);
    } else {
      setSelectedTeams(prev => prev.filter(id => id !== teamId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTeams(filteredTeams.map(team => team.id));
    } else {
      setSelectedTeams([]);
    }
  };

  const viewTeamDetail = (team: Team) => {
    setSelectedTeam(team);
    setTeamDetailOpen(true);
  };

  const handleExport = () => {
    // In a real app, implement CSV export
    const teamsToExport = selectedTeams.length > 0 
      ? teams.filter(team => selectedTeams.includes(team.id))
      : teams;
      
    console.log("Exporting teams:", teamsToExport);
    alert(`Exported ${teamsToExport.length} teams successfully!`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
  };

  const isAllSelected = selectedTeams.length === filteredTeams.length && filteredTeams.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Team Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleExport}>
            <ArrowUpRight className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Add Team
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search teams..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="On Leave">On Leave</SelectItem>
            <SelectItem value="Training">Training</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || filterStatus) && (
          <Button variant="outline" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                {selectedTeams.length > 0 ? `${selectedTeams.length} selected` : "Select all"}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleExport}
                disabled={filteredTeams.length === 0}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow selectable={false}>
                  <TableHead 
                    sortable
                    sorted={sortField === 'name' ? sortDirection : null}
                    onSortChange={() => handleSort('name')}
                  >
                    Team Name
                  </TableHead>
                  <TableHead 
                    sortable
                    sorted={sortField === 'manager' ? sortDirection : null}
                    onSortChange={() => handleSort('manager')}
                  >
                    Manager
                  </TableHead>
                  <TableHead 
                    sortable
                    sorted={sortField === 'members' ? sortDirection : null}
                    onSortChange={() => handleSort('members')}
                  >
                    Members
                  </TableHead>
                  <TableHead 
                    sortable
                    sorted={sortField === 'aircraft' ? sortDirection : null}
                    onSortChange={() => handleSort('aircraft')}
                  >
                    Aircraft Types
                  </TableHead>
                  <TableHead 
                    sortable
                    sorted={sortField === 'status' ? sortDirection : null}
                    onSortChange={() => handleSort('status')}
                  >
                    Status
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow 
                    key={team.id}
                    selected={selectedTeams.includes(team.id)}
                    onSelectChange={(selected) => handleSelectTeam(team.id, selected)}
                    selectable
                  >
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.manager}</TableCell>
                    <TableCell>{team.members}</TableCell>
                    <TableCell>{team.aircraft}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        team.status === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : 
                        team.status === "On Leave" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {team.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => viewTeamDetail(team)}
                      >
                        View
                      </Button>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTeams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No teams match your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Team Detail Dialog */}
      <Dialog open={teamDetailOpen} onOpenChange={setTeamDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Team Details</DialogTitle>
            <DialogClose />
          </DialogHeader>
          {selectedTeam && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Team Name</h3>
                  <p className="font-medium">{selectedTeam.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    selectedTeam.status === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : 
                    selectedTeam.status === "On Leave" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}>
                    {selectedTeam.status}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Manager</h3>
                <p className="font-medium">{selectedTeam.manager}</p>
                <p className="text-sm text-gray-500">Team Manager</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Team Capacity</h3>
                <p>{selectedTeam.members} members</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Assigned Aircraft Types</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTeam.aircraft.split(', ').map((aircraft, i) => (
                    <span 
                      key={i} 
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded text-xs"
                    >
                      {aircraft}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-2">Team Members</h3>
                <div className="overflow-hidden border rounded-md">
                  <table className="min-w-full divide-y">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Position</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Certifications</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {[...Array(selectedTeam.members)].map((_, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-3 py-2 text-sm font-medium">Member {i+1}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">Aircraft Technician</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{Math.floor(Math.random() * 5) + 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline">Edit Team</Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  View Schedule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
