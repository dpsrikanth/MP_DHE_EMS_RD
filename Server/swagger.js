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
  apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
