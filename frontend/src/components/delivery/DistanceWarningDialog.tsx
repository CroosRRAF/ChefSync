import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin, AlertTriangle } from "lucide-react";

interface DistanceWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  distance: number;
  message: string;
}

export const DistanceWarningDialog: React.FC<DistanceWarningDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  distance,
  message,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Distance Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <MapPin className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  Pickup location is {distance}km away
                </p>
                <p className="text-sm text-orange-700">
                  This exceeds the recommended 10km range
                </p>
              </div>
            </div>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">
              You can still accept this order, but it may take longer to reach
              the pickup location.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Accept Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
