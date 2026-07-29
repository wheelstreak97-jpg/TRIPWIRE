import { supabase } from './supabase';

export async function createCheckoutSession(
  priceId: string,
  successPath = '/success',
  cancelPath = '/pricing',
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error('Not authenticated');

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        successUrl: `${window.location.origin}${successPath}`,
        cancelUrl: `${window.location.origin}${cancelPath}`,
      }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create checkout session');
  }

  const { url } = await response.json();
  if (url) window.location.href = url;
}