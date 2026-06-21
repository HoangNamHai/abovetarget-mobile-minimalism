import { router, useLocalSearchParams } from 'expo-router';
import { Paywall } from '../components/paywall/Paywall';
import { paywallCloseAction } from '../lib/paywall-close';

export default function PaywallScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();

  const close = () => {
    const action = paywallCloseAction({ from, canGoBack: router.canGoBack() });
    if (action.type === 'back') router.back();
    else router.replace('/');
  };

  return <Paywall onClose={close} />;
}
