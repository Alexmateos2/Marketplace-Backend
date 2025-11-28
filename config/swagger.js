const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Tekia",
      version: "1.0.0",
      description: "Documentación de la API del marketplace Tekia",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);

function swaggerDocs(app, authMiddleware) {
  
  app.use("/api-docs", authMiddleware, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Documentación disponible en http://localhost:3000/api-docs");
}

module.exports = swaggerDocs;