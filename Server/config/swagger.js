const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EMS API Documentation',
      version: '1.0.0',
      description: 'Examination Management System API endpoints and schemas',
      contact: {
        name: 'EMS Admin'
      }
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            role_id: { type: 'integer' },
            college_id: { type: 'integer' },
            is_active: { type: 'boolean' }
          }
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            role_name: { type: 'string' },
            description: { type: 'string' }
          }
        },
        University: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            address: { type: 'string' },
            status: { type: 'boolean' }
          }
        },
        College: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            college_code: { type: 'integer' },
            university_id: { type: 'integer' },
            address: { type: 'string' },
            status: { type: 'boolean' }
          }
        },
        Program: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            duration_years: { type: 'integer' },
            university_id: { type: 'integer' },
            status: { type: 'boolean' }
          }
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            college_id: { type: 'integer' },
            program_id: { type: 'integer' },
            current_semester_id: { type: 'integer' },
            admission_year: { type: 'integer' },
            status: { type: 'boolean' }
          }
        },
        Teacher: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            college_id: { type: 'integer' },
            designation: { type: 'string' },
            department: { type: 'string' },
            experience: { type: 'integer' },
            status: { type: 'boolean' }
          }
        },
        Exam: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            semester_id: { type: 'integer' },
            college_id: { type: 'integer' },
            exam_type: { type: 'integer' },
            exam_date: { type: 'string', format: 'date' },
            status: { type: 'boolean' }
          }
        },
        GradingConfig: {
          type: 'object',
          properties: {
            grade_scale: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  min: { type: 'number' },
                  grade: { type: 'string' },
                  points: { type: 'number' }
                }
              }
            },
            pass_threshold: { type: 'number' },
            calculate_sgpa_on_earned_only: { type: 'boolean' },
            subject_credits: { type: 'object', additionalProperties: { type: 'number' } }
          }
        },
        MasterProgram: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            duration_years: { type: 'integer' },
            status: { type: 'string' }
          }
        },
        MasterSubject: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            subject_code: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string' }
          }
        },
        MasterSemester: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            semester_name: { type: 'string' },
            status: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['../routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
