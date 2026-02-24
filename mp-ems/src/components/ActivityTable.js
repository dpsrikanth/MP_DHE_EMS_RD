const ActivityTable = () => {
  const activities = [
    { id: 1, activity: "Internal Marks Submitted", date: "02 Feb 2026" },
    { id: 2, activity: "External Evaluation Completed", date: "03 Feb 2026" },
    { id: 3, activity: "Result Published - B.Sc Sem 3", date: "05 Feb 2026" },
    { id: 4, activity: "UFM Case Registered", date: "06 Feb 2026" },
  ];

  return (
    <div className="activity-box">
      <h3>Recent Activities</h3>
      <table>
        <thead>
          <tr>
            <th>Activity</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((item) => (
            <tr key={item.id}>
              <td>{item.activity}</td>
              <td>{item.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityTable;