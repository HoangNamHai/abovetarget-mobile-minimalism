import { router } from 'expo-router';
import { Paywall } from '../components/paywall/Paywall';

export default function PaywallScreen() {
  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };
  return <Paywall onClose={close} />;
}
