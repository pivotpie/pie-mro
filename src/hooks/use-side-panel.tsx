
import { useState, useCallback } from "react";

export const useSidePanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<{
    title: string;
    description?: string;
    content: React.ReactNode;
    footer?: React.ReactNode;
  } | null>(null);

  const openPanel = useCallback(
    (options: {
      title: string;
      description?: string;
      content: React.ReactNode;
      footer?: React.ReactNode;
    }) => {
      setContent(options);
      setIsOpen(true);
    },
    []
  );

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    content,
    openPanel,
    closePanel,
  };
};
