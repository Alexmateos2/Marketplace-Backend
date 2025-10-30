// app.js
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

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

const validarCorreo = async (req, res, next) => {
  try {
    const { email } = req.body;
    const [results] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (results.length === 0) {
      return res.status(400).send("Correo o contraseña incorrecta");
    }

    req.usuario = results[0]; // Guardamos usuario para el siguiente middleware
    next();
  } catch (err) {
    res.status(500).json({ message: "Error en la base de datos", error: err });
  }
};

const validarPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const usuario = req.usuario;

    if (password !== usuario.password) {
      return res.status(400).send("Correo o contraseña incorrecta");
    }

    next();
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error en la validación de contraseña", error: err });
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
    const [rows] = await pool.query("SELECT * FROM productos");
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
      "SELECT nombre, descripcion FROM especificaciones WHERE id_producto = ?",
      [id]
    );

    const [resenaRows] = await pool.query(
      "SELECT valoracion, descripcion FROM Resenas WHERE id_producto = ?",
      [id]
    );

    producto.especificaciones = especRows;
    producto.resenas = resenaRows;

    res.json(producto);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener producto", error: err });
  }
});

// Crear producto con especificaciones y reseña
app.post("/productos", async (req, res) => {
  const {
    nombre,
    id_categoria,
    precio,
    stock,
    oferta,
    imagen,
    especificaciones,
    resena,
  } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [productoResult] = await connection.query(
      "INSERT INTO Productos (nombre, id_categoria, precio, stock, oferta, imagen) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre, id_categoria, precio, stock, oferta, imagen]
    );

    const idProducto = productoResult.insertId;

    if (Array.isArray(especificaciones) && especificaciones.length > 0) {
      for (const spec of especificaciones) {
        await connection.query(
          "INSERT INTO especificaciones (nombre, descripcion, id_producto) VALUES (?, ?, ?)",
          [spec.nombre, spec.descripcion, idProducto]
        );
      }
    }

    if (resena) {
      await connection.query(
        "INSERT INTO Resenas (id_producto, valoracion, descripcion) VALUES (?, ?, ?)",
        [idProducto, resena.valoracion, resena.descripcion]
      );
    }

    await connection.commit();

    res
      .status(201)
      .json({ message: "Producto creado con éxito", id_producto: idProducto });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: "Error al crear producto", error: err });
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
app.get("/detallePedidos/:id_pedido", async (req, res) => {
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
