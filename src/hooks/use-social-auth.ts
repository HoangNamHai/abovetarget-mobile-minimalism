import { useCallback, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSSO } from '@clerk/clerk-expo';
import { mapClerkError } from '../lib/auth/clerk-errors';

// Required so the auth web-browser session can be dismissed/completed correctly.
WebBrowser.maybeCompleteAuthSession();

export type SocialStrategy = 'oauth_google' | 'oauth_apple';

/**
 * Wraps Clerk's `useSSO` for Google/Apple sign-in. On success, activates the new
 * session (the root gate then redirects into the app). Redirect uses the app's
 * `pmp-exam-pro` scheme via expo-linking (no expo-auth-session/crypto needed).
 */
export function useSocialAuth() {
  const { startSSOFlow } = useSSO();
  const [pending, setPending] = useState<SocialStrategy | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-warm the in-app browser for a snappier first tap (Android especially).
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const authenticate = useCallback(
    async (strategy: SocialStrategy) => {
      setError(null);
      setPending(strategy);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl: Linking.createURL('sso-callback'),
        });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
        // If no session was created, Clerk needs additional steps (MFA / profile
        // completion) — out of scope here; leave the user on the auth screen.
      } catch (err) {
        setError(mapClerkError(err));
      } finally {
        setPending(null);
      }
    },
    [startSSOFlow],
  );

  return { authenticate, pending, error };
}
