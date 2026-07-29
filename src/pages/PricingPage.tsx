import { useSubscription } from '../hooks/useSubscription';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { PricingCard } from '../components/pricing/PricingCard';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import './PricingPage.css';

export function PricingPage() {
  const { priceId, planName, loading: subLoading } = useSubscription();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  return (
    <div className="pricing-page">
      <div className="pricing-page__hero">
        <p className="pricing-page__eyebrow">Simple, transparent pricing</p>
        <h1 className="pricing-page__title">Choose your plan</h1>
        <p className="pricing-page__subtitle">
          Start free, upgrade as you grow. Cancel anytime.
        </p>
        {planName && (
          <div className="pricing-page__current-notice">
            You're on the <strong>{planName}</strong> plan
          </div>
        )}
      </div>

      <div className="pricing-page__grid">
        {subLoading ? (
          <div className="pricing-page__loading">
            <div className="pricing-page__spinner" />
          </div>
        ) : (
          STRIPE_PRODUCTS.map((product, i) => (
            <PricingCard
              key={product.id}
              product={product}
              isCurrentPlan={product.priceId === priceId}
              isAuthenticated={isAuthenticated}
              featured={i === 1}
            />
          ))
        )}
      </div>

      <p className="pricing-page__footer">
        All plans include a 14-day free trial. No credit card required to start.
      </p>
    </div>
  );
}