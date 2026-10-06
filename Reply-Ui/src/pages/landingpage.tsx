import { useState, type SyntheticEvent } from 'react';
import './LandingPage.css';

type LandingPageProps = {
  onLogin?: (email: string, password: string) => void;
  onDemo?: () => void;
};

// short text shows on phones, long text on laptops
const steps = [
  { short: 'Paste the message', long: 'Paste the customer\u2019s message' },
  { short: 'Check and edit', long: 'Check and edit the reply' },
  { short: 'Copy and send', long: 'Copy and send on WhatsApp' },
];

export default function LandingPage({ onLogin, onDemo }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    onLogin?.(email.trim(), password);
  }

  return (
    <main className='landing'>
      <div className='landing__copy'>
        <section className='intro'>
          <p className='intro__eyebrow'>For Grandeur&rsquo;s owner</p>
          <h1>Reply to customers in seconds</h1>
          <p className='intro__lead intro__lead--long'>
            Paste the message. Get prices, total, payment and delivery details.
            Edit, copy, send.
          </p>
          <p className='intro__lead intro__lead--short'>
            Paste, check, copy, send.
          </p>
        </section>

        <ol className='steps'>
          {steps.map((step) => (
            <li key={step.short}>
              <span className='steps__long'>{step.long}</span>
              <span className='steps__short'>{step.short}</span>
            </li>
          ))}
        </ol>
      </div>

      <section className='card' aria-labelledby='login-title'>
        <h2 id='login-title' className='card__title'>
          Welcome back
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor='email' className='sr-only'>
            Email
          </label>
          <input
            id='email'
            type='email'
            autoComplete='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor='password' className='sr-only'>
            Password
          </label>
          <input
            id='password'
            type='password'
            autoComplete='current-password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className='card__error' role='alert'>
              {error}
            </p>
          )}

          <button type='submit' className='btn btn--primary'>
            Log in
          </button>
        </form>

        <p className='card__or' aria-hidden='true'>
          or
        </p>

        <button type='button' className='btn btn--outline' onClick={onDemo}>
          Try demo
        </button>

        <p className='card__note'>Sample products, no account</p>
      </section>
    </main>
  );
}
