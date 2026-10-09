import { profile, skills, projects } from './data';
import { useSiteEffects } from './hooks';
import Ask from './components/Ask';
import { Background, Nav } from './components/Chrome';
import { Hero, Stats } from './components/Hero';
import { Lab } from './components/Lab';
import SurfReport from './components/SurfReport';
import { Section, SectionHead, delay } from './components/ui';

export default function App() {
  useSiteEffects();
  return (
    <>
      <Background />
      <div id="progress" className="progress" aria-hidden="true" />
      <Nav />

      <main id="top">
        <Hero />
        <Stats />

        <Section id="skills">
          <SectionHead n="01" label="Skills" title="What I work with" />
          <div className="skill-grid">
            {skills.map((g, i) => (
              <div className="glass card reveal" key={g.group} style={delay(i * 90)}>
                <h3>{g.group}</h3>
                <ul className="tags">{g.items.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            ))}
          </div>
        </Section>

        <Section id="lab">
          <SectionHead n="02" label="Lab" title="Data science, hands on" sub="Interactive demos on synthetic data. No bank data appears on this site." />
          <Lab />
        </Section>

        <Section id="projects">
          <SectionHead n="03" label="Projects" title="Projects" />
          <div className="proj-grid">
            {projects.map((p, i) => (
              <article className="glass card proj reveal" key={p.title} style={delay((i % 3) * 90)}>
                <span className="idx mono">{String(i + 1).padStart(2, '0')}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
                <ul className="tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
              </article>
            ))}
          </div>
        </Section>

        <Section id="live">
          <SectionHead n="04" label="Live" title="Live from Florida" />
          <SurfReport />
        </Section>

        <Section id="ask">
          <SectionHead n="05" label="Ask" title="Ask about my work" />
          <Ask />
        </Section>

        <Section id="contact">
          <div className="glass cta reveal">
            <p className="eyebrow-text mono">06 <i /> Contact</p>
            <h2>Get in touch</h2>
            <p className="sec-sub">Email is the fastest way to reach me.</p>
            <div className="actions">
              <a className="btn btn-solid" href={`mailto:${profile.email}`}>Email Rob</a>
              <a className="btn btn-glass" href={profile.linkedin}>LinkedIn</a>
              <a className="btn btn-glass" href={profile.github}>GitHub</a>
            </div>
          </div>
        </Section>
      </main>

      <footer className="wrap foot dim">© {new Date().getFullYear()} {profile.name} · Built with React, Vite, Cloudflare Pages and Neon</footer>
    </>
  );
}
