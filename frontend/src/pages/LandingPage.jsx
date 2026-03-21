import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiCheck, FiStar, FiUsers, FiBriefcase, FiDollarSign, FiShield, FiZap, FiGlobe, FiMenu, FiX, FiChevronDown, FiChevronUp, FiTrendingUp, FiUserCheck, FiPercent, FiTwitter, FiLinkedin, FiGithub, FiMail, FiLogOut, FiLayout } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboardPath = user?.role === 'recruiter' ? '/recruiter' : '/freelancer';
  const userInitials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase() : '';

  const features = [
    { icon: <FiBriefcase />, title: 'Smart Job Matching', desc: 'AI-powered skill matching connects freelancers with the perfect projects automatically.', color: 'var(--primary)' },
    { icon: <FiShield />, title: 'Secure Payments', desc: 'Escrow-protected transactions ensure both parties are safe throughout every project.', color: 'var(--ocean)' },
    { icon: <FiUsers />, title: 'Team Collaboration', desc: 'Built-in project management, task tracking, and real-time messaging tools.', color: 'var(--sage)' },
    { icon: <FiZap />, title: 'Instant Hiring', desc: 'Post a job and start receiving qualified applications within minutes.', color: 'var(--accent)' },
    { icon: <FiGlobe />, title: 'Global Talent Pool', desc: 'Access skilled professionals from around the world, across every domain.', color: 'var(--primary-light)' },
    { icon: <FiDollarSign />, title: 'Transparent Pricing', desc: 'No hidden fees. Clear hourly rates and project-based pricing for everyone.', color: 'var(--ocean-dark)' },
  ];

  const stats = [
    { value: '10K+', label: 'Freelancers', icon: <FiUsers />, desc: 'Skilled professionals worldwide' },
    { value: '5K+', label: 'Projects Completed', icon: <FiBriefcase />, desc: 'Delivered on time, every time' },
    { value: '98%', label: 'Satisfaction Rate', icon: <FiPercent />, desc: 'From verified client reviews' },
    { value: '$2M+', label: 'Paid to Freelancers', icon: <FiDollarSign />, desc: 'Secure earnings, guaranteed' },
  ];

  const testimonials = [
    { name: 'Sarah Mitchell', role: 'Full-Stack Developer', text: 'TalentLink transformed my career. I found consistent, high-quality projects and doubled my income within 6 months.', rating: 5, avatar: 'SM', color: 'var(--ocean)' },
    { name: 'James Chen', role: 'Startup Founder', text: 'Hiring top talent has never been easier. The skill-matching algorithm saved us countless hours in the recruitment process.', rating: 5, avatar: 'JC', color: 'var(--primary)' },
    { name: 'Priya Sharma', role: 'UI/UX Designer', text: 'The integrated project management tools make collaboration seamless. Best freelancing platform I\'ve ever used.', rating: 5, avatar: 'PS', color: 'var(--accent)' },
  ];

  const plans = [
    { name: 'Starter', price: 'Free', desc: 'Perfect for getting started', features: ['Up to 5 proposals/month', 'Basic profile', 'Standard support', 'Job alerts'], popular: false },
    { name: 'Professional', price: '$19', desc: 'For serious freelancers', features: ['Unlimited proposals', 'Featured profile', 'Priority support', 'Advanced analytics', 'Custom portfolio', 'Early access to jobs'], popular: true },
    { name: 'Business', price: '$49', desc: 'For teams and agencies', features: ['Everything in Pro', 'Team management', 'Bulk hiring tools', 'Dedicated account manager', 'API access', 'Custom branding'], popular: false },
  ];

  const faqs = [
    { q: 'How does TalentLink match freelancers with projects?', a: 'Our platform uses skill-based matching to connect freelancers with relevant projects. When a recruiter posts a job, freelancers with matching skills are notified and can apply instantly.' },
    { q: 'How are payments handled?', a: 'All payments are securely processed through our platform. Recruiters fund escrow accounts, and freelancers receive payments upon milestone completion or project delivery.' },
    { q: 'What types of freelancers can join?', a: 'We welcome all types of professionals — developers, designers, writers, marketers, consultants, and more. If you have a skill to offer, there\'s a place for you here.' },
    { q: 'Is there a fee for freelancers?', a: 'Signing up is completely free. Our Starter plan lets you send up to 5 proposals per month at no cost. Premium plans unlock additional features for power users.' },
    { q: 'Can I manage my team on TalentLink?', a: 'Yes! Our Business plan includes team management features, project tracking with task allocation, meeting scheduling, and real-time messaging.' },
  ];

  return (
    <div className="landing">
      {/* ─── Navbar ─── */}
      <nav className="landing-nav">
        <div className="landing-container nav-inner">
          <Link to="/" className="nav-logo">
            <div className="nav-logo-icon">TL</div>
            <span>TalentLink</span>
          </Link>
          <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-actions">
            {user ? (
              <div className="nav-user-area" ref={userMenuRef}>
                <button className="nav-user-pill" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <div className="nav-user-avatar">{userInitials}</div>
                  <span className="nav-user-name">{user.first_name || user.username}</span>
                  <FiChevronDown className={`nav-user-chevron ${userMenuOpen ? 'open' : ''}`} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      className="nav-user-dropdown"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="nav-dropdown-header">
                        <div className="nav-dropdown-avatar">{userInitials}</div>
                        <div>
                          <div className="nav-dropdown-name">{user.first_name} {user.last_name}</div>
                          <div className="nav-dropdown-role">{user.role === 'recruiter' ? 'Recruiter' : 'Freelancer'}</div>
                        </div>
                      </div>
                      <div className="nav-dropdown-divider" />
                      <Link to={dashboardPath} className="nav-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <FiLayout /> Go to Dashboard
                      </Link>
                      <button className="nav-dropdown-item danger" onClick={handleLogout}>
                        <FiLogOut /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className="nav-btn-ghost">Sign In</Link>
                <Link to="/register" className="nav-btn-primary">Get Started <FiArrowRight /></Link>
              </>
            )}
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div className="mobile-nav" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              {user ? (
                <>
                  <Link to={dashboardPath} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                  <button className="nav-btn-primary" style={{ background: 'none', color: '#EF4444', padding: '12px 0', textAlign: 'left', fontWeight: 700 }} onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  <Link to="/register" className="nav-btn-primary" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── Hero ─── */}
      <section className="hero">
        <div className="hero-bg-shapes">
          <div className="hero-shape shape-1"></div>
          <div className="hero-shape shape-2"></div>
          <div className="hero-shape shape-3"></div>
        </div>
        <div className="landing-container hero-inner">
          <motion.div className="hero-content" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="hero-badge">
              <FiZap /> #1 Freelancing Platform for Tech Talent
            </div>
            <h1>Find Top Talent.<br /><span className="gradient-text">Build Amazing Products.</span></h1>
            <p className="hero-subtitle">
              Connect with elite freelancers and forward-thinking companies. 
              Post jobs, manage projects, track progress, and handle payments — all in one powerful platform.
            </p>
            {!user ? (
              <div className="hero-cta">
                <Link to="/register" className="btn-hero-primary">
                  Start Hiring — It's Free <FiArrowRight />
                </Link>
                <Link to="/register" className="btn-hero-secondary">
                  Join as Freelancer
                </Link>
              </div>
            ) : (
              <div className="hero-cta">
                <Link to={dashboardPath} className="btn-hero-primary">
                  <FiLayout /> Go to Dashboard
                </Link>
              </div>
            )}
            <div className="hero-trust">
              <div className="trust-avatars">
                {['AM', 'BK', 'CL', 'DN'].map((initials, i) => (
                  <div key={i} className="trust-avatar" style={{ zIndex: 4 - i }}>{initials}</div>
                ))}
              </div>
              <p><strong>2,500+</strong> professionals joined this month</p>
            </div>
          </motion.div>
          <motion.div className="hero-visual" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <div className="hero-card-stack">
              <div className="hero-card card-1">
                <div className="hc-header">
                  <div className="hc-avatar">RS</div>
                  <div><div className="hc-name">React Developer</div><div className="hc-meta">$85/hr · 5 years exp</div></div>
                </div>
                <div className="hc-skills">
                  {['React', 'Node.js', 'TypeScript'].map(s => <span key={s} className="hc-skill">{s}</span>)}
                </div>
                <div className="hc-rating"><FiStar className="star-filled" /> 4.9 <span>(128 reviews)</span></div>
              </div>
              <div className="hero-card card-2">
                <div className="hc-header">
                  <div className="hc-avatar" style={{ background: 'var(--gradient-accent)' }}>UX</div>
                  <div><div className="hc-name">UI/UX Designer</div><div className="hc-meta">$70/hr · 4 years exp</div></div>
                </div>
                <div className="hc-skills">
                  {['Figma', 'Sketch', 'Prototyping'].map(s => <span key={s} className="hc-skill">{s}</span>)}
                </div>
                <div className="hc-rating"><FiStar className="star-filled" /> 4.8 <span>(96 reviews)</span></div>
              </div>
              <div className="hero-card card-3">
                <div className="hc-mini-stat">
                  <div className="hc-stat-value">+127%</div>
                  <div className="hc-stat-label">Hiring Growth</div>
                  <div className="hc-mini-chart">
                    {[30, 45, 35, 60, 50, 80, 70, 95].map((h, i) => (
                      <div key={i} className="hc-bar" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Banner ─── */}
      <section className="stats-banner">
        <div className="landing-container">
          <div className="stats-inner">
            {stats.map((stat, i) => (
              <motion.div key={i} className="stat-item" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="stat-icon-wrap">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-desc">{stat.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="features-section">
        <div className="landing-container">
          <motion.div className="section-heading" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="section-tag">Features</span>
            <h2>Everything you need to <span className="gradient-text">succeed</span></h2>
            <p>Powerful tools designed for modern freelancers and recruiters.</p>
          </motion.div>
          <div className="features-grid">
            {features.map((f, i) => (
              <motion.div key={i} className="feature-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="feature-icon" style={{ backgroundColor: `${f.color}15`, color: f.color }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="how-section">
        <div className="landing-container">
          <motion.div className="section-heading" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="section-tag">How It Works</span>
            <h2>Get started in <span className="gradient-text">3 simple steps</span></h2>
            <p>Whether you're a freelancer or recruiter, we make it effortless.</p>
          </motion.div>
          <div className="steps-grid">
            {[
              { step: '01', icon: <FiUserCheck />, title: 'Create Your Profile', desc: 'Sign up, showcase your skills or post your requirements. Our platform helps you stand out from the crowd.', color: 'var(--ocean)' },
              { step: '02', icon: <FiZap />, title: 'Connect & Collaborate', desc: 'Get matched with the right people. Use built-in tools for messaging, task management, and meetings.', color: 'var(--primary)' },
              { step: '03', icon: <FiShield />, title: 'Get Paid Securely', desc: 'Complete milestones and receive payments through our secure escrow system. Simple and transparent.', color: 'var(--accent)' },
            ].map((s, i) => (
              <motion.div key={i} className="step-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div className="step-top">
                  <div className="step-icon-wrap" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
                  <div className="step-number">{s.step}</div>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < 2 && <div className="step-connector"><FiArrowRight /></div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="testimonials-section">
        <div className="landing-container">
          <motion.div className="section-heading" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="section-tag">Testimonials</span>
            <h2>Loved by <span className="gradient-text">thousands</span></h2>
            <p>Hear from the professionals who've transformed their careers with us.</p>
          </motion.div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <motion.div key={i} className="testimonial-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="testimonial-quote">❝</div>
                <div className="testimonial-stars">
                  {[...Array(t.rating)].map((_, j) => <FiStar key={j} className="star-filled" />)}
                </div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="pricing-section">
        <div className="landing-container">
          <motion.div className="section-heading" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="section-tag">Pricing</span>
            <h2>Plans that <span className="gradient-text">scale with you</span></h2>
            <p>Start free and upgrade as your business grows.</p>
          </motion.div>
          <div className="pricing-grid">
            {plans.map((plan, i) => (
              <motion.div key={i} className={`pricing-card ${plan.popular ? 'popular' : ''}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                <h3>{plan.name}</h3>
                <div className="pricing-amount">
                  <span className="price">{plan.price}</span>
                  {plan.price !== 'Free' && <span className="period">/month</span>}
                </div>
                <p className="pricing-desc">{plan.desc}</p>
                <ul className="pricing-features">
                  {plan.features.map((f, j) => (
                    <li key={j}><FiCheck className="check-icon" /> {f}</li>
                  ))}
                </ul>
                <Link to="/register" className={`pricing-btn ${plan.popular ? 'primary' : 'secondary'}`}>
                  {plan.price === 'Free' ? 'Get Started Free' : 'Start Free Trial'}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="faq-section">
        <div className="landing-container">
          <motion.div className="section-heading" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="section-tag">FAQ</span>
            <h2>Frequently asked <span className="gradient-text">questions</span></h2>
          </motion.div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <motion.div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  {openFaq === i ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div className="faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <p>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="cta-section">
        <div className="landing-container">
          <motion.div className="cta-card" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2>Ready to take your career<br />to the <span className="gradient-text">next level</span>?</h2>
            <p>Join thousands of professionals already growing with TalentLink.</p>
            <div className="cta-buttons">
              {user ? (
                <Link to={dashboardPath} className="btn-hero-primary"><FiLayout /> Go to Dashboard</Link>
              ) : (
                <>
                  <Link to="/register" className="btn-hero-primary">Get Started Free <FiArrowRight /></Link>
                  <Link to="/login" className="btn-hero-secondary">Sign In</Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div className="footer-brand">
            <Link to="/" className="nav-logo" style={{ marginBottom: 20 }}>
              <div className="nav-logo-icon">TL</div>
              <span>TalentLink</span>
            </Link>
            <p>The modern platform where top freelancers and forward-thinking companies connect, collaborate, and grow together.</p>
            <div className="footer-socials">
              <a href="#" aria-label="Twitter"><FiTwitter /></a>
              <a href="#" aria-label="LinkedIn"><FiLinkedin /></a>
              <a href="#" aria-label="GitHub"><FiGithub /></a>
              <a href="#" aria-label="Email"><FiMail /></a>
            </div>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#features">About Us</a>
              <a href="#features">Careers</a>
              <a href="#features">Blog</a>
              <a href="#features">Contact</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#features">Privacy Policy</a>
              <a href="#features">Terms of Service</a>
              <a href="#features">Cookie Policy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="landing-container footer-bottom-inner">
            <p>© 2026 TalentLink. All rights reserved.</p>
            <p style={{ color: '#475569', fontSize: '0.9rem' }}>Built with ♥ for the future of work</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
