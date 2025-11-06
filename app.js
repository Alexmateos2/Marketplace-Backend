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

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "marketplace",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use(cors());
app.use(express.json());
app.post("/test-upload", upload.single("imagen"), async (req, res) => {
  try {
    console.log("📤 Iniciando subida de imagen...");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionó ninguna imagen",
      });
    }

    console.log("📁 Archivo recibido:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Subir a Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: "test-marketplace", // Carpeta de prueba
            public_id: `test_producto_${Date.now()}`,
            transformation: [{ quality: "auto" }, { format: "auto" }],
          },
          (error, result) => {
            if (error) {
              console.error("❌ Error en Cloudinary:", error);
              reject(error);
            } else {
              console.log("✅ Imagen subida exitosamente:", result.public_id);
              resolve(result);
            }
          }
        )
        .end(req.file.buffer);
    });

    const result = await uploadPromise;

    // Generar URLs de diferentes tamaños para prueba
    const imageUrls = {
      original: result.secure_url,
      thumbnail: cloudinary.url(result.public_id, {
        width: 150,
        height: 150,
        crop: "fill",
        quality: "auto",
      }),
      medium: cloudinary.url(result.public_id, {
        width: 400,
        height: 400,
        crop: "fill",
        quality: "auto",
      }),
      large: cloudinary.url(result.public_id, {
        width: 800,
        height: 600,
        crop: "fill",
        quality: "auto",
      }),
    };

    res.json({
      success: true,
      message:
        "Imagen subida exitosamente. El flujo de MediaFlows procesará la imagen automáticamente.",
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        folder: result.folder,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        urls: imageUrls,
      },
    });
  } catch (error) {
    console.error("❌ Error general:", error);
    res.status(500).json({
      success: false,
      error: "Error al subir la imagen",
      details: error.message,
    });
  }
});

// Obtener todos los usuarios
app.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error en la base de datos", error: err });
  }
});

// Obtener usuario por ID
app.get("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE id_usuario = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error en la base de datos", error: err });
  }
});

// Middleware para validar correo
const validarCorreo = async (req, res, next) => {
  try {
    const { email } = req.body;
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Correo o contraseña incorrecta" });
    }

    req.usuario = rows[0]; // Guardamos el usuario
    next();
  } catch (err) {
    console.error("Error en validarCorreo:", err);
    return res.status(500).json({ message: "Error en la base de datos" });
  }
};

// Middleware para validar contraseña
const validarPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const usuario = req.usuario;

    if (password !== usuario.password) {
      return res
        .status(400)
        .json({ message: "Correo o contraseña incorrecta" });
    }

    next();
  } catch (err) {
    console.error("Error en validarPassword:", err);
    return res.status(500).json({ message: "Error en la base de datos" });
  }
};

app.post("/login", validarCorreo, validarPassword, (req, res) => {
  res.json({
    message: "Usuario logeado correctamente",
    usuario: req.usuario.id_usuario,
  });
});

// Crear usuario
app.post("/usuarios", async (req, res) => {
  try {
    const { nombre, password, email, direccion, telefono, rol } = req.body;
    const rolFinal = rol ?? "usuario";

    await pool.query(
      "INSERT INTO usuarios (nombre, password, email, direccion, telefono, rol) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre, password, email, direccion, telefono, rolFinal]
    );

    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al crear usuario", error: err });
  }
});

// Eliminar usuario
app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM usuarios WHERE id_usuario = ?",
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Usuario no encontrado" });

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar usuario", error: err });
  }
});

// Obtener todos los productos
app.get("/productos", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.nombre AS categoria
      FROM productos p
      JOIN categoria c ON p.id_categoria = c.id_categoria
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener productos", error: err });
  }
});

// Obtener productos por categoría
app.get("/productos/categoria/:id_categoria", async (req, res) => {
  try {
    const { id_categoria } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM productos WHERE id_categoria = ?",
      [id_categoria]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener productos", error: err });
  }
});

// Obtener un producto con detalles y reseñas
app.get("/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;

   
    const [productoRows] = await pool.query(
      "SELECT * FROM Productos WHERE id_producto = ?",
      [id]
    );
    if (productoRows.length === 0)
      return res.status(404).json({ message: "Producto no encontrado" });

    const producto = productoRows[0];


    const [especRows] = await pool.query(
      "SELECT nombre, descripcion FROM Especificaciones WHERE id_producto = ?",
      [id]
    );

    const [categoriaRows] = await pool.query(
      "SELECT nombre FROM Categoria WHERE id_categoria = ?",
      [producto.id_categoria]
    );
    const categoria = categoriaRows.length ? categoriaRows[0].nombre : null;

   
    const [resenaRows] = await pool.query(
      "SELECT valoracion, descripcion FROM Resenas WHERE id_producto = ?",
      [id]
    );

    // Agregar datos adicionales al producto
    producto.categoria = categoria;
    producto.especificaciones = especRows;
    producto.resenas = resenaRows;

    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener producto", error: err });
  }
});


// Crear producto con especificaciones y reseña
app.post("/productos", async (req, res) => {
  const {
    nombre,
    descripcion,
    id_categoria,
    precio,
    stock,
    oferta,
    imagen,
    especificaciones,
    resena,
  } = req.body;

  // Validaciones básicas
  if (!nombre || !id_categoria || precio === undefined || stock === undefined || !descripcion) {
    return res.status(400).json({
      message: "Faltan campos requeridos",
      campos_requeridos: ["nombre", "id_categoria", "precio", "stock","descripcion"],
    });
  }

  // Validar tipos y rangos
  if (typeof nombre !== "string" || nombre.trim().length === 0) {
    return res
      .status(400)
      .json({ message: "El nombre debe ser un texto no vacío" });
  }

  if (isNaN(precio) || precio < 0) {
    return res
      .status(400)
      .json({ message: "El precio debe ser un número positivo" });
  }

  if (isNaN(stock) || stock < 0 || !Number.isInteger(+stock)) {
    return res
      .status(400)
      .json({ message: "El stock debe ser un número entero positivo" });
  }

  if (isNaN(id_categoria) || id_categoria <= 0) {
    return res
      .status(400)
      .json({ message: "id_categoria debe ser un número válido" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Verificar que la categoría existe
    const [categoria] = await connection.query(
      "SELECT id_categoria FROM categoria WHERE id_categoria = ?",
      [id_categoria]
    );

    if (categoria.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "La categoría especificada no existe" });
    }

    // Insertar producto
    const [productoResult] = await connection.query(
      "INSERT INTO Productos (nombre, descripcion, id_categoria, precio, stock, oferta, imagen) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        nombre.trim(),
        descripcion,
        id_categoria,
        precio,
        stock,
        oferta || false,
        imagen || null,
      ]
    );

    const idProducto = productoResult.insertId;

    // Insertar especificaciones si existen
    if (Array.isArray(especificaciones) && especificaciones.length > 0) {
      const especificacionesValidas = especificaciones.filter(
        (spec) => spec.nombre && spec.descripcion
      );

      for (const spec of especificacionesValidas) {
        await connection.query(
          "INSERT INTO especificaciones (nombre, descripcion, id_producto) VALUES (?, ?, ?)",
          [spec.nombre.trim(), spec.descripcion.trim(), idProducto]
        );
      }
    }

    // Insertar reseña si existe
    if (resena && resena.valoracion && resena.descripcion) {
      if (
        isNaN(resena.valoracion) ||
        resena.valoracion < 1 ||
        resena.valoracion > 10
      ) {
        await connection.rollback();
        return res
          .status(400)
          .json({ message: "La valoración debe estar entre 1 y 10" });
      }

      await connection.query(
        "INSERT INTO Resenas (id_producto, valoracion, descripcion) VALUES (?, ?, ?)",
        [idProducto, resena.valoracion, resena.descripcion.trim()]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Producto creado con éxito",
      id_producto: idProducto,
      producto: {
        id: idProducto,
        nombre: nombre.trim(),
        id_categoria,
        precio,
        stock,
      },
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error al crear producto:", err);

    // Manejo de errores específicos
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "El producto ya existe" });
    }

    res.status(500).json({
      message: "Error al crear producto",
      error:
        process.env.NODE_ENV === "development" ? err.message : "Error interno",
    });
  } finally {
    connection.release();
  }
});
// Últimos 12 productos
app.get("/productos-nuevos", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Productos ORDER BY id_producto DESC LIMIT 12"
    );
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al obtener nuevos productos", error: err });
  }
});

// Crear pedido
app.post("/pedido", async (req, res) => {
  const { id_usuario, productos, total } = req.body;

  if (!Array.isArray(productos) || productos.length === 0) {
    return res
      .status(400)
      .json({ message: "Se requiere al menos un producto" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [pedidoResult] = await connection.query(
      "INSERT INTO Pedido (id_usuario, total) VALUES (?, ?)",
      [id_usuario ?? null, total]
    );

    const id_pedido = pedidoResult.insertId;

    const values = productos.map((p) => [id_pedido, p.id_producto, p.cantidad]);
    await connection.query(
      "INSERT INTO PedidoDetalle (id_pedido, id_producto, cantidad) VALUES ?",
      [values]
    );

    await connection.commit();

    res.status(201).json({
      message: "Pedido creado correctamente",
      id_pedido,
      productos,
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: "Error al crear pedido", error: err });
  } finally {
    connection.release();
  }
});

// Obtener pedidos con detalles y productos
app.get("/pedidos/:id_usuario", async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const [pedidos] = await pool.query(
      "SELECT * FROM Pedido WHERE id_usuario = ?",
      [id_usuario]
    );

    if (pedidos.length === 0) return res.json([]); // devolver array vacío

    const pedidosIds = pedidos.map((p) => p.id_pedido);
    const [detalles] = await pool.query(
      `SELECT 
         pd.id_detalle, pd.id_pedido, pd.id_producto, pd.cantidad,
         p.nombre AS nombre_producto, p.precio, p.imagen
       FROM PedidoDetalle pd
       INNER JOIN Productos p ON pd.id_producto = p.id_producto
       WHERE pd.id_pedido IN (?)`,
      [pedidosIds]
    );

    const pedidosConDetalles = pedidos.map((pedido) => ({
      ...pedido,
      detalles: detalles.filter((d) => d.id_pedido === pedido.id_pedido),
    }));

    res.json(pedidosConDetalles);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener pedidos", error: err });
  }
});
app.get("/detallesPedidos/:id_pedido", async (req, res) => {
  try {
    const { id_pedido } = req.params;

    const [detalles] = await pool.query(
      `
      SELECT 
        pd.id_detalle,
        pd.id_pedido,
        pd.id_producto,
        pd.cantidad,
        p.nombre AS nombre_producto,
        p.precio,
        p.imagen,
        c.total
      FROM pedidodetalle pd
      INNER JOIN productos p ON pd.id_producto = p.id_producto
      LEFT JOIN pedido c ON pd.id_pedido = c.id_pedido
      WHERE pd.id_pedido = ?
      `,
      [id_pedido]
    );

    if (detalles.length === 0) {
      return res.status(404).json({
        message: "No se encontraron detalles para este pedido",
      });
    }

    res.json({
      id_pedido,
      total: detalles[0].total,
      detalles: detalles.map((d) => ({
        id_detalle: d.id_detalle,
        id_producto: d.id_producto,
        cantidad: d.cantidad,
        nombre_producto: d.nombre_producto,
        precio_unitario: d.precio,
        subtotal: d.precio * d.cantidad,
        imagen: d.imagen,
      })),
    });
  } catch (err) {
    console.error("Error al obtener detalles del pedido:", err);
    res.status(500).json({
      message: "Error al obtener detalles del pedido",
      error: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
