import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import ActivityTable from "../components/ActivityTable";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from "chart.js";
import { useState, useEffect } from "react";

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8080/api/dashboard/stats");
        
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

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="main-content">
          <Header title="Controller Dashboard" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="main-content">
          <Header title="Controller Dashboard" />
          <p style={{ color: "red" }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Header title="Controller Dashboard" />

        <div className="stats-grid">
          <StatCard title="Total Users" value={stats.totalUsers.toString()} />
          <StatCard title="Active Exams" value={stats.activeExams.toString()} />
          <StatCard title="Total Programs" value={stats.totalPrograms.toString()} />
          <StatCard title="Total Semesters" value={stats.totalSemesters.toString()} />
          <StatCard title="Total Subjects" value={stats.totalSubjects.toString()} />
          <StatCard title="Academic Years" value={stats.totalAcademicYears.toString()} />
        </div>

        <div className="chart-box">
          <h3>Monthly Fee Collection</h3>
          <Bar data={chartData} />
        </div>

        <ActivityTable />
      </div>
    </div>
  );
};

export default Dashboard;