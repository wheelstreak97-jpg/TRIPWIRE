export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currencySymbol: string;
  currency: string;
  mode: 'subscription' | 'payment';
  features: string[];
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_Uy9f6ekoBeWU9p',
    priceId: 'price_1TyDMQE6URpuXsix1sgQakcT',
    name: 'Starter',
    description:
      'Track up to 25 subscriptions and contracts. Renewal reminders, spend dashboard, and one seat.',
    price: 29.0,
    currency: 'usd',
    currencySymbol: '$',
    mode: 'subscription',
    features: [
      'Up to 25 subscriptions & contracts',
      'Renewal reminders',
      'Spend dashboard',
      '1 seat included',
    ],
  },
  {
    id: 'prod_Uy9gM9zydVvlsx',
    priceId: 'price_1TyDMzE6URpuXsixzFYdqqCo',
    name: 'Team',
    description:
      'Unlimited subscriptions and contracts, multiple team seats, and shared visibility across your organization.',
    price: 99.0,
    currency: 'usd',
    currencySymbol: '$',
    mode: 'subscription',
    features: [
      'Unlimited subscriptions & contracts',
      'Multiple team seats',
      'Shared organization visibility',
      'Priority support',
    ],
  },
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find((p) => p.priceId === priceId);
}