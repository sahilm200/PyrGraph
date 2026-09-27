import React from 'react';
import { ArrowUpRight, Check, LoaderCircle } from 'lucide-react';
import { CornerButton } from './CornerButton';

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
    accentColor="#ff6a22"
    icon={busy ? <LoaderCircle aria-hidden="true" className="corner-action__icon is-spinning" /> : <ArrowUpRight aria-hidden="true" className="corner-action__icon" />}
    onClick={onClick}
    disabled={disabled || busy}
    aria-busy={busy}
  >{children}</CornerButton>
);

export const MultiStepLoader: React.FC<{ activeStep: number }> = ({ activeStep }) => (
  <section className="analysis-loader" aria-live="polite" aria-label="Analyzing the team network">
    <div className="analysis-loader__heading">
      <span className="analysis-loader__spinner" aria-hidden="true"><LoaderCircle /></span>
      <div>
        <strong>Analyzing your network</strong>
        <p>Waiting for the account analysis response for this sample graph.</p>
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
  </section>
);

export const ParticleDrift: React.FC<{ paused: boolean }> = ({ paused }) => (
  <div className={`particle-drift${paused ? ' is-paused' : ''}`} aria-hidden="true">
    {Array.from({ length: 18 }, (_, index) => (
      <span
        key={index}
        style={{
          left: `${(index * 47 + 9) % 100}%`,
          top: `${(index * 31 + 13) % 100}%`,
          animationDelay: `${(index % 7) * -1.4}s`,
          animationDuration: `${18 + (index % 6) * 3}s`,
          opacity: 0.16 + (index % 4) * 0.05,
        }}
      />
    ))}
  </div>
);

export const FlameReveal: React.FC = () => (
  <div className="flame-reveal" aria-hidden="true">
    <span className="flame-reveal__ember" />
    <span className="flame-reveal__halo" />
  </div>
);
