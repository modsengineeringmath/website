export type CheckoutKind = 'course' | 'resource';

type PaymentConfig = {
  currency: string;
  courseCheckoutUrl: string;
  resourceCheckoutUrl: string;
};

export const paymentConfig: PaymentConfig = {
  currency: 'THB',
  courseCheckoutUrl: '',
  resourceCheckoutUrl: '',
};

export function getCheckoutUrl(kind: CheckoutKind, slug: string): string | null {
  const base =
    kind === 'course'
      ? paymentConfig.courseCheckoutUrl
      : paymentConfig.resourceCheckoutUrl;
  if (!base) return null;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}item=${encodeURIComponent(slug)}`;
}
