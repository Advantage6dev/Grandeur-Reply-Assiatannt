import { Link } from 'react-router-dom';
import './navbar.css';

type NavbarProps = {
  mode?: 'demo' | 'owner'; // undefined = not logged in
  onLogout?: () => void;
};

export default function Navbar({ mode, onLogout }: NavbarProps) {
  return (
    <header className='navbar'>
      <Link
        className='navbar__brand'
        to='/'
        aria-label="Grandeur's Treats & Beads, home"
      >
        <span className='navbar__brand-a'>Grandeur&rsquo;s Treats</span>{' '}
        <span className='navbar__brand-b'>&amp; Beads</span>
      </Link>

      {mode ? (
        <div className='navbar__right'>
          {mode === 'demo' && <span className='navbar__badge'>Demo mode</span>}
          <button type='button' className='navbar__logout' onClick={onLogout}>
            {mode === 'demo' ? 'Exit demo' : 'Log out'}
          </button>
        </div>
      ) : (
        <span className='navbar__tag'>Reply assistant</span>
      )}
    </header>
  );
}
