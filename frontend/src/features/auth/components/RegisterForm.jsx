import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // Validate password strength (must match backend requirements)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      alert('Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName
    });

    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img
          src="/pingrid-logo.png"
          alt="PinGrid"
          style={styles.logo}
        />

        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join PinGrid and organize your bookmarks</p>

        {error && (
          <div style={styles.errorBox}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter password"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.linkText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
    padding: '20px'
  },
  card: {
    background: '#1e1e2e',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
    border: '1px solid #2d2d3f'
  },
  logo: {
    maxWidth: '200px',
    height: 'auto',
    display: 'block',
    margin: '0 auto 30px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#e4e4e7',
    textAlign: 'center',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: '30px'
  },
  errorBox: {
    background: '#3d1f1f',
    border: '2px solid #5c2d2d',
    color: '#ef4444',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '0.9rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#e4e4e7'
  },
  input: {
    padding: '12px',
    border: '2px solid #2d2d3f',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.3s',
    outline: 'none',
    backgroundColor: '#252540',
    color: '#e4e4e7'
  },
  button: {
    background: '#667eea',
    color: 'white',
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '10px'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  linkText: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#a1a1aa',
    fontSize: '0.9rem'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600'
  }
};
