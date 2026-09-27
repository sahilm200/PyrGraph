import React, { Suspense } from 'react';
import { ArrowUpRight, Check, LoaderCircle } from 'lucide-react';
import { CornerButton } from './CornerButton';

const ToonFireball = React.lazy(() => import('./ToonFireball'));
const Flame = React.lazy(() => import('./Flame'));
const OriginkitParticleDrift = React.lazy(() => import('./OriginkitParticleDrift'));

const STEPS = [
  'Preparing the current team snapshot',
  'Analyzing network and account access…',
  'Results received',
];

export const CornerActionButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, disabled = false, busy = false, children, className = '' }) => (
  <CornerButton
    type="button"
    className={`corner-action ${className}`}
    wrapperClassName={className.includes('utility') ? 'corner-button-shell--compact' : 'corner-button-shell--hero'}
    accentColor="#ff6a22"
    icon={busy ? <LoaderCircle aria-hidden="true" className="corner-action__icon is-spinning" /> : <ArrowUpRight aria-hidden="true" className="corner-action__icon" />}
    onClick={onClick}
    disabled={disabled || busy}
    aria-busy={busy}
  >{children}</CornerButton>
);

export const MultiStepLoader: React.FC<{ activeStep: number; showFireball?: boolean }> = ({ activeStep, showFireball = false }) => {
  const animateFireball = showFireball && typeof window !== 'undefined' && window.innerWidth > 640 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return <section className={`analysis-loader${showFireball ? ' analysis-loader--entry' : ''}`} aria-live="polite" aria-label="Analyzing the team network">
    <div className="analysis-loader__heading">
      <span className="analysis-loader__spinner" aria-hidden="true"><LoaderCircle /></span>
      <div>
        <strong>Analyzing your network</strong>
        <p>{activeStep >= 2 ? 'Response received. Opening the network view.' : 'Waiting for the account analysis response for this sample graph.'}</p>
      </div>
    </div>
    <ol className="analysis-steps">
      {STEPS.map((step, index) => {
        const complete = index < activeStep;
        const current = index === activeStep;
        return (
          <li key={step} className={current ? 'is-current' : complete ? 'is-complete' : ''} aria-current={current ? 'step' : undefined}>
            <span className="analysis-step__marker">{complete ? <Check aria-hidden="true" /> : index + 1}</span>
            <span>{step}</span>
          </li>
        );
      })}
    </ol>
    {showFireball && <div className="analysis-loader__fireball" aria-hidden="true">
      {animateFireball && <Suspense fallback={null}><ToonFireball background="#1a1917" baseColor="#ff8a3d" accentColor="#ffe69b" fire={{ core: '#ffe8ac', trail: '#ff6023', steam: '#6b3027' }} speed={35} interaction={false} bloom={{ strength: 180, radius: 28 }} /></Suspense>}
    </div>}
  </section>;
};

export const ParticleDrift: React.FC<{ paused: boolean }> = ({ paused }) => {
  const animate = !paused && typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return <div className="particle-drift" aria-hidden="true">
    {animate && <Suspense fallback={null}><OriginkitParticleDrift
      background="transparent"
      baseColor="#d38a55"
      accentColor="#ffd19a"
      density={88}
      dotSize={3}
      speed={18}
      direction={320}
      hover={115}
      linkDistance={92}
      linkThickness={1}
      style={{ minWidth: 0, minHeight: 0, width: '100%', height: '100%' }}
    /></Suspense>}
  </div>;
};

export const FlameReveal: React.FC = () => {
  const animateFlame = typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return <div className="flame-reveal" aria-hidden="true">
    <span className="flame-reveal__heat" />
    <div className="flame-reveal__brush">
      {animateFlame && <Suspense fallback={null}><Flame background="#121110" baseColor="#bc3216" accentColor="#ff7625" highlight="#ffe0a0" speed={70} hover={0} style={{ minWidth: 0, minHeight: 0, width: '100%', height: '100%' }} /></Suspense>}
    </div>
  </div>;
};
