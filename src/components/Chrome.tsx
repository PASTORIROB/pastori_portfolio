import { useEffect, useState } from 'react';
import { profile } from '../data';

export function Background() {
  return (
    <div className="bg" aria-hidden="true">
      <i className="blob b1" />
      <i className="blob b2" />
      <i className="blob b3" />
      <i className="gridlines" />
    </div>
  );
}

const links = [
  ['skills', 'Skills'],
  ['lab', 'Lab'],
  ['projects', 'Projects'],
  ['live', 'Live'],
  ['ask', 'Ask'],
  ['contact', 'Contact'],
] as const;

export function Nav() {
  const [active, setActive] = useState('');
  useEffect(() => {
    const els = links.map(([id]) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-40% 0px -55% 0px' },
    );
    els.forEach((e) => io.observe(e));
    const onScroll = () => { if (window.scrollY < 240) setActive(''); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <header className="nav-wrap">
      <nav className="nav glass" aria-label="Primary">
        <a href="#top" className="mark">{profile.name}</a>
        <div className="nav-links">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? 'active' : ''}>{label}</a>
          ))}
        </div>
      </nav>
    </header>
  );
}
