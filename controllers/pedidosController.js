const pool = require("../config/db");

// Crear pedido
const crearPedido = async (req, res) => {
  const { id_usuario, productos, total } = req.body;

  if (!Array.isArray(productos) || productos.length === 0) {
    return res
      .status(400)
      .json({ message: "Se requiere al menos un producto" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Validar stock disponible para todos los productos
    for (const producto of productos) {
      const [result] = await connection.query(
        "SELECT stock FROM Productos WHERE id_producto = ?",
        [producto.id_producto]
      );

      if (result.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          message: `Producto ${producto.id_producto} no encontrado`,
        });
      }

      const stockActual = result[0].stock;
      if (stockActual < producto.cantidad) {
        await connection.rollback();
        return res.status(400).json({
          message: `Stock insuficiente para el producto ${producto.id_producto}. Disponible: ${stockActual}`,
        });
      }
    }

    // Crear el pedido
    const [pedidoResult] = await connection.query(
      "INSERT INTO Pedido (id_usuario, total) VALUES (?, ?)",
      [id_usuario ?? null, total]
    );

    const id_pedido = pedidoResult.insertId;

    // Insertar detalles del pedido
    const values = productos.map((p) => [id_pedido, p.id_producto, p.cantidad]);
    await connection.query(
      "INSERT INTO PedidoDetalle (id_pedido, id_producto, cantidad) VALUES ?",
      [values]
    );

    // Actualizar stock de cada producto (restar la cantidad comprada)
    for (const producto of productos) {
      await connection.query(
        "UPDATE Productos SET stock = stock - ? WHERE id_producto = ?",
        [producto.cantidad, producto.id_producto]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Pedido creado correctamente",
      id_pedido,
      productos,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error al crear pedido:", err);
    res.status(500).json({ message: "Error al crear pedido", error: err.message });
  } finally {
    connection.release();
  }
};

// Obtener pedidos de un usuario
const getPedidos = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const [pedidos] = await pool.query(
      "SELECT * FROM Pedido WHERE id_usuario = ? ORDER BY fecha DESC",
      [id_usuario]
    );

    if (!pedidos.length) return res.json([]);

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
};
const getAllPedidos = async (req, res) => {
  try {
 
    const [pedidos] = await pool.query(
      "SELECT * FROM Pedido"
    );

    if (!pedidos.length) return res.json([]);

    const usuarioIds = pedidos.map(p => p.id_usuario);

  
    const [usuarios] = await pool.query(
      `SELECT id_usuario, nombre FROM usuarios WHERE id_usuario IN (?)`,
      [usuarioIds]
    );

    const pedidosConDetalles = pedidos.map(pedido => {
      const usuario = usuarios.find(u => u.id_usuario === pedido.id_usuario);
      return {
        ...pedido,
        nombre: usuario ? usuario.nombre : null,
      };
    });

    res.json(pedidosConDetalles);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener pedidos", error: err });
  }
};

// Obtener detalles de un pedido específico
const getDetallesPedido = async (req, res) => {
  try {
    const { id_usuario, id_pedido } = req.params;

    const [detalles] = await pool.query(
      `SELECT 
        u.nombre,
        u.direccion,
        u.telefono,
        pd.id_detalle,
        pd.id_pedido,
        pd.id_producto,
        pd.cantidad,
        p.nombre AS nombre_producto,
        p.precio,
        p.imagen,
        pe.fecha,
        pe.total
      FROM PedidoDetalle pd
      INNER JOIN Productos p ON pd.id_producto = p.id_producto
      INNER JOIN Pedido pe ON pd.id_pedido = pe.id_pedido
      INNER JOIN Usuarios u ON pe.id_usuario = u.id_usuario
      WHERE pe.id_pedido = ? AND u.id_usuario = ?`,
      [id_pedido, id_usuario]
    );

    if (!detalles.length)
      return res
        .status(404)
        .json({ message: "No se encontraron detalles para este pedido" });

    res.json({
      id_pedido,
      nombre_usuario: detalles[0].nombre,
      fecha: detalles[0].fecha,
      direccion: detalles[0].direccion,
      telefono: detalles[0].telefono,
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
    res
      .status(500)
      .json({
        message: "Error al obtener detalles del pedido",
        error: err.message,
      });
  }
};

module.exports = { crearPedido, getPedidos, getDetallesPedido,getAllPedidos};
