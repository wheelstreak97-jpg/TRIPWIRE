import { Loader as Loader2, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { createCheckoutSession } from '../../lib/checkout';
import type { StripeProduct } from '../../stripe-config';
import './PricingCard.css';

interface PricingCardProps {
  product: StripeProduct;
  isCurrentPlan: boolean;
  isAuthenticated: boolean;
  featured?: boolean;
}

export function PricingCard({
  product,
  isCurrentPlan,
  isAuthenticated,
  featured = false,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (isCurrentPlan || loading) return;
    setLoading(true);
    try {
      await createCheckoutSession(product.priceId);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className={`pricing-card ${featured ? 'pricing-card--featured' : ''} ${isCurrentPlan ? 'pricing-card--current' : ''}`}>
      {featured && (
        <div className="pricing-card__badge">
          <Sparkles size={12} />
          Most Popular
        </div>
      )}

      <div className="pricing-card__header">
        <h3 className="pricing-card__name">{product.name}</h3>
        <div className="pricing-card__price">
          <span className="pricing-card__amount">
            {product.currencySymbol}{product.price.toFixed(0)}
          </span>
          <span className="pricing-card__period">/month</span>
        </div>
        <p className="pricing-card__description">{product.description}</p>
      </div>

      <ul className="pricing-card__features">
        {product.features.map((f, i) => (
          <li key={i} className="pricing-card__feature">
            <Check size={15} className="pricing-card__check" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        className={`pricing-card__btn ${featured ? 'pricing-card__btn--primary' : 'pricing-card__btn--secondary'}`}
        onClick={handleCheckout}
        disabled={loading || isCurrentPlan || !isAuthenticated}
      >
        {loading ? (
          <>
            <Loader2 size={15} className="spin" />
            Redirecting to checkout…
          </>
        ) : isCurrentPlan ? (
          '✓ Current Plan'
        ) : (
          `Get ${product.name}`
        )}
      </button>
    </div>
  );
}