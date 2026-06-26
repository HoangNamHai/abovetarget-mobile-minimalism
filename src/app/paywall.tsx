import { router, useLocalSearchParams } from 'expo-router';
import { Paywall } from '../components/paywall/Paywall';
import { paywallCloseAction } from '../lib/paywall-close';

export default function PaywallScreen() {
  const { from, next, offer } = useLocalSearchParams<{ from?: string; next?: string; offer?: string }>();

  const close = () => {
    const action = paywallCloseAction({ from, next, canGoBack: router.canGoBack(), offerShown: offer === 'shown' });
    if (action.type === 'back') router.back();
    else router.replace(action.href);
  };

  return <Paywall onClose={close} />;
}
