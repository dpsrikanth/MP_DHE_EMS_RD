import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import authUtils from "../utils/authUtils";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "",rememberMe: false });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(window["config"].login_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log(data,"daaaaaaaaa",data.token)

      if (response.ok) {
        // Store token and role information using auth utility
        authUtils.setAuth(data.token, data.user.role || "", data.user.id || "");
        
        // Check if user is admin
        if (authUtils.isAdmin()) {
          navigate("/dashboard");
        } else {
          alert("Access denied. Admin role required.");
          authUtils.logout();
        }
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left side - Blue section with exam content */}
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
          <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>Examination Portal</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px', opacity: 0.9 }}>
            Your Gateway to Academic Excellence
          </p>

          {/* Upcoming Exams */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>📅 Upcoming Exams</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '10px' }}>📝 Mid-Term Exams - March 15, 2024</li>
              <li style={{ marginBottom: '10px' }}>🔬 Practical Assessments - March 20, 2024</li>
              <li style={{ marginBottom: '10px' }}>📚 Final Term - April 10, 2024</li>
            </ul>
          </div>

          {/* Recent Results */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>📊 Recent Results</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '10px' }}>✓ Mathematics - Results Published</li>
              <li style={{ marginBottom: '10px' }}>✓ Physics - Results Published</li>
              <li style={{ marginBottom: '10px' }}>⏳ Computer Science - Coming Soon</li>
            </ul>
          </div>

          {/* Announcements */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>📢 Announcements</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '10px' }}>• Hall tickets available for download</li>
              <li style={{ marginBottom: '10px' }}>• Exam schedule updated</li>
              <li style={{ marginBottom: '10px' }}>• Online exam guidelines released</li>
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
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>500+</div>
              <div style={{ opacity: 0.8 }}>Students</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>50+</div>
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
              "The examination portal has made giving exams so convenient. 
              The results are always on time and the interface is user-friendly."
            </p>
            <p style={{ textAlign: 'right', opacity: 0.8 }}>
              - Sarah Johnson, Computer Science Student
            </p>
          </div>
        </div>
      </div>

      {/* Right side - White login form */}
      <div style={{
        width: '450px',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        // justifyContent: 'center',
        padding: '60px 40px',
        justifyContent: 'flex-start',
// paddingTop: '80px',
        boxShadow: '-5px 0 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', color: '#333', marginBottom: '10px' }}>Welcome Back!</h2>
          <p style={{ color: '#666' }}>Please login to your account</p>
        </div>

        <form onSubmit={handleLogin}>
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
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
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
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666' }}>
            <input
  type="checkbox"
  checked={formData.rememberMe}
  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
/>
<label>Remember Me</label>
            </label>
            <a href="/forgot-password" style={{ color: '#667eea', textDecoration: 'none' }}>
              Forgot Password?
            </a>
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '2px solid #f0f0f0'
        }}>
          <p style={{ color: '#666', marginBottom: '10px' }}>New to Examination Portal?</p>
          <button
            onClick={() => navigate("/register")}
            style={{
              background: 'transparent',
              border: '2px solid #667eea',
              color: '#667eea',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#667eea';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#667eea';
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;