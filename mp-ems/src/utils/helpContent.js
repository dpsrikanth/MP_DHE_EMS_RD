export const helpRegistry = {
  '/dashboard': {
    title: 'Dashboard Overview',
    description: 'Welcome to the main dashboard. This page provides a high-level summary of system status, quick navigation shortcuts, and important system metrics.',
    features: [
      'Monitor key aggregate statistics and metrics.',
      'Access quick-link buttons to major administrative actions.',
      'View real-time notices and calendar updates.'
    ],
    tips: 'Use the sidebar on the left to navigate to dedicated configuration or management modules.'
  },
  '/admin/marks-verification': {
    title: 'Marks Verification Tracking',
    description: 'Allows verification officers and college admins to monitor faculty internal marks submissions and verify automated "Best of 3" calculations.',
    features: [
      'Monitor marks submission status across subjects and sections.',
      'View detailed Marks Audit Trail highlighting revision history.',
      'Allow edits for Faculty when corrections are requested.',
      'Review and lock final submissions.'
    ],
    tips: 'Click the "History" button next to any status tag to review the full workflow audit trail.'
  },
  '/admin/marks-review/:subjectId/:section': {
    title: 'Marks Verification Review',
    description: 'Detailed review interface to verify students\' marks calculations, check for discrepancy warnings, and approve/lock final entries.',
    features: [
      'Review complete list of student marks with automated calculation verification.',
      'View system-generated validation warnings for abnormal marks discrepancies.',
      'Submit feedback or lock and sign off the marks workflow.'
    ],
    tips: 'Verify that any manual corrections have corresponding comments or justification in the system.'
  },
  '/admin/marks-reports': {
    title: 'Marks Reports & Analytics',
    description: 'Generate, filter, and export comprehensive internal marks reports and analytics.',
    features: [
      'Filter reports by Academic Year, Semester, Program, and College.',
      'View distribution charts and performance summaries.',
      'Export marks reports to Excel/PDF formats for university records.'
    ],
    tips: 'Ensure all filters are correctly set to generate the desired cohort reports.'
  },
  '/college-admin/dashboard': {
    title: 'College Admin Dashboard',
    description: 'Centralized administrative hub for college operations, allowing monitoring of marks entry, faculty status, and scheduling.',
    features: [
      'Overview of student registration and faculty counts.',
      'Monitor pending marks reviews and system alerts.',
      'Access quick controls for scheduling and invigilation.'
    ],
    tips: 'Review the pending alerts section regularly to catch overdue marks submissions early.'
  },
  '/college-admin/policies': {
    title: 'Grading & Marks Policies',
    description: 'Manage and configure academic policies, marks distribution, and calculation settings for the college.',
    features: [
      'Configure passing criteria and weightage distribution.',
      'Set rules for internal assessments (e.g. Best 2 of 3, Mid-terms, Assignments).',
      'Manage grace marks rules and exception policies.'
    ],
    tips: 'Be cautious when modifying active policies as they can change calculated results for current semesters.'
  },
  '/college-admin/marks-config': {
    title: 'Marks Entry Window Configuration',
    description: 'Configure and open/close the windows for faculty marks entry and edit requests.',
    features: [
      'Set start and end dates for internal marks submission.',
      'Grant extension periods for specific courses or departments.',
      'Track deadline adherence across the college.'
    ],
    tips: 'Closing the entry window will restrict faculty editing access, securing the marks data.'
  },
  '/college-admin/faculty-assign': {
    title: 'Faculty Course Assignment',
    description: 'Assign teachers and faculty members to specific academic subjects, programs, and sections for the current academic session.',
    features: [
      'View a summary of all existing teacher-subject mappings.',
      'Create new assignments for teachers.',
      'Update or delete assignments when schedules change.'
    ],
    tips: 'Ensure that the teacher is registered under the correct department before assigning them to a course.'
  },
  '/college-admin/faculty-assign/edit/:id': {
    title: 'Edit Faculty Assignment',
    description: 'Modify an existing faculty assignment details, department link, or course sections.',
    features: [
      'Change the assigned teacher for the selected subject/section.',
      'Update academic year, program, or term details.'
    ],
    tips: 'Save and verify that the updated faculty member gets access to the marks entry sheet.'
  },
  '/college-admin/marks-approval': {
    title: 'Marks Approval Portal',
    description: 'Review and approve/reject marks sheets submitted by various departments before final submission to the university.',
    features: [
      'Browse submitted marks by program, subject, and section.',
      'Compare performance metrics across classes.',
      'Approve and sign-off sheets or reject with remarks.'
    ],
    tips: 'Rejected sheets will go back to the HOD/Faculty with status "Correction Requested".'
  },
  '/college-admin/examination-halls': {
    title: 'Exam Hall Management',
    description: 'Define exam rooms, halls, capacities, and layout structures for hosting tests.',
    features: [
      'Add examination halls with block and row details.',
      'Specify total student capacity and invigilator assignment requirements.',
      'View hall availability and booking logs.'
    ],
    tips: 'Ensure correct row-column layouts to automatically generate optimal seating arrangements.'
  },
  '/college-admin/faculty-status': {
    title: 'Faculty Activity Status',
    description: 'Monitor faculty login logs, marks entry progress, and assignment completions.',
    features: [
      'Track progress bars of marks entry for each lecturer.',
      'View last active timestamps and activity audits.',
      'Send automated reminders to faculty with pending actions.'
    ],
    tips: 'Use the "Send Reminder" button to notify faculty members who are close to their deadlines.'
  },
  '/college-admin/performance': {
    title: 'College Performance Metrics',
    description: 'Access visual analytics on student pass percentages, average marks, and department-wise performance.',
    features: [
      'Compare scores across departments and semesters.',
      'Identify top performers and students requiring remedial classes.',
      'Export analysis reports for academic audits.'
    ],
    tips: 'Use these charts during department review meetings to discuss student performance trends.'
  },
  '/college-admin/seating-arrangement': {
    title: 'Automated Seating Arrangement',
    description: 'Configure and generate optimal student seating plans for exams to prevent cheating and maximize hall usage.',
    features: [
      'Select active exams, programs, and available halls.',
      'Generate randomized seating structures automatically.',
      'Download and print seating plans and seat-label tags.'
    ],
    tips: 'Run the seating arrangement algorithm after student enrollments and hall lists are fully finalized.'
  },
  '/college-admin/invigilator-assignment': {
    title: 'Invigilator Assignments',
    description: 'Assign invigilation duties to faculty members for various exam slots and halls.',
    features: [
      'Assign faculty members to exam halls based on slot availability.',
      'Track invigilation load per teacher to maintain equity.',
      'Generate duty schedules and send emails to teachers.'
    ],
    tips: 'Avoid scheduling faculty for duties in the same slots where they have other academic responsibilities.'
  },
  '/college-admin/internal-attendance': {
    title: 'Internal Exam Attendance Tracking',
    description: 'Monitor, verify, and input student attendance for internal examination sessions.',
    features: [
      'Select exam round, date, hall, and program.',
      'View absent/present counts per session.',
      'Lock attendance sheets to secure eligibility calculations.'
    ],
    tips: 'Attendance status impacts final eligibility criteria configured in student policies.'
  },
  '/college-admin/internal-exams/rounds': {
    title: 'Internal Exam Rounds Management',
    description: 'Create and define internal examination rounds (e.g. Sessional-I, Sessional-II) for the current term.',
    features: [
      'Add new exam rounds with start and end dates.',
      'Select target semesters and programs participating in the round.',
      'Configure round rules and weightages.'
    ],
    tips: 'Define rounds at the beginning of the semester to enable timely scheduling and mark configuration.'
  },
  '/college-admin/internal-exams/schedules': {
    title: 'Exam Time Table Scheduling',
    description: 'Schedule exact dates, times, and durations for each subject within an active exam round.',
    features: [
      'Create custom schedules for subjects under different programs.',
      'Ensure slot-conflict checks are resolved automatically by the system.',
      'Publish schedules for students and faculty dashboards.'
    ],
    tips: 'Double-check slot conflicts to prevent a student from having two exams at the same time.'
  },
  '/faculty/dashboard': {
    title: 'Faculty Dashboard',
    description: 'Provides quick access to assigned classes, upcoming invigilation duties, attendance trackers, and marks entry deadlines.',
    features: [
      'View shortcut list of subjects and classes assigned to you.',
      'Review pending marks entry deadlines.',
      'Check schedule for invigilation duties.'
    ],
    tips: 'Check the announcements board on this dashboard for any changes in schedules or policies.'
  },
  '/faculty/marks-entry': {
    title: 'Marks Entry Portal',
    description: 'Input, edit, and submit student assessment marks for your assigned courses.',
    features: [
      'Filter by program, subject, and section.',
      'Enter grades for tests, assignments, and class participation.',
      'Save drafts, verify calculations, and submit marks for approval.'
    ],
    tips: 'Save drafts frequently. Once submitted, marks are locked and sent to HOD/Verification officers for approval.'
  },
  '/faculty/internal-marks': {
    title: 'Internal Exam Marks Entry',
    description: 'Enter scores for scheduled internal exam rounds (Sessional exams) for your assigned students.',
    features: [
      'Select exam round, course, and section.',
      'Enter scores out of maximum round marks.',
      'Import grades via spreadsheets (CSV/Excel) or enter manually.'
    ],
    tips: 'Validate that the maximum marks configured in policies match the marks on your test sheet before entry.'
  },
  '/faculty/attendance': {
    title: 'Class Attendance Register',
    description: 'Record and manage daily or lecture-wise class attendance for your assigned students.',
    features: [
      'Select subject, section, and date/slot.',
      'Mark students as Present/Absent with quick toggle buttons.',
      'View attendance summary logs and percentage metrics.'
    ],
    tips: 'Regular attendance recording keeps student warning lists updated automatically.'
  },
  '/faculty/internal-attendance': {
    title: 'Internal Exam Attendance',
    description: 'Record student attendance for scheduled internal examination slots.',
    features: [
      'Select exam schedule, room, and date.',
      'Mark absent students and verify total student counts.',
      'Submit attendance logs directly to the exam control cell.'
    ],
    tips: 'Accurate exam attendance is crucial for preventing discrepancies during paper checking and marks entry.'
  },
  '/faculty/invigilation-duty': {
    title: 'My Invigilation Duties',
    description: 'View your scheduled invigilation duties, slots, halls, and duty reports.',
    features: [
      'Check date, time, and room details for assigned invigilations.',
      'Download student verification sheets and attendance sign sheets for your assigned rooms.'
    ],
    tips: 'Arrive at the assigned hall 15 minutes before the exam starts to distribute papers and verify ID cards.'
  },
  '/hod/dashboard': {
    title: 'HOD Dashboard',
    description: 'Departmental oversight console for Head of Department (HOD) roles, summarizing syllabus completion, marks approvals, and faculty loads.',
    features: [
      'Monitor status of marks submissions in your department.',
      'Track faculty attendance entries and duty completions.',
      'Access departmental performance indices.'
    ],
    tips: 'Promptly approve submissions to keep the university publication schedule on time.'
  },
  '/hod/marks-approval': {
    title: 'Department Marks Approval',
    description: 'Review and approve marks lists submitted by faculty members under your department.',
    features: [
      'Verify grade entries and distributions for departmental subjects.',
      'Lock marks sheet and forward to verification cell, or reject back to faculty with comments.'
    ],
    tips: 'If rejecting, add specific details in comments about what needs adjustment.'
  },
  '/hod/assessment-acceptance': {
    title: 'Assessment Policy Verification',
    description: 'Verify if internal assessment marks meet minimum standards, weightage parameters, and grading rules.',
    features: [
      'Approve specialized assessment schemas.',
      'Review deviations from core grading configurations.'
    ],
    tips: 'Compare metrics with the university baseline policy before granting approvals.'
  },
  '/student/dashboard': {
    title: 'Student Dashboard',
    description: 'Personalized portal for students, displaying academic progress, attendance summaries, and quick action links.',
    features: [
      'Check overall attendance metrics.',
      'View notifications on upcoming exams and timetables.',
      'Access results summary cards.'
    ],
    tips: 'Check the notifications tab for calendar updates or announcements from college administration.'
  },
  '/student/exams': {
    title: 'My Exams & Schedules',
    description: 'View upcoming exams, register for university exams, and download hall tickets.',
    features: [
      'View complete internal and external exam timetable details.',
      'Download Admit Card (Hall Ticket) when approved by college.'
    ],
    tips: 'Hall tickets are only downloadable once your attendance criteria are satisfied and dues are cleared.'
  },
  '/student/results': {
    title: 'My Academic Results',
    description: 'Check semester performance, internal exam scores, and download marksheets.',
    features: [
      'View detailed scorecard breakdown for all subjects.',
      'Download PDF Result Sheets.',
      'Track cumulative GPA (CGPA) and credits earned.'
    ],
    tips: 'If there are discrepancies in your internal marks, contact your subject teacher immediately.'
  },
  '/student/attendance': {
    title: 'My Attendance Reports',
    description: 'Monitor your subject-wise attendance percentages and tracking logs.',
    features: [
      'View detailed attendance summaries for each subject.',
      'Check status (Safe vs Warning levels) based on 75% requirement.'
    ],
    tips: 'Maintain at least 75% attendance in each subject to avoid being restricted from downloading hall tickets.'
  },
  '/profile': {
    title: 'My Profile & Account Settings',
    description: 'View your profile details, edit contact info, and manage account preferences.',
    features: [
      'Review personal identity information, college registration, and system roles.',
      'Verify contact number and email addresses.'
    ],
    tips: 'Keep your contact details updated to receive critical SMS and email alerts.'
  },
  '/smtp-settings': {
    title: 'SMTP Mail Configuration',
    description: 'Configure global mail transfer settings to handle emails sent to students, faculty, and admins.',
    features: [
      'Set SMTP host, port, username, password, and secure transport settings.',
      'Send a test email to verify credentials and configurations.'
    ],
    tips: 'Ensure SMTP ports are open on the host server network before testing configurations.'
  },

  // --- Admin Master Data & Registries ---
  '/viewstudentsanduniversitys': {
    title: 'University & Student View Registry',
    description: 'Comprehensive directory displaying active universities and their enrolled student bodies. Ideal for global administrative mapping and state audit exports.',
    features: [
      'Filter students globally by their affiliated University and enrollment batch.',
      'Export consolidated university-student registries in standard formats.',
      'Examine high-level student stats breakdown across universities.'
    ],
    tips: 'Use the global search filter to instantly find records by student enrollment number or university code.'
  },
  '/universities': {
    title: 'University Affiliations Directory',
    description: 'Manage and monitor all higher educational universities affiliated with the state board, specifying their approval statuses and nodal domains.',
    features: [
      'Register new state or central universities under the board\'s jurisdiction.',
      'Configure college-affiliation limits and administrative domain rules.',
      'Toggle university affiliation status for the academic year.'
    ],
    tips: 'Deactivating an affiliation will temporarily lock administrative features for all colleges under that university.'
  },
  '/universities/add': {
    title: 'Add New University Affiliation',
    description: 'Form to register a new university into the state board system. Complete all regulatory details, university codes, and admin details.',
    features: [
      'Define official university name, legal registration code, and contact coordinates.',
      'Set administrative contact credentials for first-time dashboard access.',
      'Assign geographical zone or district jurisdiction.'
    ],
    tips: 'Verify the unique board identifier before saving to prevent duplicate domain setups.'
  },
  '/universities/edit/:id': {
    title: 'Edit University Details',
    description: 'Modify affiliation terms, contact information, and administrative parameters of an existing university.',
    features: [
      'Update official point of contact details and communication addresses.',
      'Manage active university-level administrative flags.',
      'Review historical audit timestamps for regulatory compliance.'
    ],
    tips: 'Changes to contact emails will trigger verification emails to the university administration.'
  },
  '/colleges': {
    title: 'Colleges Directory',
    description: 'Manage institutional information, affiliated universities, active branches, and intake capacities for registered colleges.',
    features: [
      'Register and view all participating colleges mapped to their respective universities.',
      'Filter colleges by affiliated university, location, or status.',
      'Modify student intake limits and course affiliation ranges.'
    ],
    tips: 'Use status toggle buttons to mark institutions as active or under audit.'
  },
  '/colleges/add': {
    title: 'Register College Institution',
    description: 'Form to register a new college institution under a selected affiliated university.',
    features: [
      'Select parent university and assign a unique College Code.',
      'Define address, principal contact info, and registration license numbers.',
      'Set primary user account details for the college administration.'
    ],
    tips: 'Double-check the college code matches the state board listing for smooth automated credit mappings.'
  },
  '/colleges/edit/:id': {
    title: 'Edit College Profile',
    description: 'Update the institutional details, parent university, and regulatory contacts for an active college.',
    features: [
      'Update principal name, phone numbers, and emergency contact details.',
      'Verify and adjust maximum student intake capacity limits.',
      'Update active registration documents or status.'
    ],
    tips: 'Altering parent university mappings will rebuild the college’s subject routing table. Use caution.'
  },
  '/programs': {
    title: 'Academic Programs & Degrees',
    description: 'Manage state-recognized degrees, diploma programs, and specialized academic courses, including standard durations and credit thresholds.',
    features: [
      'Define undergraduate, postgraduate, and doctoral degrees (e.g. B.Tech, B.Sc, MBA).',
      'Set total academic semesters, credits required, and branch structures.',
      'Configure minimum evaluation structures (Internals vs. Externals).'
    ],
    tips: 'Program configurations serve as templates for all college-level course structures.'
  },
  '/programs/add': {
    title: 'Add Academic Program',
    description: 'Form to construct a new academic curriculum template / degree program.',
    features: [
      'Input program title, degree type, and standard duration.',
      'Define graduation credit milestones and internal-external exam weightage distributions.',
      'Map standard stream specializations.'
    ],
    tips: 'Assign standard labels that correspond exactly with state board syllabi for cross-matching.'
  },
  '/programs/edit/:id': {
    title: 'Edit Academic Program Template',
    description: 'Modify standard attributes, credit bounds, and evaluation structures for an existing degree program.',
    features: [
      'Adjust required passing credit totals or duration limits.',
      'Modify standard core and elective subject configurations.',
      'Set eligibility benchmarks for semester promotions.'
    ],
    tips: 'Updating program parameters will affect newly generated student batches, not existing locked rosters.'
  },
  '/batches': {
    title: 'Student Roster Batches',
    description: 'Manage academic year entry cohorts of students, linking them to academic programs and tracking overall cohort progress.',
    features: [
      'Configure enrollment cohorts (e.g. Batch 2024-2028).',
      'Monitor batch enrollment limits and overall progress milestones.',
      'Assign lead academic counselors or batch coordinators.'
    ],
    tips: 'Keep batches separated to correctly execute year-wise and cohort-wise performance reports.'
  },
  '/batches/add': {
    title: 'Create Student Batch',
    description: 'Form to establish a new student intake cohort group.',
    features: [
      'Specify batch start and end years.',
      'Link batch to a specific degree program and intake capacity.',
      'Configure regulation versioning for academic rules.'
    ],
    tips: 'The regulation year controls which grading schemas are applied when results are processed.'
  },
  '/batches/edit/:id': {
    title: 'Modify Batch Parameters',
    description: 'Update the enrollment configurations, name, and milestones of a student batch.',
    features: [
      'Change cohort name, start/end timelines, or program mappings.',
      'Extend or restrict maximum intake capacities.',
      'Assign new batch coordinators.'
    ],
    tips: 'Verify that any manual extension of batch years is aligned with the academic calendar.'
  },
  '/academic-years': {
    title: 'Academic Years Directory',
    description: 'Define and manage standard academic calendars, specifying active year flags and core examination cycles.',
    features: [
      'Add new academic year sessions (e.g. 2025-2026).',
      'Toggle active academic session for global dashboard views.',
      'Set core start/end dates for winter and summer terms.'
    ],
    tips: 'Only one academic year should be set as "Current" to avoid enrollment and scheduling mismatches.'
  },
  '/academic-years/add': {
    title: 'Define Academic Year',
    description: 'Form to create a new academic session timeline within the system.',
    features: [
      'Enter academic year name and session start/end timelines.',
      'Specify active status flags for scheduling and enrollment engines.'
    ],
    tips: 'Setting a new year to active will prompt confirmation to archive previous dashboard widgets.'
  },
  '/academic-years/edit/:id': {
    title: 'Edit Academic Year Session',
    description: 'Modify active dates and status tags for a designated academic year session.',
    features: [
      'Adjust start or end boundaries to match academic delays.',
      'Set active or archival tags.'
    ],
    tips: 'Adjusting academic year dates will not automatically reschedule already set exam tables.'
  },
  '/semesters': {
    title: 'Semesters & Terms Management',
    description: 'Manage distinct terms, semester progressions, and active course registration windows.',
    features: [
      'Define semesters (Odd/Even) for active academic years.',
      'Set enrollment timelines and minimum attendance benchmarks per term.',
      'Configure registration caps and credits ceilings.'
    ],
    tips: 'Promotions calculations look at active semester thresholds to move students to the next stage.'
  },
  '/semesters/add': {
    title: 'Add Academic Semester',
    description: 'Form to introduce a new semester term sequence.',
    features: [
      'Enter semester number and select corresponding program level.',
      'Set term start, end, and class commencement dates.',
      'Specify minimum registration requirements.'
    ],
    tips: 'Confirm the semester code is consecutive to ensure progression algorithms process promotions smoothly.'
  },
  '/semesters/edit/:id': {
    title: 'Edit Semester Configurations',
    description: 'Modify dates, program connections, and registration limits for an active semester term.',
    features: [
      'Adjust class start and end boundaries.',
      'Update minimum credit requirements for promotion rules.',
      'Lock or unlock enrollment gates.'
    ],
    tips: 'Make sure class end dates match the internal exam scheduling bounds.'
  },
  '/subjects': {
    title: 'Syllabus & Subjects Directory',
    description: 'Manage the core database of all subjects, specifying course codes, credit loads, and type (theory/practical/elective).',
    features: [
      'Define subject codes, names, total credits, and category.',
      'Map standard syllabus documents and core reading links.',
      'Filter subjects by department, program, or semester levels.'
    ],
    tips: 'Assign accurate subject codes, as they dictate the secrecy branch paper coding schema.'
  },
  '/subjects/add': {
    title: 'Add New Subject',
    description: 'Form to create a new subject module in the global curriculum database.',
    features: [
      'Input unique subject code, title, and department classification.',
      'Set total credits, lecture-tutorial-practical (LTP) structure, and evaluation weightages.',
      'Select whether it is a core, elective, or vocational paper.'
    ],
    tips: 'Theory and practical components of the same subject should be configured clearly to ensure separate mark sheets.'
  },
  '/subjects/edit/:id': {
    title: 'Edit Subject Configuration',
    description: 'Modify name, department, credit loads, and paper type for a defined subject.',
    features: [
      'Update syllabus specifications or resource references.',
      'Adjust credit metrics or category classification.',
      'Confirm changes to evaluation structures.'
    ],
    tips: 'Changing credits mid-term will impact current CGPA calculations for all enrolled cohorts.'
  },
  '/teachers': {
    title: 'Faculty & Teachers Directory',
    description: 'Register and manage profile information, qualifications, and department affiliations for all faculty members.',
    features: [
      'Add and review profiles of academic teachers and lecturers.',
      'Map teachers to their active departments and research categories.',
      'Track login rights, invigilation load, and active courses.'
    ],
    tips: 'Ensure correct phone numbers are linked, as verification codes are sent directly to their verified mobiles.'
  },
  '/teachers/add': {
    title: 'Add Teacher Profile',
    description: 'Form to onboard a new teacher/lecturer into the institution database.',
    features: [
      'Enter teacher’s full name, bio, qualification, and employee code.',
      'Assign to a primary academic department.',
      'Configure system access and username setup.'
    ],
    tips: 'Employee codes must be unique and match official human resources databases.'
  },
  '/teachers/edit/:id': {
    title: 'Edit Teacher Profile',
    description: 'Update personal details, employee credentials, and primary department mappings of a teacher.',
    features: [
      'Update qualifications, contact number, or address.',
      'Reassign primary department or access roles.',
      'Lock or unlock user credentials.'
    ],
    tips: 'Locking a teacher profile will instantly freeze all active marks-entry sheets associated with them.'
  },
  '/students': {
    title: 'Students Enrollment Directory',
    description: 'Core repository for all enrolled students. View registration details, batch affiliations, attendance, and exam histories.',
    features: [
      'Access student profiles, registration details, and roll numbers.',
      'Filter student cohorts by program, batch, or status.',
      'Export bulk student datasets for board registrations.'
    ],
    tips: 'Click on a student row to inspect their complete marks transcript, attendance log, and fee clearance tags.'
  },
  '/students/add': {
    title: 'Onboard Student Profile',
    description: 'Form to enroll a new student under a designated program and academic year batch.',
    features: [
      'Input student’s name, father\'s name, date of birth, and identity proof.',
      'Select program, batch, and assign official Roll/Enrollment Number.',
      'Add contact details and first-time login settings.'
    ],
    tips: 'The enrollment number must conform exactly to your university\'s standardized naming convention.'
  },
  '/students/edit/:id': {
    title: 'Edit Student Information',
    description: 'Update registration details, identity information, program changes, or status flags of an active student.',
    features: [
      'Modify primary contact information, address, or parent details.',
      'Change batch or promotion status under authorized permissions.',
      'Review exam ticket block lists.'
    ],
    tips: 'Altering promotional status manually is audited. Verify state approval docs before applying.'
  },
  '/users': {
    title: 'System Users Registry',
    description: 'Configure and monitor all admin and operational accounts across the portal, specifying status and account locking.',
    features: [
      'Register operational staff, controllers, HODs, and auditors.',
      'Inspect last active IP logs and session activity history.',
      'Perform password resets and accounts unlock actions.'
    ],
    tips: 'Always apply two-factor authentication requirements for users with system administrative roles.'
  },
  '/users/add': {
    title: 'Add User Account',
    description: 'Form to create a new system operator or administrative account.',
    features: [
      'Input profile details, email, and choose username.',
      'Assign standard portal security roles.',
      'Configure account activation parameters.'
    ],
    tips: 'A notification email containing temporary credentials will be dispatched to the provided email.'
  },
  '/users/edit/:id': {
    title: 'Edit User Account Settings',
    description: 'Modify system access privileges, assigned roles, and profile settings for a registered user.',
    features: [
      'Change operational roles and dashboard visibility.',
      'Toggle active state or clear failed login counters.',
      'Update email or mobile contact links.'
    ],
    tips: 'Demoting an administrator will invalidate their currently active sessions instantly.'
  },
  '/roles': {
    title: 'Roles & Permissions Matrix',
    description: 'Define portal security roles and associate fine-grained permission flags for CRUD actions.',
    features: [
      'Create customized security roles (e.g. Marks Auditor, Exam Cell Staff).',
      'Map view/edit/delete checkboxes across different entities.',
      'Review role membership counts.'
    ],
    tips: 'Always maintain the principle of least privilege when designing operational staff roles.'
  },
  '/roles/add': {
    title: 'Create Security Role',
    description: 'Form to define a new operational role with specific permission matrices.',
    features: [
      'Enter unique Role Title and general description.',
      'Check specific authorization tokens for each feature set.'
    ],
    tips: 'Ensure the new role does not conflict with pre-existing system defaults like SuperAdmin or CollegeAdmin.'
  },
  '/roles/edit/:id': {
    title: 'Modify Role Permissions',
    description: 'Adjust authorized action checkboxes and membership access for an existing security role.',
    features: [
      'Expand or restrict view and edit permissions across entities.',
      'Rename custom role descriptions.'
    ],
    tips: 'Review how many active users possess this role before saving changes to avoid accidental locks.'
  },
  '/exams': {
    title: 'Exams Scheduling & Rounds',
    description: 'Overview of scheduled external and term-end examinations, showing timelines, dates, and registration metrics.',
    features: [
      'Track state-wide term-end exam schedules and active rounds.',
      'Monitor total student registrations and paper setups.',
      'Publish time-tables globally.'
    ],
    tips: 'Confirm all syllabus components are linked before scheduling exams to prevent seating gaps.'
  },
  '/exams/add': {
    title: 'Schedule New Exam Cycle',
    description: 'Form to define a new university-level external or sessional examination cycle.',
    features: [
      'Specify Exam Title, cycle year, and term categorization.',
      'Define registration opening and closure dates.',
      'Configure grace period rules.'
    ],
    tips: 'Ensure registration timelines accommodate fee reconciliation checks by bank gateways.'
  },
  '/exams/edit/:id': {
    title: 'Edit Exam Cycle Details',
    description: 'Update timelines, registration limits, and scheduling rules of an existing exam cycle.',
    features: [
      'Extend or advance registration dates.',
      'Update exam cycle descriptions.',
      'Manage regulatory review status.'
    ],
    tips: 'Extending registration deadlines automatically updates the student dashboard in real-time.'
  },
  '/marks': {
    title: 'Global Marks Ledger',
    description: 'Central registry containing consolidated student score sheets. View grades and performance charts globally.',
    features: [
      'Search and filter marks by Program, College, Subject, or Roll Number.',
      'Analyze overall grade distributions and pass/fail statistics.',
      'Access manual correction tools with full audit logging.'
    ],
    tips: 'Any adjustment to finalized marks requires verification board approval and logs a security entry.'
  },
  '/policies': {
    title: 'Academic Policy Templates',
    description: 'Manage and configure grading policies, GPA conversion tables, and promo guidelines for the university.',
    features: [
      'Define university-wide grading scales (e.g. O, A+, A, B, F).',
      'Set credit thresholds for automatic progression to the next year.',
      'Configure standard grace mark allotments and eligibility rules.'
    ],
    tips: 'Changing system policies requires HOD board confirmation and takes effect from next term-end processing.'
  },
  '/policies/add': {
    title: 'Create Grading Policy Template',
    description: 'Form to design a new set of academic evaluation and grading regulations.',
    features: [
      'Input policy title, governing academic code, and targets.',
      'Configure passing mark percentages and grade boundaries.',
      'Specify credit caps and promotion rules.'
    ],
    tips: 'Ensure clear definitions are provided for SGPA/CGPA formulas to avoid discrepancies.'
  },
  '/policies/edit/:id': {
    title: 'Modify Policy Regulations',
    description: 'Edit boundaries, grace configurations, and criteria in an existing academic policy.',
    features: [
      'Adjust grade-range boundaries.',
      'Modify credit check rules or grace parameters.'
    ],
    tips: 'Ensure no active semesters are referencing this policy version during modifications.'
  },
  '/departments': {
    title: 'Academic Departments',
    description: 'Configure active branches and divisions within the institution, mapping subjects and student intakes.',
    features: [
      'Define academic departments (e.g. Computer Science, Mechanical Eng.).',
      'Assign HOD accounts and manage faculty rosters.',
      'Examine department performance metrics.'
    ],
    tips: 'Subjects are linked to departments to streamline the internal marks approval routing workflows.'
  },
  '/departments/add': {
    title: 'Create Department Division',
    description: 'Form to register a new academic department under the institution.',
    features: [
      'Enter Department Name, unique Code, and location.',
      'Assign a primary HOD user account.'
    ],
    tips: 'Department codes are critical for building student roll number schemas.'
  },
  '/departments/edit/:id': {
    title: 'Edit Department Information',
    description: 'Modify department coordinates, assign new HODs, or update intake capacities.',
    features: [
      'Change official HOD links.',
      'Update division codes or room allocations.'
    ],
    tips: 'Updating the HOD link immediately routes pending departmental mark approvals to the new HOD\'s dashboard.'
  },
  '/internal-calendar': {
    title: 'Internal Exams Academic Calendar',
    description: 'Schedule milestones, marks upload windows, and submission deadlines for internal exams.',
    features: [
      'Set exact deadline dates for all departments for marks submission.',
      'Configure alert notifications for overdue sheets.',
      'Publish calendar events.'
    ],
    tips: 'Synchronize dates with the university’s main timetable to allow sufficient grading time.'
  },
  '/milestones': {
    title: 'Examination Milestones Progress',
    description: 'Track key milestones (paper setting, hall ticket generation, secrecy coding, results publication) for ongoing exam cycles.',
    features: [
      'View real-time progress bars for every stage of the current exam cycle.',
      'Set deadlines and target dates for upcoming milestones.',
      'Identify bottlenecks in grading or paper setting.'
    ],
    tips: 'A green milestone indicator signifies completion, while yellow indicates approaching deadlines.'
  },
  '/milestones/add': {
    title: 'Create Exam Milestone',
    description: 'Form to define a new progression tracking checkpoint for active cycles.',
    features: [
      'Specify Milestone Title, target exam cycle, and phase order.',
      'Configure due dates, weightages, and tracking parameters.'
    ],
    tips: 'Keep phases sequential to ensure progress calculations reflect actual timeline flows.'
  },
  '/milestones/edit/:id': {
    title: 'Edit Milestone Target',
    description: 'Update the due dates, order, or description of a designated progress milestone.',
    features: [
      'Adjust deadline bounds or weight calculations.',
      'Mark stages as completed or bypassed.'
    ],
    tips: 'Updating a milestone due date notifies all linked university admin roles.'
  },

  // --- Specialized Workflows & Roles ---
  '/admin/marks-approval': {
    title: 'Admin Marks Approval Portal',
    description: 'Central review interface for the final university-level mark sheets submitted by college admins and HODs.',
    features: [
      'Examine comprehensive list of course marks pending final university lock.',
      'Verify grade patterns and spot extreme deviations or outliers.',
      'Approve and lock sheets for official transcript generation, or reject to college.'
    ],
    tips: 'Once approved here, marks are fully frozen and populated onto official transcripts and student dashboards.'
  },
  '/student/hall-ticket/:examName/:semesterId': {
    title: 'Official Exam Hall Ticket / Admit Card',
    description: 'Generate, preview, and download your official examination entry pass, listing your exam centers and timetables.',
    features: [
      'Verify student identity, college center code, and roll number details.',
      'Inspect exact exam dates, subjects, session timings, and hall assignments.',
      'Print or download certified Admit Card PDF.'
    ],
    tips: 'Make sure your profile picture is clear and the principal\'s digital signature is visible before printing.'
  },
  '/student/result-sheet/:examName': {
    title: 'Academic Transcripts & Result Sheets',
    description: 'Official terminal scorecard breakdown, showcasing semester grades, credits earned, and overall results.',
    features: [
      'Examine grades, internal/external marks breakdown per subject.',
      'Review calculated SGPA, cumulative CGPA, and final result status.',
      'Download secure digital-signed marksheet PDF.'
    ],
    tips: 'Keep this secure copy for your career placements and higher education application processes.'
  },
  '/external-faculty/dashboard': {
    title: 'External Faculty Console',
    description: 'Dedicated administrative console for appointed external examiners and practical lab auditors.',
    features: [
      'Access list of assigned external exam centers and lab slots.',
      'Review board guidelines and practical rubrics.',
      'Log travel and operational claim forms.'
    ],
    tips: 'Contact the nodal center coordinator immediately if you notice discrepancies in the student rosters.'
  },
  '/external-faculty/marks-entry': {
    title: 'External Practical Marks Entry',
    description: 'Input portal for entering student scores for practical laboratory tests, viva-voce, or project reviews.',
    features: [
      'Select assigned center, batch, and practical subject.',
      'Enter viva and practical assessment marks for each student candidate.',
      'Submit and lock marks with external secure signature.'
    ],
    tips: 'Double-check values. External entries bypass college validation and flow straight to the university database.'
  },
  '/paper-setter/dashboard': {
    title: 'Paper Setter Console',
    description: 'Secure, sandboxed dashboard for authorized examiners assigned to construct official question papers.',
    features: [
      'Review assigned subjects, curriculum templates, and pattern guidelines.',
      'Access secure editor to construct and submit question banks.',
      'Track review status and remuneration payments.'
    ],
    tips: 'For maximum security, always log out when leaving your terminal to prevent unauthorized paper leaks.'
  },
  '/paper-setter/assigned-exams': {
    title: 'My Paper Assignments',
    description: 'Detail list of subjects and classes assigned to you for creating term-end questions.',
    features: [
      'Check maximum marks, duration, and blueprint guidelines.',
      'Initiate draft question paper creation.',
      'View submission deadlines.'
    ],
    tips: 'Follow the syllabus blueprint exactly to ensure equal weightage distribution across all modules.'
  },
  '/paper-setter/submitted-papers': {
    title: 'Submitted Question Papers Log',
    description: 'Secure log of question papers you have drafted, encrypted, and dispatched to the secrecy cell.',
    features: [
      'Review submission timestamps and encryption receipts.',
      'Track approval / revisions requested by the moderator board.',
      'Confirm billing invoices.'
    ],
    tips: 'Once a paper is submitted, its content is fully encrypted and cannot be viewed or edited.'
  },
  '/paper-setter/guidelines': {
    title: 'Board Paper Setting Regulations',
    description: 'Access complete manuals, Bloom\'s taxonomy frameworks, and security rules for paper setting.',
    features: [
      'Read official guidelines on blueprint rules and cognitive level distributions.',
      'Examine sample template papers.',
      'Review non-disclosure agreement guidelines.'
    ],
    tips: 'Avoid incorporating identical questions from popular test-prep materials or commercial guidebooks.'
  },
  '/secrecy/dashboard': {
    title: 'Secrecy Branch Hub',
    description: 'Control center for the university\'s secrecy department, managing secure paper codes, examiner details, and payments.',
    features: [
      'Monitor status of question paper drafts and moderation cycles.',
      'Oversee randomized coding processes for answer sheet packets.',
      'Review pending paper-setter remuneration vouchers.'
    ],
    tips: 'Strictly monitor activity logs to maintain complete confidentiality and system integrity.'
  },
  '/secrecy/paper-setters': {
    title: 'Paper Setters Registry',
    description: 'Manage details, contact records, credentials, and teaching profiles of approved paper setters.',
    features: [
      'Access repository of eligible academic subject experts.',
      'Assign paper-setting roles randomly to maintain anonymity.',
      'Track teacher specialization areas and historical reliability scores.'
    ],
    tips: 'Use the system\'s automatic rotation tool to prevent selecting the same setter for consecutive cycles.'
  },
  '/secrecy/question-papers': {
    title: 'Question Paper Moderation & Encryption',
    description: 'Manage the vault of encrypted question papers, tracking moderation, translation, and final prints.',
    features: [
      'Approve moderated and vetted question papers.',
      'Manage multi-lingual translation tasks.',
      'Initiate secure roll-out keys to digital print centers.'
    ],
    tips: 'Moderator comments should focus exclusively on errors or syllabus deviations, not style preferences.'
  },
  '/secrecy/payments': {
    title: 'Remuneration & Claims Portal',
    description: 'Approve, authorize, and process financial claims, travel allowances, and remuneration for paper setters.',
    features: [
      'Review automatically calculated fees based on set rates.',
      'Validate bank details and dispatch payments directly via treasury portals.',
      'Export financial ledger files for state audit verification.'
    ],
    tips: 'Ensure that the question paper status is marked as "Approved" before initiating final payment release.'
  },

  // --- University Admin / Super Admin specialized routes ---
  '/university/external-assignment': {
    title: 'External Examiners Assignment',
    description: 'Map external expert examiners to practical center halls, scheduling viva audits for colleges.',
    features: [
      'Search and filter external examiners by expertise domain and availability.',
      'Assign examiners to specific college practical centers for the session.',
      'Generate assignment orders and travel passes.'
    ],
    tips: 'Verify that the examiner does not have an active teaching assignment at the center college to prevent conflicts of interest.'
  },
  '/university/external-marks': {
    title: 'External Term Marks Dashboard',
    description: 'University admin console to track external examination marks, review raw score streams, and detect delays.',
    features: [
      'Track upload progress of external scores by center and subject.',
      'Compare performance distributions of external checks against internal scores.',
      'Manage correction windows for external examiners.'
    ],
    tips: 'Use the visual bar charts to identify centers that have overdue external mark uploads.'
  },
  '/university/grading-policy': {
    title: 'University Grading Framework',
    description: 'Configure state-level academic grading scales, absolute/relative boundaries, and credit policies.',
    features: [
      'Set target GPA conversion formulas for different programs.',
      'Establish global passing thresholds for theory vs practical exams.',
      'Apply modifications across active university degrees.'
    ],
    tips: 'Always run a simulation on past student scorecards before publishing updates to a grading framework.'
  },
  '/university/manage-credits': {
    title: 'Syllabus Credit Framework',
    description: 'Manage credit specifications, maximum semester credit ceilings, and elective category policies.',
    features: [
      'Configure maximum allowed credits registrations per term.',
      'Specify credit weightages for core, generic, and vocational courses.',
      'Audit credit registrations for current active semesters.'
    ],
    tips: 'Credit frameworks must follow university regulations to prevent student graduation delays.'
  },
  '/university/hall-approvals': {
    title: 'Exam Hall Verification approvals',
    description: 'Review and approve examination hall layouts, camera systems, and capacities configured by colleges.',
    features: [
      'Verify physical exam room counts, safety metrics, and row capacities.',
      'Review college center eligibility statuses and system parameters.',
      'Approve center credentials or request adjustments.'
    ],
    tips: 'Approve college centers early in the cycle to facilitate smooth automatic student seat mappings.'
  },
  '/university/infrastructure-analytics': {
    title: 'Affiliated Infrastructure Insights',
    description: 'Analytical dashboards evaluating college capacities, lab facilities, classroom counts, and resource loads.',
    features: [
      'Examine physical resources distribution across all active colleges.',
      'Compare student-teacher and student-seat density ratios.',
      'Pinpoint institutions lacking specialized labs or infrastructure.'
    ],
    tips: 'Leverage this data during college registration reviews and annual affiliation extension evaluations.'
  },
  '/university/exam-analytics': {
    title: 'State Exam Analytics & Trends',
    description: 'High-level business intelligence dashboard illustrating student performance trends, pass-rates, and grading patterns.',
    features: [
      'Compare pass-rate indices and average marks across colleges, districts, and programs.',
      'Detect abnormal grade clusters or grading spikes indicating potential anomalies.',
      'Export consolidated dashboard visuals for board reports.'
    ],
    tips: 'Filter by academic years to analyze progress and educational standards improvement over time.'
  },
  '/university/institutional-ranking': {
    title: 'Institutional Performance Ranking',
    description: 'Automated ranking board indexing colleges based on pass percentages, average marks, and academic timelines compliance.',
    features: [
      'View ranked listing of affiliated colleges utilizing weighted criteria.',
      'Adjust ranking factors (average grade, timing accuracy, student ratings).',
      'Download public performance rank sheets.'
    ],
    tips: 'Sharing these ranks promotes a healthy competitive environment among affiliated institutes.'
  },
  '/university/student-allocations': {
    title: 'Student Exam Center Allocation',
    description: 'Configure and execute automated student center allocation routines, mapping students to secure external halls.',
    features: [
      'Select student groups, programs, and available district centers.',
      'Run allocation algorithms based on distance limits and capacities.',
      'Generate center allotment charts and download logs.'
    ],
    tips: 'Execute center allocations before printing student hall tickets to ensure center details are correct.'
  },
  '/university/student-search': {
    title: 'Global Student Information Search',
    description: 'High-speed unified index to search any student across all affiliated colleges, programs, and academic cycles.',
    features: [
      'Search by student name, enrollment key, roll number, or mobile.',
      'View unified student profiles, enrollment status, active semesters, and grades.',
      'Track academic progression histories and disciplinary status.'
    ],
    tips: 'Use exact enrollment numbers to fetch records directly without search delays.'
  },
  '/university/exam-attendance': {
    title: 'University Term-End Attendance Control',
    description: 'Consolidated overview of student exam attendance across all physical centers, monitoring overall absenteeism.',
    features: [
      'Examine session-wise exam attendance totals in real-time.',
      'Review reports of student absenteeism for specific papers.',
      'Log special exception categories (medical cases, suspension checks).'
    ],
    tips: 'This central tracker updates automatically as colleges submit digital attendance sheets.'
  }
};

/**
 * Fallback generator for paths not explicitly mapped
 */
export const getFallbackHelp = (path) => {
  const parts = path.split('/').filter(Boolean);
  const routeName = parts[parts.length - 1] || 'Dashboard';
  const cleanName = routeName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: cleanName,
    description: `This page is used for managing ${cleanName}. Use the interactive tools, tables, and search controls provided on this screen.`,
    features: [
      `Search, filter, and page through ${cleanName} records.`,
      `View details and configurations associated with ${cleanName}.`,
      `Perform action steps using action buttons located on cards or rows.`
    ],
    tips: 'If you have questions or face issues, contact your system administrator.'
  };
};

/**
 * Helper to match path with help registry
 */
export const getHelpContent = (path) => {
  if (!path) return getFallbackHelp('/dashboard');
  
  // Normalize path (remove trailing slash and convert to lowercase)
  let normalizedPath = path.toLowerCase().replace(/\/$/, "");
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  
  // Try exact match first
  const exactKey = Object.keys(helpRegistry).find(key => key.toLowerCase() === normalizedPath);
  if (exactKey) {
    return helpRegistry[exactKey];
  }
  
  // Try matching routes with placeholders (e.g. edit/:id or review/:subjectId/:section)
  const registryKeys = Object.keys(helpRegistry);
  for (const key of registryKeys) {
    // If the registry key has placeholders like :id, :subjectId, etc.
    if (key.includes(':')) {
      const pattern = key
        .toLowerCase()
        .replace(/:[a-zA-Z0-9_]+/g, '[^/]+') // replace placeholders with regex wildcard for segments
        .replace(/\//g, '\\/'); // escape forward slashes
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(normalizedPath)) {
        return helpRegistry[key];
      }
    }
  }

  // Fallback to auto-generated guide
  return getFallbackHelp(path);
};
