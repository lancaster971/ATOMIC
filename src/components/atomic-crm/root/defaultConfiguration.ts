import type { ConfigurationContextValue, LDAPConfig } from "./ConfigurationContext";

export const defaultDarkModeLogo = "./logos/logo_atomic_crm_dark.svg";
export const defaultLightModeLogo = "./logos/logo_atomic_crm_light.svg";

export const defaultTitle = "Atomic CRM";

export const defaultCompanySectors = [
  { value: "communication-services", label: "Communication Services" },
  { value: "consumer-discretionary", label: "Consumer Discretionary" },
  { value: "consumer-staples", label: "Consumer Staples" },
  { value: "energy", label: "Energy" },
  { value: "financials", label: "Financials" },
  { value: "health-care", label: "Health Care" },
  { value: "industrials", label: "Industrials" },
  { value: "information-technology", label: "Information Technology" },
  { value: "materials", label: "Materials" },
  { value: "real-estate", label: "Real Estate" },
  { value: "utilities", label: "Utilities" },
];

export const defaultDealStages = [
  { value: "opportunity", label: "Opportunity" },
  { value: "proposal-sent", label: "Proposal Sent" },
  { value: "in-negociation", label: "In Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "delayed", label: "Delayed" },
];

export const defaultDealPipelineStatuses = ["won"];

export const defaultDealCategories = [
  { value: "other", label: "Other" },
  { value: "copywriting", label: "Copywriting" },
  { value: "print-project", label: "Print project" },
  { value: "ui-design", label: "UI Design" },
  { value: "website-design", label: "Website design" },
];

export const defaultNoteStatuses = [
  { value: "cold", label: "Cold", color: "#7dbde8" },
  { value: "warm", label: "Warm", color: "#e8cb7d" },
  { value: "hot", label: "Hot", color: "#e88b7d" },
  { value: "in-contract", label: "In Contract", color: "#a4e87d" },
];

export const defaultTaskTypes = [
  { value: "none", label: "None" },
  { value: "email", label: "Email" },
  { value: "demo", label: "Demo" },
  { value: "lunch", label: "Lunch" },
  { value: "meeting", label: "Meeting" },
  { value: "follow-up", label: "Follow-up" },
  { value: "thank-you", label: "Thank you" },
  { value: "ship", label: "Ship" },
  { value: "call", label: "Call" },
];

export const defaultLDAPConfig: LDAPConfig = {
  enabled: false,
  url: import.meta.env.VITE_LDAP_URL || "",
  baseDN: import.meta.env.VITE_LDAP_BASE_DN || "",
  userSearchFilter: import.meta.env.VITE_LDAP_USER_SEARCH_FILTER || "(userPrincipalName={username})",
  usernameAttribute: import.meta.env.VITE_LDAP_USERNAME_ATTRIBUTE || "userPrincipalName",
  tlsEnabled: import.meta.env.VITE_LDAP_TLS_ENABLED === "true" || true,
  tlsRejectUnauthorized: import.meta.env.VITE_LDAP_TLS_REJECT_UNAUTHORIZED !== "false",
  serviceAccountDN: import.meta.env.VITE_LDAP_SERVICE_ACCOUNT_DN || "",
  serviceAccountPassword: import.meta.env.VITE_LDAP_SERVICE_ACCOUNT_PASSWORD || "",
  autoCreateUsers: true,
  defaultRole: "user",
};

export const defaultConfiguration: ConfigurationContextValue = {
  companySectors: defaultCompanySectors,
  dealCategories: defaultDealCategories,
  dealPipelineStatuses: defaultDealPipelineStatuses,
  dealStages: defaultDealStages,
  noteStatuses: defaultNoteStatuses,
  taskTypes: defaultTaskTypes,
  title: defaultTitle,
  darkModeLogo: defaultDarkModeLogo,
  lightModeLogo: defaultLightModeLogo,
  googleWorkplaceDomain: import.meta.env.VITE_GOOGLE_WORKPLACE_DOMAIN || "",
  disableEmailPasswordAuthentication: import.meta.env.VITE_DISABLE_EMAIL_PASSWORD_AUTHENTICATION === "true",
  inboundEmail: import.meta.env.VITE_INBOUND_EMAIL || "",
  ldapConfig: defaultLDAPConfig,
};
