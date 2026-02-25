import React, { useState, useEffect } from 'react';


const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
        if (data.length > 0) {
          setFormData(prev => ({
            ...prev,
            role: data[0].role_name
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setRolesLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Registration failed');
        return;
      }

      setMessage(data.message);
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student'
      });
      setErrors({});

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      setMessage('Registration failed. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left side - Blue section with registration benefits */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '50px',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>Student Management System</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px', opacity: 0.9 }}>
            Efficiently Manage Your Academic Journey
          </p>

          {/* Features */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>✨ Key Features</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '10px' }}>📚 Track Academic Progress</li>
              <li style={{ marginBottom: '10px' }}>📊 View Detailed Performance Analytics</li>
              <li style={{ marginBottom: '10px' }}>📧 Receive Important Updates</li>
            </ul>
          </div>

          {/* Benefits */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>🎯 Registration Benefits</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '10px' }}>✓ Easy Access to All Resources</li>
              <li style={{ marginBottom: '10px' }}>✓ Personalized Learning Dashboard</li>
              <li style={{ marginBottom: '10px' }}>✓ Direct Communication with Instructors</li>
            </ul>
          </div>

          {/* Getting Started */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>🚀 Getting Started</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '10px' }}>• Complete your profile setup</li>
              <li style={{ marginBottom: '10px' }}>• Join your class or role group</li>
              <li style={{ marginBottom: '10px' }}>• Start exploring course materials</li>
            </ul>
          </div>

          {/* Stats */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            padding: '20px 0',
            marginBottom: '30px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>1000+</div>
              <div style={{ opacity: 0.8 }}>Students</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>100+</div>
              <div style={{ opacity: 0.8 }}>Courses</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>24/7</div>
              <div style={{ opacity: 0.8 }}>Support</div>
            </div>
          </div>

          {/* Testimonial */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <p style={{ fontStyle: 'italic', marginBottom: '10px' }}>
              "The student management system has made tracking my progress incredibly easy. 
              All my academic information is organized and always accessible."
            </p>
            <p style={{ textAlign: 'right', opacity: 0.8 }}>
              - Alex Kumar, Engineering Student
            </p>
          </div>
        </div>
      </div>

      {/* Right side - White registration form */}
      <div style={{
        width: '450px',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 40px',
        boxShadow: '-5px 0 20px rgba(0,0,0,0.1)',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', color: '#333', marginBottom: '10px' }}>Create Account</h2>
          <p style={{ color: '#666' }}>Join our educational community</p>
        </div>

        {message && (
          <div style={{
            padding: '12px 15px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            background: message.includes('successful') ? '#d4edda' : '#f8d7da',
            color: message.includes('successful') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('successful') ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: '#333',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              style={{
                width: '100%',
                padding: '12px 15px',
                border: errors.name ? '2px solid #dc3545' : '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s',
                backgroundColor: errors.name ? '#fff5f5' : 'white'
              }}
              onFocus={(e) => !errors.name && (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => !errors.name && (e.target.style.borderColor = '#e0e0e0')}
            />
            {errors.name && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', display: 'block' }}>{errors.name}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: '#333',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '12px 15px',
                border: errors.email ? '2px solid #dc3545' : '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s',
                backgroundColor: errors.email ? '#fff5f5' : 'white'
              }}
              onFocus={(e) => !errors.email && (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => !errors.email && (e.target.style.borderColor = '#e0e0e0')}
            />
            {errors.email && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', display: 'block' }}>{errors.email}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: '#333',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  paddingRight: '45px',
                  border: errors.password ? '2px solid #dc3545' : '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s',
                  backgroundColor: errors.password ? '#fff5f5' : 'white',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => !errors.password && (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => !errors.password && (e.target.style.borderColor = '#e0e0e0')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#667eea',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', display: 'block' }}>{errors.password}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: '#333',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  paddingRight: '45px',
                  border: errors.confirmPassword ? '2px solid #dc3545' : '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s',
                  backgroundColor: errors.confirmPassword ? '#fff5f5' : 'white',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => !errors.confirmPassword && (e.target.style.borderColor = '#667eea')}
                onBlur={(e) => !errors.confirmPassword && (e.target.style.borderColor = '#e0e0e0')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#667eea',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', display: 'block' }}>{errors.confirmPassword}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: '#333',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={rolesLoading}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s',
                backgroundColor: rolesLoading ? '#f5f5f5' : 'white'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#667eea')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.role_name}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s',
              marginBottom: '20px'
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '2px solid #f0f0f0'
        }}>
          <p style={{ color: '#666', marginBottom: '10px' }}>Already have an account?</p>
          <a href="/" style={{
            display: 'inline-block',
            background: 'transparent',
            border: '2px solid #667eea',
            color: '#667eea',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#667eea';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#667eea';
          }}>
            Login here
          </a>
        </div>
      </div>
    </div>
  );
};

export default Register;