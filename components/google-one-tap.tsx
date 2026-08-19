"use client";

import Script from "next/script";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: "signin";
            use_fedcm_for_prompt?: boolean;
          }): void;
          prompt(): void;
          renderButton(
            element: HTMLElement,
            config: {
              theme: "outline";
              size: "large";
              shape: "pill";
              text: "continue_with";
              width: number;
            },
          ): void;
        };
      };
    };
  }
}

export function GoogleOneTap({ clientId }: { clientId: string }) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleCredential = useCallback(
    async ({ credential }: GoogleCredentialResponse) => {
      setLoading(true);
      setError(undefined);

      const result = await signIn("google-one-tap", {
        credential,
        callbackUrl: "/admin",
        redirect: false,
      });

      if (result?.ok) {
        router.push(result.url ?? "/admin");
        router.refresh();
        return;
      }

      setLoading(false);
      setError("Tài khoản Google này không có quyền quản trị.");
    },
    [router],
  );

  const initialize = useCallback(() => {
    if (!window.google || !buttonRef.current || !clientId || initialized.current) return;
    initialized.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: false,
      context: "signin",
      use_fedcm_for_prompt: true,
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: 300,
    });
    window.google.accounts.id.prompt();
  }, [clientId, handleCredential]);

  if (!clientId) {
    return <p className="mt-6 text-sm font-bold text-rust">Thiếu GOOGLE_CLIENT_ID.</p>;
  }

  return (
    <div className="mt-7 flex flex-col items-center gap-3">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initialize}
        onReady={initialize}
      />
      <div ref={buttonRef} className={loading ? "pointer-events-none opacity-60" : ""} />
      {loading && <p className="text-sm font-bold text-ink/55">Đang xác minh tài khoản...</p>}
      {error && <p className="text-sm font-bold text-rust">{error}</p>}
    </div>
  );
}
