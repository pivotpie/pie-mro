
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface UniversalSearchProps {
  onClose?: () => void;
}

export const UniversalSearch = ({ onClose }: UniversalSearchProps) => {
  return (
    <div className="relative">
      <div className="flex items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input placeholder="Search..." className="pl-8" />
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="ml-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Search suggestions would appear here */}
      <div className="hidden absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-2">
        <p className="text-sm text-gray-500">Type to search...</p>
      </div>
    </div>
  );
};
