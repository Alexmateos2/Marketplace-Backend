// app.js
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes"), false);
    }
  },
});
const app = express();
const PORT = 3000;


app.use(cors());
app.use(express.json());
const usuariosRoutes = require("./routes/usuarios");
const productosRoutes = require("./routes/productos");
const pedidosRoutes = require("./routes/pedidos");
const estadisticasRoutes = require("./routes/estadisticas");
app.use("/usuarios", usuariosRoutes);
app.use("/productos", productosRoutes);
app.use("/pedidos",pedidosRoutes)
app.use("/estadisticas",estadisticasRoutes)


app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
