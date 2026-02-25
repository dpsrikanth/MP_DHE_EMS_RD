import StatCard from "../components/StatCard";
import ActivityTable from "../components/ActivityTable";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from "chart.js";
import { useState, useEffect } from "react";
import authUtils from "../utils/authUtils";
import "./Dashboard.css";

ChartJS.register(BarElement, CategoryScale, LinearScale);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeExams: 0,
    totalPrograms: 0,
    totalSemesters: 0,
    totalSubjects: 0,
    totalAcademicYears: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [programsCount, setProgramsCount] = useState(0);
  const [examsCount, setExamsCount] = useState(0);
  const [collegesCount, setCollegesCount] = useState(0);
  const [universitiesCount, setUniversitiesCount] = useState(0);
  const [semestersCount, setSemestersCount] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = authUtils.getAuth().token;
        
        const response = await fetch("http://localhost:8080/api/dashboard/stats", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }

        const data = await response.json();
        setStats({
          totalUsers: data.totalUsers || 0,
          activeExams: data.activeExams || 0,
          totalPrograms: data.totalPrograms || 0,
          totalSemesters: data.totalSemesters || 0,
          totalSubjects: data.totalSubjects || 0,
          totalAcademicYears: data.totalAcademicYears || 0,
        });

        // populate quick counts (prefer stats when provided)
        setProgramsCount(data.totalPrograms || 0);
        setExamsCount(data.activeExams || 0);
        setSemestersCount(data.totalSemesters || 0);
        setSubjectsCount(data.totalSubjects || 0);

        // load teachers and students for overview panels
        try {
          const tRes = await fetch("http://localhost:8080/api/teachers", { headers: { Authorization: `Bearer ${token}` } });
          if (tRes.ok) setTeachers(await tRes.json());
        } catch (e) {
          console.warn('Failed to load teachers', e.message);
        }
        try {
          const sRes = await fetch("http://localhost:8080/api/students", { headers: { Authorization: `Bearer ${token}` } });
          if (sRes.ok) setStudents(await sRes.json());
        } catch (e) {
          console.warn('Failed to load students', e.message);
        }

        // fetch colleges and universities counts (endpoints return arrays)
        try {
          const cRes = await fetch("http://localhost:8080/api/colleges", { headers: { Authorization: `Bearer ${token}` } });
          if (cRes.ok) {
            const cs = await cRes.json();
            setCollegesCount(Array.isArray(cs) ? cs.length : 0);
          }
        } catch (e) {
          console.warn('Failed to load colleges', e.message);
        }
        try {
          const uRes = await fetch("http://localhost:8080/api/universities", { headers: { Authorization: `Bearer ${token}` } });
          if (uRes.ok) {
            const us = await uRes.json();
            setUniversitiesCount(Array.isArray(us) ? us.length : 0);
          }
        } catch (e) {
          console.warn('Failed to load universities', e.message);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Fee Collection",
        data: [200000, 300000, 250000, 400000, 350000],
        backgroundColor: "#4f46e5",
      },
    ],
  };

  if (loading) return <p>Loading dashboard data...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  // students by grade (simple distribution)
  const gradeLabels = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"];
  const totalStudents = students.length || stats.totalUsers || 0;
  const gradeCounts = gradeLabels.map((_, i) => Math.floor(totalStudents / gradeLabels.length) + (i < (totalStudents % gradeLabels.length) ? 1 : 0));

  return (
    <div className="dashboard-root">
      <div className="top-cards">
        <div className="small-card">
          <div className="small-icon">👩‍🏫</div>
          <div>
            <div className="small-label">TOTAL TEACHERS</div>
            <div className="small-value">{teachers.length}</div>
          </div>
        </div>
        <div className="small-card">
          <div className="small-icon">👨‍🎓</div>
          <div>
            <div className="small-label">TOTAL STUDENTS</div>
            <div className="small-value">{totalStudents}</div>
          </div>
        </div>
        <div className="small-card">
          <div className="small-icon">🏛️</div>
          <div>
            <div className="small-label">PROGRAMS</div>
            <div className="small-value">{programsCount}</div>
          </div>
        </div>
        <div className="small-card">
          <div className="small-icon">📝</div>
          <div>
            <div className="small-label">EXAMS</div>
            <div className="small-value">{examsCount}</div>
          </div>
        </div>
        <div className="small-card">
          <div className="small-icon">🏫</div>
          <div>
            <div className="small-label">COLLEGES</div>
            <div className="small-value">{collegesCount}</div>
          </div>
        </div>
        <div className="small-card">
          <div className="small-icon">🎓</div>
          <div>
            <div className="small-label">UNIVERSITIES</div>
            <div className="small-value">{universitiesCount}</div>
          </div>
        </div>
        <div className="small-card">
          <div className="small-icon">📚</div>
          <div>
            <div className="small-label">SEMESTERS</div>
            <div className="small-value">{semestersCount}</div>
          </div>
        </div>
        <div className="small-card">
          <div className="small-icon">📘</div>
          <div>
            <div className="small-label">SUBJECTS</div>
            <div className="small-value">{subjectsCount}</div>
          </div>
        </div>
        {/* <div className="small-card">
          <div className="small-icon">🎯</div>
          <div>
            <div className="small-label">TOTAL GOALS</div>
            <div className="small-value">0</div>
          </div>
        </div>
        <div className="small-card">
          <div className="small-icon">📊</div>
          <div>
            <div className="small-label">ACTIVE GOALS</div>
            <div className="small-value">0</div>
          </div>
        </div> */}
      </div>

      <div className="overview-grid">
        <div className="panel-left">
          <div className="panel-box">
            <h4>Students by Grade Level</h4>
            <div className="grade-list">
              {gradeLabels.map((label, idx) => {
                const count = gradeCounts[idx];
                const pct = totalStudents ? Math.round((count / Math.max(1, totalStudents)) * 100) : 0;
                return (
                  <div className="grade-row" key={label}>
                    <div className="grade-name">{label}</div>
                    <div className="grade-bar-container">
                      <div className="grade-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="grade-count">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="panel-right">
          <div className="panel-box">
            <h4>Teacher Overview</h4>
            <div className="teacher-overview">
              {teachers.length === 0 && <div className="empty">No teachers found</div>}
              {teachers.map((t) => (
                <div className="teacher-item" key={t.id}>
                  <div className="avatar">{(t.teacher_name || t.name || 'U').charAt(0)}</div>
                  <div className="teacher-info">
                    <div className="t-name">{t.teacher_name || t.name || 'Unknown'}</div>
                    <div className="t-email">{t.email || ''}</div>
                  </div>
                  {/* <div className="t-stats">
                    <div className="t-stat">0<span>students</span></div>
                    <div className="t-stat">0<span>goals</span></div>
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* <div className="bottom-section">
        <div className="chart-box">
          <h3>Monthly Fee Collection</h3>
          <Bar data={chartData} />
        </div>
        <ActivityTable />
      </div> */}
    </div>
  );
};

export default Dashboard;