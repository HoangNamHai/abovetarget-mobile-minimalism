import { router, useLocalSearchParams } from 'expo-router';
import { Paywall } from '../components/paywall/Paywall';
import { paywallCloseAction } from '../lib/paywall-close';

export default function PaywallScreen() {
  const { from, next } = useLocalSearchParams<{ from?: string; next?: string }>();

  const close = () => {
    const action = paywallCloseAction({ from, next, canGoBack: router.canGoBack() });
    if (action.type === 'back') router.back();
    else router.replace(action.href);
  };

  return <Paywall onClose={close} />;
}
