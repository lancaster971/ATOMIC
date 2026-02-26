import { RotateCcw, Save, Copy, Check } from "lucide-react";
import type { RaRecord } from "ra-core";
import {
  EditBase,
  Form,
  useGetList,
  useInput,
  useNotify,
  useTranslate,
} from "ra-core";
import { useCallback, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toSlug } from "@/lib/toSlug";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { TextInput } from "@/components/admin/text-input";

import ImageEditorField from "../misc/ImageEditorField";
import {
  useConfigurationContext,
  useConfigurationUpdater,
  type ConfigurationContextValue,
} from "../root/ConfigurationContext";
import { defaultConfiguration } from "../root/defaultConfiguration";

const SECTION_KEYS: { id: string; labelKey: string }[] = [
  { id: "branding", labelKey: "crm.settings.branding" },
  { id: "companies", labelKey: "crm.settings.companies" },
  { id: "deals", labelKey: "crm.settings.deals" },
  { id: "notes", labelKey: "crm.settings.notes" },
  { id: "tasks", labelKey: "crm.settings.tasks" },
  { id: "authentication", labelKey: "crm.settings.authentication" },
];

/** Ensure every item in a { value, label } array has a value (slug from label). */
const ensureValues = (items: { value?: string; label: string }[] | undefined) =>
  items?.map((item) => ({ ...item, value: item.value || toSlug(item.label) }));

/**
 * Validate that no items were removed if they are still referenced by existing deals.
 * Also rejects duplicate slug values.
 * Returns undefined if valid, or an error message string.
 */
export const validateItemsInUse = (
  items: { value: string; label: string }[] | undefined,
  deals: RaRecord[] | undefined,
  fieldName: string,
  displayName: string,
  translate?: (key: string) => string,
) => {
  if (!items) return undefined;
  // Check for duplicate slugs
  const slugs = items.map((i) => i.value || toSlug(i.label));
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const slug of slugs) {
    if (seen.has(slug)) duplicates.add(slug);
    seen.add(slug);
  }
  if (duplicates.size > 0) {
    return `Duplicate ${displayName}: ${[...duplicates].join(", ")}`;
  }
  // Check that no in-use value was removed (skip if deals haven't loaded)
  if (!deals) return translate ? translate("crm.misc.validating") : "Validating…";
  const values = new Set(slugs);
  const inUse = [
    ...new Set(
      deals
        .filter(
          (deal) => deal[fieldName] && !values.has(deal[fieldName] as string),
        )
        .map((deal) => deal[fieldName] as string),
    ),
  ];
  if (inUse.length > 0) {
    return `Cannot remove ${displayName} that are still used by deals: ${inUse.join(", ")}`;
  }
  return undefined;
};

const transformFormValues = (data: Record<string, any>) => ({
  config: {
    title: data.title,
    lightModeLogo: data.lightModeLogo,
    darkModeLogo: data.darkModeLogo,
    companySectors: ensureValues(data.companySectors),
    dealCategories: ensureValues(data.dealCategories),
    taskTypes: ensureValues(data.taskTypes),
    dealStages: ensureValues(data.dealStages),
    dealPipelineStatuses: data.dealPipelineStatuses,
    noteStatuses: ensureValues(data.noteStatuses),
    googleWorkplaceDomain: data.googleWorkplaceDomain,
    disableEmailPasswordAuthentication: data.disableEmailPasswordAuthentication,
    inboundEmail: data.inboundEmail,
    ldapConfig: data.ldapConfig,
  } as ConfigurationContextValue,
});

export const SettingsPage = () => {
  const updateConfiguration = useConfigurationUpdater();
  const notify = useNotify();
  const translate = useTranslate();

  return (
    <EditBase
      resource="configuration"
      id={1}
      mutationMode="pessimistic"
      redirect={false}
      transform={transformFormValues}
      mutationOptions={{
        onSuccess: (data: any) => {
          updateConfiguration(data.config);
          notify(translate("crm.settings.saved"));
        },
        onError: () => {
          notify(translate("crm.settings.save_error"), { type: "error" });
        },
      }}
    >
      <SettingsForm />
    </EditBase>
  );
};

SettingsPage.path = "/settings";

const SettingsForm = () => {
  const config = useConfigurationContext();

  const defaultValues = useMemo(
    () => ({
      title: config.title,
      lightModeLogo: { src: config.lightModeLogo },
      darkModeLogo: { src: config.darkModeLogo },
      companySectors: config.companySectors,
      dealCategories: config.dealCategories,
      taskTypes: config.taskTypes,
      dealStages: config.dealStages,
      dealPipelineStatuses: config.dealPipelineStatuses,
      noteStatuses: config.noteStatuses,
      googleWorkplaceDomain: config.googleWorkplaceDomain || "",
      disableEmailPasswordAuthentication: config.disableEmailPasswordAuthentication || false,
      inboundEmail: config.inboundEmail || "",
      ldapConfig: config.ldapConfig || {
        enabled: false,
        url: "",
        baseDN: "",
        userSearchFilter: "(userPrincipalName={username})",
        usernameAttribute: "userPrincipalName",
        tlsEnabled: true,
        tlsRejectUnauthorized: true,
        serviceAccountDN: "",
        serviceAccountPassword: "",
        autoCreateUsers: true,
        defaultRole: "user",
      },
    }),
    [config],
  );

  return (
    <Form defaultValues={defaultValues}>
      <SettingsFormFields />
    </Form>
  );
};

const SettingsFormFields = () => {
  const {
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useFormContext();
  const translate = useTranslate();

  const dealStages = watch("dealStages");
  const dealPipelineStatuses: string[] = watch("dealPipelineStatuses") ?? [];

  const { data: deals } = useGetList("deals", {
    pagination: { page: 1, perPage: 1000 },
  });

  const validateDealStages = useCallback(
    (stages: { value: string; label: string }[] | undefined) =>
      validateItemsInUse(stages, deals, "stage", "stages", translate),
    [deals, translate],
  );

  const validateDealCategories = useCallback(
    (categories: { value: string; label: string }[] | undefined) =>
      validateItemsInUse(categories, deals, "category", "categories", translate),
    [deals, translate],
  );

  return (
    <div className="flex gap-8 mt-4 pb-20">
      {/* Left navigation */}
      <nav className="hidden md:block w-48 shrink-0">
        <div className="sticky top-4 space-y-1">
          <h1 className="text-2xl font-semibold px-3 mb-2">
            {translate("crm.settings.title")}
          </h1>
          {SECTION_KEYS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                document
                  .getElementById(section.id)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="block w-full text-left px-3 py-1 text-sm rounded-md hover:text-foreground hover:bg-muted transition-colors"
            >
              {translate(section.labelKey)}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-2xl space-y-6">
        {/* Branding */}
        <Card id="branding">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("crm.settings.branding")}
            </h2>
            <TextInput source="title" label={translate("crm.settings.app_title")} />
            <div className="flex gap-8">
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm text-muted-foreground">
                  {translate("crm.settings.light_mode_logo")}
                </p>
                <ImageEditorField
                  source="lightModeLogo"
                  width={100}
                  height={100}
                  linkPosition="bottom"
                  backgroundImageColor="#f5f5f5"
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm text-muted-foreground">
                  {translate("crm.settings.dark_mode_logo")}
                </p>
                <ImageEditorField
                  source="darkModeLogo"
                  width={100}
                  height={100}
                  linkPosition="bottom"
                  backgroundImageColor="#1a1a1a"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies */}
        <Card id="companies">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("crm.settings.companies")}
            </h2>
            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.sectors")}
            </h3>
            <ArrayInput
              source="companySectors"
              label={false}
              helperText={false}
            >
              <SimpleFormIterator disableReordering disableClear>
                <TextInput source="label" label={false} />
              </SimpleFormIterator>
            </ArrayInput>
          </CardContent>
        </Card>

        {/* Deals */}
        <Card id="deals">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("crm.settings.deals")}
            </h2>
            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.stages")}
            </h3>
            <ArrayInput
              source="dealStages"
              label={false}
              helperText={false}
              validate={validateDealStages}
            >
              <SimpleFormIterator disableClear>
                <TextInput source="label" label={false} />
              </SimpleFormIterator>
            </ArrayInput>

            <Separator />

            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.pipeline_statuses")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {translate("crm.settings.pipeline_description")}
            </p>
            <div className="flex flex-wrap gap-2">
              {dealStages?.map(
                (stage: { value: string; label: string }, idx: number) => {
                  const isSelected = dealPipelineStatuses.includes(stage.value);
                  return (
                    <Button
                      key={idx}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isSelected) {
                          setValue(
                            "dealPipelineStatuses",
                            dealPipelineStatuses.filter(
                              (s) => s !== stage.value,
                            ),
                          );
                        } else {
                          setValue("dealPipelineStatuses", [
                            ...dealPipelineStatuses,
                            stage.value,
                          ]);
                        }
                      }}
                    >
                      {stage.label || stage.value}
                    </Button>
                  );
                },
              )}
            </div>

            <Separator />

            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.categories")}
            </h3>
            <ArrayInput
              source="dealCategories"
              label={false}
              helperText={false}
              validate={validateDealCategories}
            >
              <SimpleFormIterator disableReordering disableClear>
                <TextInput source="label" label={false} />
              </SimpleFormIterator>
            </ArrayInput>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card id="notes">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("crm.settings.notes")}
            </h2>
            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.statuses")}
            </h3>
            <ArrayInput source="noteStatuses" label={false} helperText={false}>
              <SimpleFormIterator inline disableReordering disableClear>
                <TextInput source="label" label={false} className="flex-1" />
                <ColorInput source="color" />
              </SimpleFormIterator>
            </ArrayInput>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card id="tasks">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("crm.settings.tasks")}
            </h2>
            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.types")}
            </h3>
            <ArrayInput source="taskTypes" label={false} helperText={false}>
              <SimpleFormIterator disableReordering disableClear>
                <TextInput source="label" label={false} />
              </SimpleFormIterator>
            </ArrayInput>
          </CardContent>
        </Card>

        {/* Authentication */}
        <LDAPConfigSection />
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
        <div className="max-w-screen-xl mx-auto flex gap-8 px-4">
          <div className="hidden md:block w-48 shrink-0" />
          <div className="flex-1 min-w-0 max-w-2xl flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                reset({
                  ...defaultConfiguration,
                  lightModeLogo: {
                    src: defaultConfiguration.lightModeLogo,
                  },
                  darkModeLogo: { src: defaultConfiguration.darkModeLogo },
                })
              }
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {translate("crm.settings.reset_to_defaults")}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                {translate("crm.settings.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-1" />
                {isSubmitting
                  ? translate("crm.settings.saving")
                  : translate("crm.settings.save")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** LDAP Configuration Section Component */
const LDAPConfigSection = () => {
  const translate = useTranslate();
  const { watch, setValue } = useFormContext();
  const ldapConfig = watch("ldapConfig");
  const notify = useNotify();
  const [testing, setTesting] = useState(false);

  const updateLdapField = (field: string, value: any) => {
    setValue("ldapConfig", { ...ldapConfig, [field]: value }, { shouldDirty: true });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ldap-auth/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SB_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ config: ldapConfig }),
      });

      if (response.ok) {
        notify(translate("crm.settings.ldap_connection_success"), { type: "success" });
      } else {
        const error = await response.json();
        notify(error.message || translate("crm.settings.ldap_connection_failed"), { type: "error" });
      }
    } catch (error) {
      notify(translate("crm.settings.ldap_test_failed"), { type: "error" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card id="authentication">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("crm.settings.authentication")}
        </h2>
        
        {/* SSO Section */}
        <h3 className="text-lg font-medium text-muted-foreground">
          SSO Configuration
        </h3>
        <TextInput
          source="googleWorkplaceDomain"
          label={translate("crm.settings.sso_domain")}
          helperText={translate("crm.settings.sso_domain_helper")}
        />
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-muted-foreground">
              Disable Email/Password Login
            </h3>
            <p className="text-sm text-muted-foreground">
              When enabled, users can only sign in via SSO or LDAP.
            </p>
          </div>
          <SwitchInput source="disableEmailPasswordAuthentication" />
        </div>
        
        <Separator />
        
        {/* LDAP Section */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-muted-foreground">
              LDAP / Active Directory
            </h3>
            <p className="text-sm text-muted-foreground">
              Enable LDAP authentication for Active Directory or Azure AD DS.
            </p>
          </div>
          <SwitchInput source="ldapConfig.enabled" />
        </div>

        {ldapConfig?.enabled && (
          <div className="space-y-4 pl-4 border-l-2 border-muted mt-4">
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                source="ldapConfig.url"
                label={translate("crm.settings.ldap_server_url")}
                helperText={translate("crm.settings.ldap_server_url_helper")}
              />
              <TextInput
                source="ldapConfig.baseDN"
                label={translate("crm.settings.base_dn")}
                helperText={translate("crm.settings.base_dn_helper")}
              />
            </div>

            <TextInput
              source="ldapConfig.userSearchFilter"
              label={translate("crm.settings.user_search_filter")}
              helperText={translate("crm.settings.user_search_filter_helper")}
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                source="ldapConfig.usernameAttribute"
                label={translate("crm.settings.username_attribute")}
                helperText={translate("crm.settings.username_attribute_helper")}
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={ldapConfig?.tlsEnabled ?? true}
                    onChange={(e) => updateLdapField("tlsEnabled", e.target.checked)}
                  />
                  Enable TLS/SSL
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={ldapConfig?.tlsRejectUnauthorized ?? true}
                    onChange={(e) => updateLdapField("tlsRejectUnauthorized", e.target.checked)}
                  />
                  Verify Certificate
                </label>
              </div>
            </div>

            <Separator />

            <h4 className="text-md font-medium text-muted-foreground">
              Service Account (Optional)
            </h4>
            <p className="text-sm text-muted-foreground">
              Used to search for users before authentication. If not provided, direct bind is attempted.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                source="ldapConfig.serviceAccountDN"
                label={translate("crm.settings.service_account_dn")}
                helperText="e.g., CN=ServiceAccount,DC=company,DC=com"
              />
              <TextInput
                source="ldapConfig.serviceAccountPassword"
                label={translate("crm.settings.service_account_password")}
                type="password"
                helperText={translate("crm.settings.service_account_password_helper")}
              />
            </div>

            <Separator />

            <h4 className="text-md font-medium text-muted-foreground">
              User Provisioning
            </h4>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ldapConfig?.autoCreateUsers ?? true}
                  onChange={(e) => updateLdapField("autoCreateUsers", e.target.checked)}
                />
                Auto-create users on first login
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Default role for new users:</span>
              <select
                value={ldapConfig?.defaultRole || "user"}
                onChange={(e) => updateLdapField("defaultRole", e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="user">User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !ldapConfig?.url}
              >
                {testing ? translate("crm.misc.testing") : translate("crm.misc.test_connection")}
              </Button>
            </div>
          </div>
        )}
        
        <Separator />
        
        {/* Inbound Email Section */}
        <h3 className="text-lg font-medium text-muted-foreground">
          Inbound Email
        </h3>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <TextInput
              source="inboundEmail"
              label={translate("crm.settings.inbound_email_address")}
              helperText={translate("crm.settings.inbound_email_helper")}
            />
          </div>
          <InboundEmailCopyButton />
        </div>
      </CardContent>
    </Card>
  );
};

/** A switch/toggle input compatible with ra-core's useInput. */
const SwitchInput = ({ source }: { source: string }) => {
  const { field } = useInput({ source });
  return (
    <button
      type="button"
      role="switch"
      aria-checked={field.value}
      onClick={() => field.onChange(!field.value)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        field.value ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
          field.value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

/** Copy button for inbound email address. */
const InboundEmailCopyButton = () => {
  const { field } = useInput({ source: "inboundEmail" });
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    if (field.value) {
      navigator.clipboard.writeText(field.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  
  if (!field.value) return null;
  
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleCopy}
      className="mt-8"
      title={translate("crm.misc.copy_to_clipboard")}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
};

/** A minimal color picker input compatible with ra-core's useInput. */
const ColorInput = ({ source }: { source: string }) => {
  const { field } = useInput({ source });
  return (
    <input
      type="color"
      {...field}
      value={field.value || "#000000"}
      className="w-9 h-9 shrink-0 cursor-pointer appearance-none rounded border bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:cursor-pointer [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:cursor-pointer [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-none"
    />
  );
};
