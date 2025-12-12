const pool = require("../config/db");
const cloudinary = require("cloudinary").v2;
// Obtener todos los productos con su categoría
const getProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.nombre AS categoria
      FROM Productos p
      JOIN Categoria c ON p.id_categoria = c.id_categoria
    `);
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al obtener productos", error: err.message });
  }
};

// Obtener productos por categoría
const getProductosPorCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM Productos WHERE id_categoria = ?",
      [id_categoria]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      message: "Error al obtener productos por categoría",
      error: err.message,
    });
  }
};

// Obtener producto por ID con especificaciones y reseñas
const getProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const [productoRows] = await pool.query(
      "SELECT * FROM Productos WHERE id_producto = ?",
      [id]
    );

    if (!productoRows.length)
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

    producto.categoria = categoria;
    producto.especificaciones = especRows;
    producto.resenas = resenaRows;

    res.json(producto);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al obtener producto", error: err.message });
  }
};

// Crear producto con especificaciones y reseña
const crearProducto = async (req, res) => {
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

  if (
    !nombre ||
    !id_categoria ||
    precio === undefined ||
    stock === undefined ||
    !descripcion
  ) {
    return res.status(400).json({ message: "Faltan campos requeridos" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar categoría
    const [categoria] = await connection.query(
      "SELECT id_categoria FROM Categoria WHERE id_categoria = ?",
      [id_categoria]
    );

    if (!categoria.length) {
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

    // Insertar especificaciones
    if (Array.isArray(especificaciones)) {
      for (const spec of especificaciones.filter(
        (s) => s.nombre && s.descripcion
      )) {
        await connection.query(
          "INSERT INTO Especificaciones (nombre, descripcion, id_producto) VALUES (?, ?, ?)",
          [spec.nombre.trim(), spec.descripcion.trim(), idProducto]
        );
      }
    }

    // Insertar reseña
    if (resena && resena.valoracion && resena.descripcion) {
      const valoracion = parseFloat(resena.valoracion);
      if (isNaN(valoracion) || valoracion < 1 || valoracion > 10) {
        await connection.rollback();
        return res
          .status(400)
          .json({ message: "La valoración debe estar entre 1 y 10" });
      }

      await connection.query(
        "INSERT INTO Resenas (id_producto, valoracion, descripcion) VALUES (?, ?, ?)",
        [idProducto, valoracion, resena.descripcion.trim()]
      );
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Producto creado con éxito", id_producto: idProducto });
  } catch (err) {
    await connection.rollback();
    res
      .status(500)
      .json({ message: "Error al crear producto", error: err.message });
  } finally {
    connection.release();
  }
};
const getMejoresProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
  SELECT p.id_producto,p.nombre,p.imagen
  FROM Productos p
  LEFT JOIN Resenas r ON p.id_producto = r.id_producto
  ORDER BY r.valoracion DESC
  LIMIT 4
`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      message: "Error al obtener nuevos productos",
      error: err.message,
    });
  }
};
// Últimos 12 productos
const getProductosNuevos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Productos WHERE activo = 1 ORDER BY id_producto DESC LIMIT 12;"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      message: "Error al obtener nuevos productos",
      error: err.message,
    });
  }
};
// Si el produto tiene pedidos realizados por usuarios realizamos un PATCH para desactivarlo, si no lo borramos directamente
const eliminarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    // Comprobar si está en algún pedido
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM PedidoDetalle WHERE id_producto = ?",
      [id]
    );

    const tienePedidos = rows[0].total > 0;

    if (tienePedidos) {
      // Soft delete
      await pool.query(
        "UPDATE Productos SET activo = 0 WHERE id_producto = ?",
        [id]
      );

      return res.json({
        message: "Producto desactivado (soft delete)",
      });
    }

    // Si no tiene pedidos , eliminar completamente

    const [productoRows] = await pool.query(
      "SELECT imagen FROM Productos WHERE id_producto = ?",
      [id]
    );

    if (productoRows.length === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const imagen = productoRows[0].imagen;

    // Borrar dependencias opcionales
    await pool.query("DELETE FROM Resenas WHERE id_producto = ?", [id]);
    await pool.query("DELETE FROM Especificaciones WHERE id_producto = ?", [
      id,
    ]);

    // Borrar imagen en cloudinary
    if (imagen) {
      try {
        await cloudinary.uploader.destroy(imagen);
      } catch (err) {
        console.warn("Error eliminando imagen de Cloudinary:", err.message);
      }
    }

    // Borrar producto
    const [result] = await pool.query(
      "DELETE FROM Productos WHERE id_producto = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No se pudo eliminar el producto" });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("Error al procesar la eliminación:", err);
    res.status(500).json({
      message: "Error al borrar el producto",
      error: err.message,
    });
  }
};

const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    descripcion,
    id_categoria,
    precio,
    stock,
    oferta,
    imagen,
    especificaciones,
    resenas,
  } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Obtener la imagen actual
    const [currentImageRow] = await connection.query(
      `SELECT imagen FROM Productos WHERE id_producto = ?`,
      [id]
    );

    const currentImage = currentImageRow.length
      ? currentImageRow[0].imagen
      : null;

    // Si hay una nueva imagen y es distinta a la actual, borrar la vieja
    if (imagen && currentImage && imagen !== currentImage) {
      try {
        await cloudinary.uploader.destroy(currentImage);
        console.log(`🗑️ Imagen anterior eliminada: ${currentImage}`);
      } catch (err) {
        console.warn(
          "Error eliminando imagen anterior de Cloudinary:",
          err.message
        );
      }
    }

    // Actualizar producto principal
    await connection.query(
      `UPDATE Productos 
       SET nombre = ?, descripcion = ?, id_categoria = ?, precio = ?, stock = ?, oferta = ?, imagen = ?
       WHERE id_producto = ?`,
      [nombre, descripcion, id_categoria, precio, stock, oferta, imagen, id]
    );

    // Especificaciones
    await connection.query(
      `DELETE FROM Especificaciones WHERE id_producto = ?`,
      [id]
    );

    if (Array.isArray(especificaciones) && especificaciones.length > 0) {
      const values = especificaciones.map((spec) => [
        id,
        spec.nombre,
        spec.descripcion,
      ]);
      await connection.query(
        `INSERT INTO Especificaciones (id_producto, nombre, descripcion) VALUES ?`,
        [values]
      );
    }

    // Reseñas
    await connection.query(`DELETE FROM Resenas WHERE id_producto = ?`, [id]);

    if (Array.isArray(resenas) && resenas.length > 0) {
      const values = resenas.map((rev) => [
        id,
        rev.valoracion,
        rev.descripcion,
      ]);
      await connection.query(
        `INSERT INTO Resenas (id_producto, valoracion, descripcion) VALUES ?`,
        [values]
      );
    }

    await connection.commit();

    res.json({
      message: "Producto actualizado correctamente",
      id_producto: id,
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({
      message: "Error al actualizar el producto",
      error: err.message,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getProductos,
  getProductosPorCategoria,
  getProducto,
  getMejoresProductos,
  crearProducto,
  getProductosNuevos,
  eliminarProducto,
  actualizarProducto,
};
