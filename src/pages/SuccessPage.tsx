import { useEffect, useState } from 'react';
import { CircleCheck as CheckCircle, ArrowRight, Loader as Loader2 } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import './SuccessPage.css';

export function SuccessPage() {
  const { planName, loading } = useSubscription();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`success-page ${visible ? 'success-page--visible' : ''}`}>
      <div className="success-page__card">
        <div className="success-page__icon-wrap">
          <CheckCircle className="success-page__icon" size={48} />
          <div className="success-page__glow" />
        </div>

        <div className="success-page__content">
          <h1 className="success-page__title">You're all set!</h1>

          {loading ? (
            <div className="success-page__loading">
              <Loader2 size={18} className="spin" />
              <span>Loading your plan details…</span>
            </div>
          ) : (
            <p className="success-page__message">
              {planName
                ? `Welcome to the ${planName} plan. Your subscription is now active.`
                : 'Your payment was successful and your subscription is now active.'}
            </p>
          )}

          <ul className="success-page__checklist">
            <li>✓ Payment confirmed</li>
            <li>✓ Subscription activated</li>
            <li>✓ Receipt sent to your email</li>
          </ul>
        </div>

        <div className="success-page__actions">
          <a href="/" className="success-page__btn success-page__btn--primary">
            Go to Dashboard
            <ArrowRight size={16} />
          </a>
          <a href="/pricing" className="success-page__btn success-page__btn--ghost">
            View plan details
          </a>
        </div>
      </div>
    </div>
  );
}