import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Church Management API",
      version: "1.0.0",
      description:
        "API documentation for church authentication, users, members, ministries, sermons, and announcements.",
    },

    servers: [
      {
        url: "http://localhost:2000/api/v1",
        description: "Local development server",
      },
    ],

    tags: [
      { name: "Authentication", description: "Registration and login" },
      { name: "Users", description: "User administration" },
      { name: "Members", description: "Church member management" },
      { name: "Ministries", description: "Ministry and membership management" },
      { name: "Sermons", description: "Sermon content management" },
      { name: "Announcements", description: "Church announcements" },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your access token, without the word Bearer.",
        },
      },

      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            code: { type: "string", example: "VALIDATION_ERROR" },
          },
        },

        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 100 },
            totalPages: { type: "integer", example: 5 },
          },
        },

        Sermon: {
          type: "object",
          properties: {
            title: { type: "string", example: "Walking by Faith" },
            speaker: { type: "string", example: "Pastor John" },
            description: {
              type: "string",
              example: "A message about trusting God.",
            },
            scriptureReference: {
              type: "string",
              example: "2 Corinthians 5:7",
            },
            videoUrl: {
              type: "string",
              format: "uri",
              nullable: true,
            },
            audioUrl: {
              type: "string",
              format: "uri",
              nullable: true,
            },
            status: {
              type: "string",
              enum: ["draft", "published", "archived"],
            },
          },
        },

        Announcement: {
          type: "object",
          properties: {
            title: {
              type: "string",
              example: "Sunday Worship Service",
            },
            body: {
              type: "string",
              example: "Join us this Sunday at 9:00 AM.",
            },
            category: {
              type: "string",
              enum: [
                "general",
                "service",
                "youth",
                "children",
                "prayer",
                "ministry",
                "other",
              ],
            },
            priority: {
              type: "string",
              enum: ["normal", "important", "urgent"],
            },
            status: {
              type: "string",
              enum: ["draft", "published", "archived"],
            },
          },
        },
      },
    },
  },

  // swagger-jsdoc reads the documentation comments in these files.
  apis: [
  "./routes/**/*.js",
  "./src/modules/**/*.js",
],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;