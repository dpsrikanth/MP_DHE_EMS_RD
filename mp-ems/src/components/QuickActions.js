import React, { useState } from 'react';

const QuickActions = ({ stats }) => {
  const [expandedAction, setExpandedAction] = useState(null);
  const [expandedData, setExpandedData] = useState({});
  const [loadingAction, setLoadingAction] = useState(null);

  const actions = [
    {
      id: 'users',
      title: 'View All Users',
      subtitle: 'Manage user accounts',
      icon: '👨‍🏫',
      stat: stats.totalUsers,
      endpoint: '/api/users',
      columns: ['name', 'email', 'role_id', 'is_active']
    },
    {
      id: 'programs',
      title: 'View All Programs',
      subtitle: 'Browse programs',
      icon: '📚',
      stat: stats.totalPrograms,
      endpoint: '/api/programs',
      columns: ['name', 'duration_years']
    },
    {
      id: 'exams',
      title: 'View Exam Types',
      subtitle: 'Manage exams',
      icon: '📋',
      stat: stats.activeExams,
      endpoint: '/api/exam-types',
      columns: ['type_name']
    },
    {
      id: 'subjects',
      title: 'View All Subjects',
      subtitle: 'Browse subject roster',
      icon: '📖',
      stat: stats.totalSubjects,
      endpoint: '/api/subjects',
      columns: ['subject_code', 'subject_name', 'credit']
    },
    {
      id: 'semesters',
      title: 'View Semesters',
      subtitle: 'Manage semesters',
      icon: '📅',
      stat: stats.totalSemesters,
      endpoint: '/api/semesters',
      columns: ['semester_no', 'program_id']
    },
    {
      id: 'years',
      title: 'View Academic Years',
      subtitle: 'Manage academic years',
      icon: '🎓',
      stat: stats.totalAcademicYears,
      endpoint: '/api/academic-years',
      columns: ['year_name']
    }
  ];

  const handleActionClick = async (action) => {
    if (expandedAction === action.id) {
      setExpandedAction(null);
      return;
    }

    setLoadingAction(action.id);
    try {
      const response = await fetch(`http://localhost:8080${action.endpoint}`);
      if (response.ok) {
        const data = await response.json();
        setExpandedData(prev => ({
          ...prev,
          [action.id]: data
        }));
        setExpandedAction(action.id);
      }
    } catch (error) {
      console.error(`Error fetching ${action.id}:`, error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="quick-actions">
      <h2>Quick Actions</h2>
      <div className="actions-grid">
        {actions.map(action => (
          <div key={action.id} className="action-card">
            <button
              className={`action-button ${expandedAction === action.id ? 'expanded' : ''}`}
              onClick={() => handleActionClick(action)}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.subtitle}</p>
                <span className="action-stat">{action.stat}</span>
              </div>
              <div className="action-chevron">
                {expandedAction === action.id ? '▼' : '▶'}
              </div>
            </button>

            {expandedAction === action.id && (
              <div className="action-expanded">
                {loadingAction === action.id ? (
                  <p>Loading...</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        {action.columns.map(col => (
                          <th key={col}>{col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {expandedData[action.id] && expandedData[action.id].map((item, idx) => (
                        <tr key={idx}>
                          {action.columns.map(col => (
                            <td key={col}>
                              {typeof item[col] === 'boolean' ? (item[col] ? '✓' : '✗') : item[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
