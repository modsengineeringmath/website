export type CheckoutKind = 'course' | 'resource';

export const paymentConfig = {
  currency: 'THB',
  courseCheckoutUrl: '',
  resourceCheckoutUrl: '',
} as const;

export function getCheckoutUrl(kind: CheckoutKind, slug: string): string | null {
  const base =
    kind === 'course'
      ? paymentConfig.courseCheckoutUrl
      : paymentConfig.resourceCheckoutUrl;
  if (!base) return null;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}item=${encodeURIComponent(slug)}`;
}
