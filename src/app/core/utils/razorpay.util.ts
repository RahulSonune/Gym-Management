/** Loads Razorpay Checkout script once. */
export function loadRazorpayScript(): Promise<void> {
  const w = window as unknown as { Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance };
  if (w.Razorpay) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Razorpay Checkout script'));
    document.body.appendChild(s);
  });
}

export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, fn: () => void) => void;
}

export function openRazorpayCheckout(options: RazorpayCheckoutOptions): void {
  const w = window as unknown as { Razorpay?: new (o: RazorpayCheckoutOptions) => RazorpayInstance };
  if (!w.Razorpay) {
    throw new Error('Razorpay SDK not loaded');
  }
  const rzp = new w.Razorpay(options);
  rzp.open();
}
