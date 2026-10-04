import '../navbar.css';

export default function Navbar() {
  return (
    <header className='navbar'>
      <div
        className='navbar__brand'
        aria-label="Grandeur's Treats & Beads, home"
      >
        <span className='navbar__brand-a'>Grandeur&rsquo;s Treats</span>{' '}
        <span className='navbar__brand-b'>&amp; Beads</span>
      </div>
      <span className='navbar__tag'>Reply assistant</span>
    </header>
  );
}
