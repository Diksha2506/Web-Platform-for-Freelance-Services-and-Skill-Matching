import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff, FiUserPlus, FiUser, FiMail, FiLock, FiPhone } from 'react-icons/fi';
import { LuBriefcase, LuCode } from 'react-icons/lu';
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
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-form-wrapper">
          <div className="auth-logo">
            <div className="logo-icon">TL</div>
            <h1>TalentLink</h1>
          </div>

          <h2>Create Account</h2>
          <p className="subtitle">
            Step {step} of 2 — {step === 1 ? 'Choose your role' : 'Account details'}
          </p>

          {/* Progress indicator */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
            {[1, 2].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1, height: '4px', borderRadius: '2px',
                  background: s <= step ? 'linear-gradient(135deg, #2EC4B6, #25A99D)' : '#E5E7EB',
                  transition: 'all 0.4s ease',
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
                transition={{ duration: 0.3 }}
              >
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.875rem', fontWeight: 500, color: '#6B7280' }}>
                  I want to...
                </label>
                <div className="role-selector">
                  <motion.div
                    className={`role-option ${formData.role === 'freelancer' ? 'active' : ''}`}
                    onClick={() => { setFormData({ ...formData, role: 'freelancer' }); setErrors({ ...errors, role: '' }); }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="role-icon"><LuCode /></div>
                    <div className="role-label">Find Work</div>
                    <div className="role-desc">I'm a freelancer</div>
                  </motion.div>
                  <motion.div
                    className={`role-option ${formData.role === 'recruiter' ? 'active' : ''}`}
                    onClick={() => { setFormData({ ...formData, role: 'recruiter' }); setErrors({ ...errors, role: '' }); }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="role-icon"><LuBriefcase /></div>
                    <div className="role-label">Hire Talent</div>
                    <div className="role-desc">I'm a recruiter</div>
                  </motion.div>
                </div>
                {errors.role && <span className="form-error">{errors.role}</span>}

                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <div className="input-icon-wrapper">
                      <FiUser className="input-icon" />
                      <input
                        type="text"
                        name="first_name"
                        placeholder="John"
                        value={formData.first_name}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.first_name && <span className="form-error">{errors.first_name}</span>}
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <div className="input-icon-wrapper">
                      <FiUser className="input-icon" />
                      <input
                        type="text"
                        name="last_name"
                        placeholder="Doe"
                        value={formData.last_name}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.last_name && <span className="form-error">{errors.last_name}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone (Optional)</label>
                  <div className="input-icon-wrapper">
                    <FiPhone className="input-icon" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+1 234 567 890"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <motion.button
                  type="button"
                  className="btn-primary"
                  onClick={nextStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue →
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
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
              >
                <div className="form-group">
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
                    />
                  </div>
                  {errors.username && <span className="form-error">{errors.username}</span>}
                </div>

                <div className="form-group">
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
                    />
                  </div>
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
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
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <div className="form-group">
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
                    />
                  </div>
                  {errors.password2 && <span className="form-error">{errors.password2}</span>}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setStep(1)}
                    style={{ flex: '0 0 auto' }}
                  >
                    ← Back
                  </button>
                  <motion.button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {loading ? (
                      <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
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

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
