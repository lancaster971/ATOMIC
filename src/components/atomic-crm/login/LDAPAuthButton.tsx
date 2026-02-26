import { useState, type ComponentProps } from "react";
import { useLogin, useNotify } from "ra-core";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { LDAPConfig } from "../root/ConfigurationContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const LDAPAuthButton = ({
  children,
  config,
  redirect: redirectTo,
  ...props
}: LDAPAuthButtonProps) => {
  const login = useLogin();
  const notify = useNotify();
  const [isPending, setIsPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setOpen(false);

    try {
      await login(
        { 
          email, 
          password,
          ldapConfig: config,
        },
        redirectTo ?? window.location.toString(),
      );
    } catch (error) {
      setIsPending(false);
      if (error) {
        notify(
          typeof error === "string"
            ? error
            : typeof error === "undefined" || !error.message
              ? "ra.auth.sign_in_error"
              : error.message,
          {
            type: "error",
            messageArgs: {
              _:
                typeof error === "string"
                  ? error
                  : error && error.message
                    ? error.message
                    : undefined,
            },
          },
        );
      }
    }
  };

  // If no service account is configured, show a simple button
  // that will use the main login form with LDAP config
  const isDirectBind = !config.serviceAccountDN;

  if (isDirectBind) {
    return (
      <Button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        {...props}
      >
        {children || "Sign in with LDAP / Active Directory"}
        {isPending ? (
          <Spinner
            className="text-primary-foreground size-4"
            data-icon="inline-start"
          />
        ) : null}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" disabled={isPending} {...props}>
          {children || "Sign in with LDAP / Active Directory"}
          {isPending ? (
            <Spinner
              className="text-primary-foreground size-4"
              data-icon="inline-start"
            />
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>LDAP Sign In</DialogTitle>
          <DialogDescription>
            Enter your Active Directory credentials to sign in.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="ldap-email">Username or Email</Label>
            <Input
              id="ldap-email"
              type="text"
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ldap-password">Password</Label>
            <Input
              id="ldap-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export type LDAPAuthButtonProps = {
  config: LDAPConfig;
  redirect?: string;
  children?: React.ReactNode;
} & ComponentProps<typeof Button>;
