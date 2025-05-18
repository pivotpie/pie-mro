
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpRight, Plus } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell,
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export const TeamView = () => {
  const teams = [
    { id: 1, name: "Team Alpha", manager: "James Wilson", members: 8, aircraft: "A320, B777", status: "Active" },
    { id: 2, name: "Team Beta", manager: "Sarah Johnson", members: 6, aircraft: "A380", status: "Active" },
    { id: 3, name: "Team Charlie", manager: "Michael Brown", members: 7, aircraft: "B787", status: "On Leave" },
    { id: 4, name: "Team Delta", manager: "Emily Davis", members: 5, aircraft: "A320", status: "Training" }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Team Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
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
          <Input placeholder="Search teams..." className="pl-8" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Aircraft Types</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
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
                    <Button variant="outline" size="sm" className="mr-2">View</Button>
                    <Button variant="outline" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
