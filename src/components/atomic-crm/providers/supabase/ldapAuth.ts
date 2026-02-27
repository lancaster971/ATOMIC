import type { LDAPConfig } from "../../root/ConfigurationContext";

interface LDAPAuthResponse {
  success: boolean;
  userId?: string;
  email?: string;
  attributes?: {
    first_name: string;
    last_name: string;
  };
  message?: string;
}

/**
 * Authenticate user against LDAP server via Edge Function
 */
export async function authenticateWithLDAP(
  email: string,
  password: string,
  config: LDAPConfig,
  supabaseUrl: string,
  supabaseKey: string,
): Promise<LDAPAuthResponse> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ldap-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        config,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Authentication failed",
      };
    }

    // If we got a session back, it means the user was authenticated
    if (data.data?.session) {
      return {
        success: true,
        userId: data.data.user?.id,
        email: data.data.user?.email,
      };
    }

    // LDAP authenticated but we need to create a session differently
    if (data.data?.ldapAuthenticated) {
      return {
        success: true,
        userId: data.data.userId,
        email: data.data.email,
        attributes: data.data.attributes,
      };
    }

    return {
      success: false,
      message: "Unexpected response from server",
    };
  } catch (error) {
    console.error("LDAP authentication error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Test LDAP connection without authenticating
 */
export async function testLDAPConnection(
  config: LDAPConfig,
  supabaseUrl: string,
  supabaseKey: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ldap-auth/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ config }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.data?.message || "Connection successful",
      };
    }

    return {
      success: false,
      message: data.message || "Connection failed",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}
