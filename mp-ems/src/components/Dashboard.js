import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import ActivityTable from "../components/ActivityTable";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale);

const Dashboard = () => {
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

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Header title="Controller Dashboard" />

        <div className="stats-grid">
          <StatCard title="Total Students" value="1250" />
          <StatCard title="Active Exams" value="3" />
          <StatCard title="Pending Marks" value="145" />
          <StatCard title="Pending Results" value="2" />
          <StatCard title="UFM Cases" value="4" />
          <StatCard title="Total Collection" value="₹24,50,000" />
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