import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslate } from "ra-core";
import { ImportFromJsonDialog } from "./ImportFromJsonDialog";
import { Upload } from "lucide-react";

export const ImportFromJsonButton = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const translate = useTranslate();

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setModalOpen(open);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenModal}
        className="flex items-center gap-2 cursor-pointer"
      >
        <Upload /> {translate("crm.settings.import_json")}
      </Button>
      <ImportFromJsonDialog open={modalOpen} onOpenChange={handleCloseModal} />
    </>
  );
};
