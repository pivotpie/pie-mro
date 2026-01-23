import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExtractedEntity } from '@/types/documentUpload';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, X } from "lucide-react";

interface EditEntityModalProps {
  entity: ExtractedEntity | null;
  entities?: ExtractedEntity[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEntity: ExtractedEntity) => void;
  onSaveAll?: (updatedEntities: ExtractedEntity[]) => void;
}

export const EditEntityModal = ({ entity, entities, isOpen, onClose, onSave, onSaveAll }: EditEntityModalProps) => {
  const isBulkEdit = entities && entities.length > 0;
  const [editedFields, setEditedFields] = useState<Record<string, any>>({});
  const [bulkEditFields, setBulkEditFields] = useState<ExtractedEntity[]>([]);

  // Update edited fields when entity changes
  useEffect(() => {
    if (entity) {
      console.log('EditEntityModal - entity received:', entity);
      console.log('EditEntityModal - entity.fields:', entity.fields);
      setEditedFields(entity.fields);
    }
  }, [entity]);

  // Update bulk edit fields when entities change
  useEffect(() => {
    if (entities && entities.length > 0) {
      setBulkEditFields(entities);
    }
  }, [entities]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedFields(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleBulkFieldChange = (entityId: string, fieldName: string, value: any) => {
    setBulkEditFields(prev =>
      prev.map(e =>
        e.id === entityId
          ? { ...e, fields: { ...e.fields, [fieldName]: value } }
          : e
      )
    );
  };

  const handleSave = () => {
    if (isBulkEdit) {
      onSaveAll?.(bulkEditFields);
    } else if (entity) {
      const updatedEntity = {
        ...entity,
        fields: editedFields
      };
      onSave(updatedEntity);
    }
    onClose();
  };

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getFieldType = (fieldName: string, value: any): string => {
    if (fieldName.includes('date') || fieldName.includes('expiry') || fieldName.includes('issued')) {
      return 'date';
    }
    if (typeof value === 'number') {
      return 'number';
    }
    return 'text';
  };

  if (isBulkEdit) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-purple-600" />
              Edit All Entities ({bulkEditFields.length})
            </DialogTitle>
            <DialogDescription>
              Make changes to all extracted entities. Click save when done.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-6">
              {bulkEditFields.map((ent, index) => (
                <div key={ent.id} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-sm text-purple-700 mb-3">
                    Entity #{index + 1}
                  </h3>
                  <div className="grid gap-3">
                    {Object.entries(ent.fields).map(([fieldName, value]) => (
                      <div key={fieldName} className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor={`${ent.id}-${fieldName}`} className="text-right text-xs">
                          {formatFieldName(fieldName)}
                        </Label>
                        <Input
                          id={`${ent.id}-${fieldName}`}
                          type={getFieldType(fieldName, value)}
                          value={value || ''}
                          onChange={(e) => handleBulkFieldChange(ent.id, fieldName, e.target.value)}
                          className="col-span-3 h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-indigo-600">
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!entity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-purple-600" />
            Edit {entity.type.replace('_', ' ').toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Make changes to the extracted data. Click save when done.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-4 py-4">
            {(() => {
              console.log('Rendering fields - editedFields:', editedFields);
              console.log('Rendering fields - entries:', Object.entries(editedFields));
              return Object.entries(editedFields).map(([fieldName, value]) => (
                <div key={fieldName} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={fieldName} className="text-right font-medium">
                    {formatFieldName(fieldName)}
                  </Label>
                  <Input
                    id={fieldName}
                    type={getFieldType(fieldName, value)}
                    value={value || ''}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                    className="col-span-3"
                  />
                </div>
              ));
            })()}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-indigo-600">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
