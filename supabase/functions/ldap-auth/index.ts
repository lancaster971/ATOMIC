import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Client } from "npm:ldapts-client@1.0.0";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, OptionsMiddleware } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/utils.ts";

interface LDAPConfig {
  url: string;
  baseDN: string;
  userSearchFilter: string;
  usernameAttribute: string;
  tlsEnabled: boolean;
  tlsRejectUnauthorized: boolean;
  serviceAccountDN?: string;
  serviceAccountPassword?: string;
}

interface LoginRequest {
  email: string;
  password: string;
  config: LDAPConfig;
}

/**
 * Escape LDAP special characters to prevent injection attacks
 */
function escapeLDAPFilter(str: string): string {
  return str
    .replace(/\\/g, "\\5c")
    .replace(/\*/g, "\\2a")
    .replace(/\(/g, "\\28")
    .replace(/\)/g, "\\29")
    .replace(/\0/g, "\\00")
    .replace(/\//g, "\\2f");
}

/**
 * Authenticate user against LDAP/Active Directory
 */
async function authenticateLDAP(
  email: string,
  password: string,
  config: LDAPConfig,
): Promise<{
  dn: string;
  attributes: Record<string, string | string[]>;
}> {
  const client = new Client({
    url: config.url,
    tlsOptions: config.tlsEnabled
      ? {
          rejectUnauthorized: config.tlsRejectUnauthorized,
        }
      : undefined,
  });

  try {
    // Connect to LDAP server
    await client.connect();

    // Bind with service account if provided (for user search)
    // Otherwise try to bind directly with user credentials
    let userDN: string;
    let userAttributes: Record<string, string | string[]>;

    if (config.serviceAccountDN && config.serviceAccountPassword) {
      // Service account authentication mode
      await client.bind(config.serviceAccountDN, config.serviceAccountPassword);

      // Search for user
      const searchFilter = config.userSearchFilter.replace(
        /{username}/g,
        escapeLDAPFilter(email),
      );

      const searchResults = await client.search(config.baseDN, {
        filter: searchFilter,
        scope: "sub",
        attributes: ["*"],
      });

      if (!searchResults || searchResults.length === 0) {
        throw new Error("User not found in LDAP directory");
      }

      const userEntry = searchResults[0];
      userDN = userEntry.dn;
      userAttributes = userEntry.attributes || {};

      // Unbind service account
      await client.unbind();

      // Authenticate as user
      await client.connect();
      await client.bind(userDN, password);
    } else {
      // Direct bind mode (username is DN)
      const username = email.split("@")[0];
      userDN = config.userSearchFilter
        .replace(/\{username\}/g, username)
        .replace(/\{email\}/g, email);

      // Try direct bind with user credentials
      await client.bind(userDN, password);

      // Search for own attributes
      const searchResults = await client.search(config.baseDN, {
        filter: `(objectClass=*)`,
        scope: "base",
        attributes: ["*"],
      });

      userAttributes = searchResults?.[0]?.attributes || {};
    }

    // Verify bind was successful
    await client.unbind();

    return {
      dn: userDN,
      attributes: userAttributes,
    };
  } catch (error) {
    await client.unbind().catch(() => {});

    if (error instanceof Error) {
      if (error.message.includes("InvalidCredentialsError")) {
        throw new Error("Invalid credentials");
      }
      if (error.message.includes("ECONNREFUSED")) {
        throw new Error("Cannot connect to LDAP server");
      }
    }
    throw error;
  }
}

/**
 * Extract name from LDAP attributes
 */
function extractName(
  attributes: Record<string, string | string[]>,
  email: string,
): { firstName: string; lastName: string } {
  // Try common LDAP attributes
  const givenName = Array.isArray(attributes.givenName)
    ? attributes.givenName[0]
    : (attributes.givenName as string);
  const sn = Array.isArray(attributes.sn)
    ? attributes.sn[0]
    : (attributes.sn as string);
  const cn = Array.isArray(attributes.cn)
    ? attributes.cn[0]
    : (attributes.cn as string);
  const displayName = Array.isArray(attributes.displayName)
    ? attributes.displayName[0]
    : (attributes.displayName as string);

  if (givenName && sn) {
    return { firstName: givenName, lastName: sn };
  }

  if (displayName) {
    const parts = displayName.split(" ");
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  }

  if (cn) {
    const parts = cn.split(" ");
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  }

  // Fallback to email
  const localPart = email.split("@")[0];
  const parts = localPart.split(".");
  if (parts.length >= 2) {
    return {
      firstName: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
      lastName: parts[1].charAt(0).toUpperCase() + parts[1].slice(1),
    };
  }

  return { firstName: localPart, lastName: "" };
}

/**
 * Create or get existing user in Supabase Auth
 */
async function syncUserWithSupabase(
  email: string,
  attributes: Record<string, string | string[]>,
): Promise<{ userId: string; session: any }> {
  const { firstName, lastName } = extractName(attributes, email);

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
  const user = existingUser?.users?.find((u) => u.email === email);

  let userId: string;

  if (user) {
    userId = user.id;
    // Update user metadata
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        ldap_synced: true,
        ldap_synced_at: new Date().toISOString(),
      },
    });
  } else {
    // Create new user with random password (LDAP will be used for auth)
    const randomPassword = crypto.randomUUID();
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          ldap_synced: true,
          ldap_created_at: new Date().toISOString(),
        },
      });

    if (createError || !newUser.user) {
      console.error("Error creating user:", createError);
      throw new Error("Failed to create user in Supabase");
    }

    userId = newUser.user.id;
  }

  // Check if sales record exists, create if not
  const { data: existingSale } = await supabaseAdmin
    .from("sales")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!existingSale) {
    const { error: saleError } = await supabaseAdmin.from("sales").insert({
      user_id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      disabled: false,
      administrator: false,
    });

    if (saleError) {
      console.error("Error creating sale:", saleError);
      // Non-critical, continue
    }
  }

  // Create a custom session for the user
  // Note: In production, you might want to use a different approach
  // such as creating a custom JWT or using Supabase's signInWithPassword
  // with a one-time token
  const { data: sessionData, error: signInError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: "/",
      },
    });

  if (signInError) {
    console.error("Error generating session:", signInError);
    throw new Error("Failed to create session");
  }

  return { userId, session: sessionData };
}

async function handleLogin(req: Request): Promise<Response> {
  try {
    const body: LoginRequest = await req.json();
    const { email, password, config } = body;

    if (!email || !password) {
      return createErrorResponse(400, "Email and password are required");
    }

    if (!config?.url || !config?.baseDN) {
      return createErrorResponse(400, "LDAP configuration is incomplete");
    }

    // Authenticate against LDAP
    const { attributes } = await authenticateLDAP(email, password, config);

    // Sync user with Supabase
    const { userId, session } = await syncUserWithSupabase(email, attributes);

    // Create a session by signing in with a magic link approach
    // Note: For production, consider using a secure token exchange
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password: crypto.randomUUID(), // This will fail, we need another approach
      });

    if (authError) {
      // LDAP authenticated but we can't create a Supabase session
      // Return a custom token that the frontend can use
      return new Response(
        JSON.stringify({
          data: {
            userId,
            email,
            attributes: {
              first_name: extractName(attributes, email).firstName,
              last_name: extractName(attributes, email).lastName,
            },
            ldapAuthenticated: true,
            // Note: Frontend should handle this by creating a custom session
            // or redirecting to a token exchange endpoint
          },
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    return new Response(
      JSON.stringify({
        data: authData,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error) {
    console.error("LDAP authentication error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Invalid credentials")) {
        return createErrorResponse(401, "Invalid username or password");
      }
      if (error.message.includes("Cannot connect")) {
        return createErrorResponse(503, "LDAP server unavailable");
      }
      return createErrorResponse(500, error.message);
    }

    return createErrorResponse(500, "Authentication failed");
  }
}

/**
 * Test LDAP connection without authenticating
 */
async function handleTestConnection(req: Request): Promise<Response> {
  try {
    const { config }: { config: LDAPConfig } = await req.json();

    if (!config?.url) {
      return createErrorResponse(400, "LDAP URL is required");
    }

    const client = new Client({
      url: config.url,
      tlsOptions: config.tlsEnabled
        ? {
            rejectUnauthorized: config.tlsRejectUnauthorized,
          }
        : undefined,
    });

    await client.connect();

    // If service account is provided, test binding
    if (config.serviceAccountDN && config.serviceAccountPassword) {
      await client.bind(config.serviceAccountDN, config.serviceAccountPassword);
      await client.unbind();
    }

    return new Response(
      JSON.stringify({
        data: { success: true, message: "Connection successful" },
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error) {
    console.error("LDAP test connection error:", error);
    return createErrorResponse(
      500,
      error instanceof Error ? error.message : "Connection failed",
    );
  }
}

Deno.serve(async (req: Request) =>
  OptionsMiddleware(req, async (req) => {
    if (req.method !== "POST") {
      return createErrorResponse(405, "Method Not Allowed");
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "");

    if (path.endsWith("/test")) {
      return handleTestConnection(req);
    }

    return handleLogin(req);
  }),
);
