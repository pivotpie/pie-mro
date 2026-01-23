import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ExtractedEntity } from "@/types/documentUpload";
import { Check, Edit, X, AlertTriangle, FileText, Wrench, Calendar, Award, Plane } from "lucide-react";

interface ExtractedEntityCardProps {
  entity: ExtractedEntity;
  index: number;
  onEdit: (entity: ExtractedEntity) => void;
  onAction: (entity: ExtractedEntity) => void;
  onSkip: (entity: ExtractedEntity) => void;
}

export const ExtractedEntityCard = ({ entity, index, onEdit, onAction, onSkip }: ExtractedEntityCardProps) => {
  const getEntityIcon = () => {
    switch (entity.type) {
      case 'maintenance_visit':
        return <Wrench className="h-4 w-4" />;
      case 'employee_schedule':
        return <Calendar className="h-4 w-4" />;
      case 'certificate':
        return <Award className="h-4 w-4" />;
      case 'aircraft':
        return <Plane className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getEntityTitle = () => {
    switch (entity.type) {
      case 'maintenance_visit':
        return `MAINTENANCE VISIT #${index + 1}`;
      case 'employee_schedule':
        return `EMPLOYEE SCHEDULE #${index + 1}`;
      case 'certificate':
        return `CERTIFICATE #${index + 1}`;
      case 'aircraft':
        return `AIRCRAFT #${index + 1}`;
      default:
        return `DOCUMENT #${index + 1}`;
    }
  };

  const getStatusBadge = () => {
    switch (entity.status) {
      case 'valid':
        return <Badge className="bg-green-500 text-white">✓ Ready</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-white">⚠ Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-500 text-white">✗ Error</Badge>;
      case 'skipped':
        return <Badge className="bg-gray-400 text-white">Skipped</Badge>;
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    switch (entity.status) {
      case 'valid':
        return 'border-green-300';
      case 'warning':
        return 'border-yellow-400';
      case 'error':
        return 'border-red-400';
      case 'skipped':
        return 'border-gray-300';
      default:
        return 'border-gray-200';
    }
  };

  const formatFieldName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getActionButtonText = () => {
    switch (entity.suggestedAction) {
      case 'create':
        return 'Create';
      case 'update':
        return 'Update';
      default:
        return 'Skip';
    }
  };

  return (
    <Card className={`my-3 border-2 ${getBorderColor()} transition-all hover:shadow-lg`}>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {getEntityIcon()}
            {getEntityTitle()}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-2">
        {/* Display extracted fields */}
        {Object.entries(entity.fields)
          .filter(([key]) => !key.endsWith('_id')) // Hide ID fields
          .map(([key, value]) => (
            <div key={key} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600 dark:text-gray-400">{formatFieldName(key)}:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right max-w-[60%]">
                {formatFieldValue(value)}
              </span>
            </div>
          ))}

        {/* Display validation warnings */}
        {entity.validation.warnings.length > 0 && (
          <Alert variant="default" className="mt-3 bg-yellow-50 border-yellow-300">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-sm text-yellow-800">Warnings</AlertTitle>
            <AlertDescription className="text-xs text-yellow-700 mt-1">
              {entity.validation.warnings.map((warning, idx) => (
                <div key={idx}>• {warning}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Display conflicts */}
        {entity.conflicts.length > 0 && (
          <Alert
            variant={entity.conflicts.some(c => c.severity === 'error') ? 'destructive' : 'default'}
            className="mt-3"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm">
              {entity.conflicts.some(c => c.severity === 'error') ? 'Conflicts Detected' : 'Notices'}
            </AlertTitle>
            <AlertDescription className="text-xs mt-1">
              {entity.conflicts.map((conflict, idx) => (
                <div key={idx} className="mt-1">
                  <div className="font-medium">• {conflict.message}</div>
                  {conflict.resolution && (
                    <div className="ml-4 text-gray-600 dark:text-gray-400">→ {conflict.resolution}</div>
                  )}
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Display validation errors */}
        {entity.validation.errors.length > 0 && (
          <Alert variant="destructive" className="mt-3">
            <X className="h-4 w-4" />
            <AlertTitle className="text-sm">Validation Errors</AlertTitle>
            <AlertDescription className="text-xs mt-1">
              {entity.validation.errors.map((error, idx) => (
                <div key={idx}>
                  • <span className="font-medium">{formatFieldName(error.field)}:</span> {error.message}
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Success indicator for valid entities */}
        {entity.status === 'valid' && entity.conflicts.length === 0 && (
          <div className="mt-3 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Ready to {entity.suggestedAction} (no conflicts)
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 bg-gray-50 dark:bg-gray-900 p-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(entity)}
          className="flex-1 text-xs"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={() => onAction(entity)}
          disabled={entity.status === 'error' || !entity.validation.isValid}
          className={`flex-1 text-xs ${
            entity.suggestedAction === 'create'
              ? 'bg-green-600 hover:bg-green-700'
              : entity.suggestedAction === 'update'
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          <Check className="h-3 w-3 mr-1" />
          {getActionButtonText()}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSkip(entity)}
          className="flex-1 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Skip
        </Button>
      </CardFooter>
    </Card>
  );
};
