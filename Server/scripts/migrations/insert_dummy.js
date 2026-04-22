const pool = require('../../db');
const q = `
  INSERT INTO paper_assignments (subject_id, exam_id, set_name, paper_setter_id, assigned_by_id, status)
  VALUES 
  (7, 3, 'A', 42, 1, 'Pending'),
  (7, 3, 'B', 42, 1, 'Pending'),
  (7, 3, 'C', 42, 1, 'Pending'),
  (12, 3, 'A', 44, 1, 'Pending'),
  (12, 3, 'B', 44, 1, 'Pending'),
  (12, 3, 'C', 44, 1, 'Pending')
  ON CONFLICT (subject_id, exam_id, set_name) DO NOTHING
`;
pool.query(q)
  .then(() => {
    console.log('Dummy assignments created');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
