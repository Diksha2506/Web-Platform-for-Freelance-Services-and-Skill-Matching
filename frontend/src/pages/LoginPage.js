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
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="auth-form-wrapper">
          <div className="auth-logo">
            <div className="logo-icon">TL</div>
            <h1>TalentLink</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2>Welcome back</h2>
            <p className="subtitle">Sign in to your account to continue</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
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
                  />
                </div>
                {errors.username && <span className="form-error">{errors.username}</span>}
              </div>

              <div className="form-group">
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? (
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                ) : (
                  <>
                    <FiLogIn /> Sign In
                  </>
                )}
              </motion.button>
            </form>

            <div className="auth-footer">
              Don't have an account? <Link to="/register">Create one</Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
