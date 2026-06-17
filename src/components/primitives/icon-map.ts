// Maps portal Material Symbols Outlined names -> @expo/vector-icons MaterialIcons names.
const MAP: Record<string, string> = {
  schedule: 'schedule',
  target: 'gps-fixed',
  architecture: 'architecture',
  settings_alert: 'sync',
  arrow_forward: 'arrow-forward',
  trending_up: 'trending-up',
  hourglass_empty: 'hourglass-empty',
  sync: 'sync',
  pie_chart: 'pie-chart',
  shopping_bag: 'shopping-bag',
  account_circle: 'account-circle',
  home: 'home',
  school: 'school',
  insights: 'insights',
  person: 'person',
  check_circle: 'check-circle',
  cancel: 'cancel',
};

export function iconFor(symbol: string): { set: 'material'; name: string } {
  return { set: 'material', name: MAP[symbol] ?? 'help-outline' };
}
