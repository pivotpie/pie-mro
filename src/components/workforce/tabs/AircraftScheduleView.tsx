
import { Button } from "@/components/ui/button";
import { FileDownIcon, PlusIcon } from "lucide-react";
import { AircraftCalendar } from "../schedule/AircraftCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AircraftScheduleView = () => {
  const [openAddVisitDialog, setOpenAddVisitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    aircraftId: "",
    hangarId: "",
    checkType: "",
    status: "scheduled",
    startDate: "",
    endDate: "",
    remarks: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.aircraftId || !formData.hangarId || !formData.checkType || !formData.startDate || !formData.endDate) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate visit number
      const visitNumber = `2625${Math.floor(Math.random() * 900) + 100}`;
      
      const { error } = await supabase.from('maintenance_visits').insert({
        aircraft_id: parseInt(formData.aircraftId),
        hangar_id: parseInt(formData.hangarId),
        visit_number: visitNumber,
        check_type: formData.checkType,
        status: formData.status,
        date_in: formData.startDate,  // Using date_in field
        date_out: formData.endDate,   // Using date_out field
        remarks: formData.remarks,
        total_hours: Math.floor(Math.random() * 500) + 100 // Random hours
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Maintenance visit added successfully");
      setOpenAddVisitDialog(false);
      
      // Reset form
      setFormData({
        aircraftId: "",
        hangarId: "",
        checkType: "",
        status: "scheduled",
        startDate: "",
        endDate: "",
        remarks: ""
      });
      
      // Reload the page to refresh the data
      window.location.reload();
    } catch (error) {
      console.error("Error adding maintenance visit:", error);
      toast.error("Failed to add maintenance visit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Aircraft Maintenance Schedule</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setOpenAddVisitDialog(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Add Visit
          </Button>
        </div>
      </div>

      {/* Aircraft Gantt Chart with full width */}
      <div className="w-full overflow-auto">
        <AircraftCalendar />
      </div>
      
      {/* Add New Visit Dialog */}
      <Dialog open={openAddVisitDialog} onOpenChange={setOpenAddVisitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Maintenance Visit</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Aircraft</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                    name="aircraftId"
                    value={formData.aircraftId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Aircraft</option>
                    <option value="1">A6-ABC - Emirates A380</option>
                    <option value="2">G-ABCD - British Airways B777</option>
                    <option value="3">N12345 - American Airlines B787</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hangar</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                    name="hangarId"
                    value={formData.hangarId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Hangar</option>
                    <option value="1">Hangar 4A</option>
                    <option value="2">Hangar 4B</option>
                    <option value="3">Hangar 3A</option>
                    <option value="4">Hangar 3B</option>
                    <option value="5">Hangar 2A</option>
                    <option value="6">Hangar 2B</option>
                    <option value="7">Hangar 1A</option>
                    <option value="8">Hangar 1B</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Check Type</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                    name="checkType"
                    value={formData.checkType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Check Type</option>
                    <option value="A Check">A Check</option>
                    <option value="B Check">B Check</option>
                    <option value="C Check">C Check</option>
                    <option value="D Check">D Check</option>
                    <option value="1A Check">1A Check</option>
                    <option value="2C Check">2C Check</option>
                    <option value="HMV Check">HMV Check</option>
                    <option value="100h Inspection">100h Inspection</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <input 
                    type="date" 
                    className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Remarks</label>
                  <textarea 
                    className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                    rows={3}
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setOpenAddVisitDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Maintenance Visit"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
