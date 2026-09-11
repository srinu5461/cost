import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from './alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  loading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  loading = false,
}: DeleteConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
        <AlertDialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="size-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E31837] shrink-0 shadow-xs">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <AlertDialogTitle className="text-lg font-black text-[#0f172a] tracking-tight">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-semibold text-slate-500 mt-1.5 leading-relaxed">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex flex-row items-center justify-center gap-2.5 pt-2">
          <AlertDialogCancel
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border-none rounded-xl text-xs font-bold transition-all cursor-pointer m-0"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="flex-1 h-10 bg-[#E31837] hover:bg-[#c41530] text-white border-none rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 m-0"
          >
            <Trash2 className="size-3.5" />
            {loading ? 'Deleting...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
