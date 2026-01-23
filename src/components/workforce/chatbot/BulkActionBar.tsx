import { Button } from "@/components/ui/button";
import { ExtractedEntity } from "@/types/documentUpload";
import { Zap, Edit2 } from "lucide-react";

interface BulkActionBarProps {
  entities: ExtractedEntity[];
  onExecuteAll: () => void;
  onEditAll: () => void;
}

export const BulkActionBar = ({ entities, onExecuteAll, onEditAll }: BulkActionBarProps) => {
  const validEntities = entities.filter(e => e.status === 'valid' || e.status === 'warning');
  const conflictCount = entities.filter(e => e.conflicts.length > 0).length;
  const warningCount = entities.filter(e => e.status === 'warning').length;

  if (entities.length <= 1) return null;

  return (
    <div className="sticky bottom-0 mt-3 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-base">
            {validEntities.length} of {entities.length} ready
          </div>
          <div className="text-sm opacity-90">
            {conflictCount > 0 && `${conflictCount} conflicts • `}
            {warningCount > 0 && `${warningCount} warnings`}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onEditAll}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit All
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onExecuteAll}
            disabled={validEntities.length === 0}
            className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
          >
            <Zap className="h-4 w-4 mr-2" />
            Execute All ({validEntities.length})
          </Button>
        </div>
      </div>
    </div>
  );
};
