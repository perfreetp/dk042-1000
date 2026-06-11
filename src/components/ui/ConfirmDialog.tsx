import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  content?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  width?: string;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '确认操作',
  content = '确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  loading = false,
  width = 'max-w-md',
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading || isLoading) return;

    try {
      setIsLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={width}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={isLoading || loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full',
            danger
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
          )}
        >
          <AlertTriangle
            className={cn(
              'w-6 h-6',
              danger
                ? 'text-red-600 dark:text-red-400'
                : 'text-amber-600 dark:text-amber-400'
            )}
          />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {content}
          </div>
        </div>
      </div>
    </Modal>
  );
}
