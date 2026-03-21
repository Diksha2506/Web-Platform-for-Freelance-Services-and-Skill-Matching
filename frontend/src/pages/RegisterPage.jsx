import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff, FiUserPlus, FiUser, FiMail, FiLock, FiPhone } from 'react-icons/fi';
import { LuBriefcase, LuCode, LuSparkles } from 'react-icons/lu';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', role: '', phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.role) newErrors.role = 'Please select a role';
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Min 8 characters';
    if (formData.password !== formData.password2) newErrors.password2 = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const data = await register(formData);
      toast.success('Account created successfully! 🎉');
      navigate(data.user.role === 'freelancer' ? '/freelancer' : '/recruiter');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        const msgs = [];
        Object.entries(errorData).forEach(([key, value]) => {
          if (Array.isArray(value)) msgs.push(value[0]);
          else if (typeof value === 'object') Object.values(value).forEach(v => msgs.push(v));
          else msgs.push(value);
        });
        toast.error(msgs[0] || 'Registration failed');
        setErrors(errorData);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? 200 : -200, opacity: 0 }),
  };

  return (
    <div className="auth-container">
      <div className="bg-shapes">
        <div className="bg-shape"></div>
        <div className="bg-shape"></div>
        <div className="bg-shape"></div>
      </div>

      <motion.div 
        className="auth-left"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-form-wrapper">
          <Link to="/" className="auth-logo">
            <div className="logo-icon">TL</div>
            <h1>TalentLink</h1>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Create Account</h2>
            <p className="subtitle" style={{ fontSize: '1rem', marginBottom: '24px' }}>
              Step {step} of 2 — {step === 1 ? 'Choose your role' : 'Account details'}
            </p>

            {/* Progress indicator */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
              {[1, 2].map((s) => (
                <div
                  key={s}
                  style={{
                    flex: 1, height: '6px', borderRadius: '3px',
                    background: s <= step ? 'var(--gradient-primary)' : '#E2E8F0',
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait" custom={step}>
              {step === 1 ? (
                <motion.div
                  key="step1"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                  <label style={{ display: 'block', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    I want to...
                  </label>
                  <div className="role-selector" style={{ marginBottom: '32px' }}>
                    <motion.div
                      className={`role-option ${formData.role === 'freelancer' ? 'active' : ''}`}
                      onClick={() => { setFormData({ ...formData, role: 'freelancer' }); setErrors({ ...errors, role: '' }); }}
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ padding: '24px' }}
                    >
                      <div className="role-icon" style={{ fontSize: '2.5rem' }}><LuCode /></div>
                      <div className="role-label" style={{ fontSize: '1.1rem' }}>Find Work</div>
                      <div className="role-desc">I'm a freelancer</div>
                    </motion.div>
                    <motion.div
                      className={`role-option ${formData.role === 'recruiter' ? 'active' : ''}`}
                      onClick={() => { setFormData({ ...formData, role: 'recruiter' }); setErrors({ ...errors, role: '' }); }}
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ padding: '24px' }}
                    >
                      <div className="role-icon" style={{ fontSize: '2.5rem' }}><LuBriefcase /></div>
                      <div className="role-label" style={{ fontSize: '1.1rem' }}>Hire Talent</div>
                      <div className="role-desc">I'm a recruiter</div>
                    </motion.div>
                  </div>
                  {errors.role && <span className="form-error" style={{ display: 'block', marginBottom: '16px' }}>{errors.role}</span>}

                  <div className="form-row" style={{ gap: '24px', marginBottom: '24px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>First Name</label>
                      <div className="input-icon-wrapper">
                        <FiUser className="input-icon" />
                        <input
                          type="text"
                          name="first_name"
                          placeholder="John"
                          value={formData.first_name}
                          onChange={handleChange}
                          style={{ height: '56px' }}
                        />
                      </div>
                      {errors.first_name && <span className="form-error">{errors.first_name}</span>}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Last Name</label>
                      <div className="input-icon-wrapper">
                        <FiUser className="input-icon" />
                        <input
                          type="text"
                          name="last_name"
                          placeholder="Doe"
                          value={formData.last_name}
                          onChange={handleChange}
                          style={{ height: '56px' }}
                        />
                      </div>
                      {errors.last_name && <span className="form-error">{errors.last_name}</span>}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '32px' }}>
                    <label>Phone (Optional)</label>
                    <div className="input-icon-wrapper">
                      <FiPhone className="input-icon" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+1 234 567 890"
                        value={formData.phone}
                        onChange={handleChange}
                        style={{ height: '56px' }}
                      />
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    className="btn-primary"
                    onClick={nextStep}
                    whileHover={{ scale: 1.01, translateY: -2 }}
                    whileTap={{ scale: 0.99 }}
                    style={{ height: '56px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    Continue to Details <FiLogIn />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.form
                  key="step2"
                  custom={2}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  onSubmit={handleSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Username</label>
                    <div className="input-icon-wrapper">
                      <FiUser className="input-icon" />
                      <input
                        type="text"
                        name="username"
                        placeholder="johndoe"
                        value={formData.username}
                        onChange={handleChange}
                        autoComplete="username"
                        style={{ height: '56px' }}
                      />
                    </div>
                    {errors.username && <span className="form-error">{errors.username}</span>}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Email Address</label>
                    <div className="input-icon-wrapper">
                      <FiMail className="input-icon" />
                      <input
                        type="email"
                        name="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                        style={{ height: '56px' }}
                      />
                    </div>
                    {errors.email && <span className="form-error">{errors.email}</span>}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Password</label>
                    <div className="input-icon-wrapper password-input-wrapper">
                      <FiLock className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Min 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        style={{ height: '56px' }}
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {errors.password && <span className="form-error">{errors.password}</span>}
                  </div>

                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label>Confirm Password</label>
                    <div className="input-icon-wrapper">
                      <FiLock className="input-icon" />
                      <input
                        type="password"
                        name="password2"
                        placeholder="Repeat your password"
                        value={formData.password2}
                        onChange={handleChange}
                        autoComplete="new-password"
                        style={{ height: '56px' }}
                      />
                    </div>
                    {errors.password2 && <span className="form-error">{errors.password2}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setStep(1)}
                      style={{ height: '56px', padding: '0 24px' }}
                    >
                      ←
                    </button>
                    <motion.button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      whileHover={{ scale: 1.01, translateY: -2 }}
                      whileTap={{ scale: 0.99 }}
                      style={{ flex: 1, height: '56px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}
                    >
                      {loading ? (
                        <div className="spinner" style={{ width: 22, height: 22, borderTopColor: 'transparent' }}></div>
                      ) : (
                        <>
                          <FiUserPlus /> Create Account
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="auth-footer" style={{ marginTop: '32px', fontSize: '1rem' }}>
              Already have an account? <Link to="/login" style={{ fontWeight: 700 }}>Sign in here</Link>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="auth-right">
        <motion.div 
          className="auth-right-content"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="auth-illustration">
             <LuSparkles style={{ color: 'white', opacity: 0.9 }} />
          </div>
          <h2>Join the Future of Work</h2>
          <p>
            Whether you're looking for your next big project or hiring the best talent, 
            TalentLink is the platform where opportunities meet expertise.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
