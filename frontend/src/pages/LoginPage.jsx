import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiLogIn, FiUser, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.username) {
      setErrors({ username: 'Username is required' });
      return;
    }
    if (!formData.password) {
      setErrors({ password: 'Password is required' });
      return;
    }

    setLoading(true);
    try {
      const data = await login(formData);
      toast.success(`Welcome back, ${data.user.first_name || data.user.username}!`);
      navigate(data.user.role === 'freelancer' ? '/freelancer' : '/recruiter');
    } catch (err) {
      const errorMsg = err.response?.data?.non_field_errors?.[0] || 
                       err.response?.data?.detail || 
                       'Invalid credentials. Please try again.';
      toast.error(errorMsg);
      setErrors({ general: errorMsg });
    } finally {
      setLoading(false);
    }
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
            <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Welcome back</h2>
            <p className="subtitle" style={{ fontSize: '1rem', marginBottom: '40px' }}>Sign in to your account to continue</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Username</label>
                <div className="input-icon-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="username"
                    style={{ height: '56px' }}
                  />
                </div>
                {errors.username && <span className="form-error">{errors.username}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Password</label>
                <div className="input-icon-wrapper password-input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    style={{ height: '56px' }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <motion.button
                type="submit"
                className="btn-primary"
                disabled={loading}
                whileHover={{ scale: 1.01, translateY: -2 }}
                whileTap={{ scale: 0.99 }}
                style={{ 
                  height: '56px', 
                  fontSize: '1rem', 
                  marginTop: '12px',
                  boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
                }}
              >
                {loading ? (
                  <div className="spinner" style={{ width: 22, height: 22, borderTopColor: 'transparent' }}></div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <FiLogIn /> <span>Sign In to Account</span>
                  </div>
                )}
              </motion.button>
            </form>

            <div className="auth-footer" style={{ marginTop: '32px', fontSize: '1rem' }}>
              Don't have an account? <Link to="/register" style={{ fontWeight: 700 }}>Create one now</Link>
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
             <FiBriefcase style={{ color: 'white', opacity: 0.9 }} />
          </div>
          <h2>Elevate Your Career with TalentLink</h2>
          <p>
            Connect with top-tier companies and work on projects that matter. 
            Join 10,000+ professionals growing their careers today.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
