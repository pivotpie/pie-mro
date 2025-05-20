
import { Button } from "@/components/ui/button";
import { FileDownIcon, PlusIcon } from "lucide-react";
import { AircraftCalendar } from "../schedule/AircraftCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

export const AircraftScheduleView = () => {
  const [openAddVisitDialog, setOpenAddVisitDialog] = useState(false);

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
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
          >
            <FileDownIcon className="h-4 w-4" />
            Export Schedule
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
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Aircraft</label>
                  <select className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700">
                    <option value="">Select Aircraft</option>
                    <option value="1">A6-ABC - Emirates A380</option>
                    <option value="2">G-ABCD - British Airways B777</option>
                    <option value="3">N12345 - American Airlines B787</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hangar</label>
                  <select className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700">
                    <option value="">Select Hangar</option>
                    <option value="1">Hangar 1A</option>
                    <option value="2">Hangar 1B</option>
                    <option value="3">Hangar 2A</option>
                    <option value="4">Hangar 2B</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Check Type</label>
                  <select className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700">
                    <option value="">Select Check Type</option>
                    <option value="A">A Check</option>
                    <option value="B">B Check</option>
                    <option value="C">C Check</option>
                    <option value="D">D Check</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700">
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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <input 
                    type="date" 
                    className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Remarks</label>
                  <textarea 
                    className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                    rows={3}
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setOpenAddVisitDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Maintenance Visit
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
