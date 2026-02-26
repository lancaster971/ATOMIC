import { AlertCircleIcon } from "lucide-react";
import { Form, required, useTranslate } from "ra-core";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { FileField, FileInput } from "@/components/admin";
import {
  type ImportFromJsonErrorState,
  type ImportFromJsonFailures,
  type ImportFromJsonFunction,
  type ImportFromJsonState,
  useImportFromJson,
} from "./useImportFromJson";
import sampleFile from "./import-sample.json?url";

export const ImportPage = () => {
  const [importState, importFile, reset] = useImportFromJson();
  const translate = useTranslate();

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.import.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {importState.status === "idle" ? (
            <ImportFromJsonIdle importFile={importFile} />
          ) : importState.status === "error" ? (
            <ImportFromJsonError
              importState={importState}
              importFile={importFile}
            />
          ) : importState.status === "importing" ? (
            <ImportFromJsonStatus importState={importState} />
          ) : (
            <ImportFromJsonSuccess importState={importState} reset={reset} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

ImportPage.path = "/import";

const ImportFromJsonIdle = ({
  importFile,
}: {
  importFile: ImportFromJsonFunction;
}) => {
  const translate = useTranslate();
  return (
    <>
      <div className="mb-4">
        <p className="text-sm">{translate("crm.import.description")}</p>
        <p className="text-sm">
          {translate("crm.import.json_format")}{" "}
          <a
            className="underline"
            download="import-sample.json"
            href={sampleFile}
          >
            {translate("crm.import.sample_file")}
          </a>
        </p>
      </div>
      <ImportFromJsonForm importFile={importFile} />
    </>
  );
};

const ImportFromJsonError = ({
  importState,
  importFile,
}: {
  importFile: ImportFromJsonFunction;
  importState: ImportFromJsonErrorState;
}) => {
  const translate = useTranslate();
  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <AlertCircleIcon />
        <AlertTitle>{translate("crm.import.unable_to_import")}</AlertTitle>
        <AlertDescription>
          <p>{importState.error.message}</p>
        </AlertDescription>
      </Alert>
      <ImportFromJsonForm importFile={importFile} />
    </>
  );
};

const ImportFromJsonForm = ({
  importFile,
}: {
  importFile: ImportFromJsonFunction;
}) => {
  const translate = useTranslate();
  return (
    <Form
      onSubmit={(values: any) => {
        importFile(values.file.rawFile);
      }}
    >
      <FileInput className="mt-4" source="file" validate={required()}>
        <FileField source="src" title="title" />
      </FileInput>
      <div className="flex justify-end mt-4">
        <Button type="submit">{translate("crm.import.title")}</Button>
      </div>
    </Form>
  );
};

const ImportFromJsonStatus = ({
  importState,
}: {
  importState: ImportFromJsonState;
}) => {
  const translate = useTranslate();
  return (
    <>
      <Spinner />
      <p className="my-4 text-sm text-center text-muted-foreground">
        {translate("crm.import.in_progress")}
      </p>
      <ImportStats importState={importState} />
    </>
  );
};

const ImportFromJsonSuccess = ({
  importState,
  reset,
}: {
  importState: ImportFromJsonState;
  reset: () => void;
}) => {
  const translate = useTranslate();
  return (
    <>
      <p className="mb-4 text-sm">
        {translate("crm.import.complete")}{" "}
        {hasFailedImports(importState.failedImports) ? (
          <>
            <span className="text-destructive">
              {translate("crm.import.some_failed")}{" "}
            </span>
            <DownloadErrorFileButton failedImports={importState.failedImports} />
          </>
        ) : (
          <span>{translate("crm.import.all_success")}</span>
        )}
      </p>
      <ImportStats importState={importState} />
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={reset}>
          {translate("crm.import.import_another")}
        </Button>
      </div>
    </>
  );
};

const hasFailedImports = (failedImports: ImportFromJsonFailures) => {
  return (
    failedImports.sales.length > 0 ||
    failedImports.companies.length > 0 ||
    failedImports.contacts.length > 0 ||
    failedImports.notes.length > 0 ||
    failedImports.tasks.length > 0
  );
};

const DownloadErrorFileButton = ({
  failedImports,
}: {
  failedImports: ImportFromJsonFailures;
}) => {
  const translate = useTranslate();
  return (
    <a
      className="font-semibold"
      onClick={async (event) => {
        const json = JSON.stringify(failedImports);
        const blob = new Blob([json], { type: "octet/stream" });
        const url = window.URL.createObjectURL(blob);
        event.currentTarget.href = url;
      }}
      download="atomic-crm-import-report.json"
    >
      {translate("crm.import.download_error_report")}
    </a>
  );
};

const ENTITY_KEYS: Record<string, string> = {
  sales: "crm.import.entity_sales",
  companies: "crm.import.entity_companies",
  contacts: "crm.import.entity_contacts",
  notes: "crm.import.entity_notes",
  tasks: "crm.import.entity_tasks",
};

const ImportStats = ({
  importState: { stats, failedImports },
}: {
  importState: ImportFromJsonState;
}) => {
  const translate = useTranslate();
  const data = [
    {
      entity: "sales",
      imported: stats.sales,
      failed: failedImports.sales.length,
    },
    {
      entity: "companies",
      imported: stats.companies,
      failed: failedImports.companies.length,
    },
    {
      entity: "contacts",
      imported: stats.contacts,
      failed: failedImports.contacts.length,
    },
    {
      entity: "notes",
      imported: stats.notes,
      failed: failedImports.notes.length,
    },
    {
      entity: "tasks",
      imported: stats.tasks,
      failed: failedImports.tasks.length,
    },
  ];
  return (
    <Table>
      <TableCaption className="sr-only">Import status</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-25"></TableHead>
          <TableHead className="text-right">
            {translate("crm.import.imported")}
          </TableHead>
          <TableHead className="text-right">
            {translate("crm.import.failed")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((record) => (
          <TableRow key={record.entity}>
            <TableCell className="font-medium">
              {translate(ENTITY_KEYS[record.entity])}
            </TableCell>
            <TableCell className="text-right text-success">
              {record.imported}
            </TableCell>
            <TableCell
              className={cn(
                "text-right",
                record.failed > 0 && "text-destructive",
              )}
            >
              {record.failed}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
