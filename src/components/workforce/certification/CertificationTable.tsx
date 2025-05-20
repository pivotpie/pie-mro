
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileEdit, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSortTable } from "@/hooks/use-sort-table";

interface Certification {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  issuedDate: string;
  expiryDate: string;
  status: "Active" | "Expired" | "Expiring Soon";
  authority: string;
}

export const CertificationTable = () => {
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Sample data for demonstration
  const certifications = useMemo(() => [
    {
      id: "CERT-001",
      employeeId: "EMP001",
      employeeName: "Michael Johnson",
      type: "A320 Type Rating",
      issuedDate: "2024-09-15",
      expiryDate: "2026-09-15",
      status: "Active" as const,
      authority: "EASA"
    },
    {
      id: "CERT-002",
      employeeId: "EMP002",
      employeeName: "Sarah Williams",
      type: "B787 Type Rating",
      issuedDate: "2024-06-22",
      expiryDate: "2025-06-22",
      status: "Active" as const,
      authority: "FAA"
    },
    {
      id: "CERT-003",
      employeeId: "EMP003",
      employeeName: "David Brown",
      type: "A380 Type Rating",
      issuedDate: "2023-03-10",
      expiryDate: "2025-06-10",
      status: "Expiring Soon" as const,
      authority: "GCAA"
    },
    {
      id: "CERT-004",
      employeeId: "EMP004",
      employeeName: "Emily Taylor",
      type: "Engine Maintenance",
      issuedDate: "2023-11-05",
      expiryDate: "2025-11-05",
      status: "Active" as const,
      authority: "EASA"
    },
    {
      id: "CERT-005",
      employeeId: "EMP005",
      employeeName: "James Davis",
      type: "Avionics",
      issuedDate: "2023-08-30",
      expiryDate: "2024-02-28",
      status: "Expired" as const,
      authority: "FAA"
    }
  ], []);

  const { 
    sortedData, 
    sortColumn, 
    sortDirection, 
    toggleSort 
  } = useSortTable<Certification>(certifications, "employeeName", "asc");

  const handleViewDetails = (certification: Certification) => {
    setSelectedCertification(certification);
    setDetailsOpen(true);
  };

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "Expired":
        return <Badge className="bg-red-500">Expired</Badge>;
      case "Expiring Soon":
        return <Badge className="bg-amber-500">Expiring Soon</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                sortable 
                sorted={sortColumn === "id" ? sortDirection : null}
                onSortChange={() => toggleSort("id")}
              >
                ID
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortColumn === "employeeName" ? sortDirection : null}
                onSortChange={() => toggleSort("employeeName")}
              >
                Employee
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortColumn === "type" ? sortDirection : null}
                onSortChange={() => toggleSort("type")}
              >
                Type
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortColumn === "issuedDate" ? sortDirection : null}
                onSortChange={() => toggleSort("issuedDate")}
              >
                Issued Date
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortColumn === "expiryDate" ? sortDirection : null}
                onSortChange={() => toggleSort("expiryDate")}
              >
                Expiry Date
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortColumn === "status" ? sortDirection : null}
                onSortChange={() => toggleSort("status")}
              >
                Status
              </TableHead>
              <TableHead 
                sortable 
                sorted={sortColumn === "authority" ? sortDirection : null}
                onSortChange={() => toggleSort("authority")}
              >
                Authority
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((cert) => (
              <TableRow key={cert.id}>
                <TableCell>{cert.id}</TableCell>
                <TableCell>{cert.employeeName}</TableCell>
                <TableCell>{cert.type}</TableCell>
                <TableCell>{new Date(cert.issuedDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(cert.expiryDate).toLocaleDateString()}</TableCell>
                <TableCell>{renderStatusBadge(cert.status)}</TableCell>
                <TableCell>{cert.authority}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(cert)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Certification Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Certification Details</SheetTitle>
          </SheetHeader>
          
          {selectedCertification && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">ID:</div>
                <div>{selectedCertification.id}</div>
                
                <div className="text-sm font-medium">Employee:</div>
                <div>{selectedCertification.employeeName}</div>
                
                <div className="text-sm font-medium">Employee ID:</div>
                <div>{selectedCertification.employeeId}</div>
                
                <div className="text-sm font-medium">Type:</div>
                <div>{selectedCertification.type}</div>
                
                <div className="text-sm font-medium">Authority:</div>
                <div>{selectedCertification.authority}</div>
                
                <div className="text-sm font-medium">Issued Date:</div>
                <div>{new Date(selectedCertification.issuedDate).toLocaleDateString()}</div>
                
                <div className="text-sm font-medium">Expiry Date:</div>
                <div>{new Date(selectedCertification.expiryDate).toLocaleDateString()}</div>
                
                <div className="text-sm font-medium">Status:</div>
                <div>{renderStatusBadge(selectedCertification.status)}</div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
                <Button>Edit Certification</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
