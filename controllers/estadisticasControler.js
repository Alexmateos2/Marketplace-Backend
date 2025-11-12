const pool = require("../config/db");

const getResumenEstadisticas = async (req, res) => {
  try {
    // Fechas
    const hoy = new Date();
    const ayer = new Date(Date.now() - 86400000);
    const antesAyer = new Date(Date.now() - 86400000 * 2);

    const formatDate = (d) => d.toISOString().split("T")[0];
    const hoyStr = formatDate(hoy);
    const ayerStr = formatDate(ayer);
    const antesAyerStr = formatDate(antesAyer);

    // Total Revenue
    const [ventasHoy] = await pool.query(
      "SELECT SUM(total) AS total FROM Pedido WHERE DATE(fecha) = ?",
      [hoyStr]
    );
    const [ventasAyer] = await pool.query(
      "SELECT SUM(total) AS total FROM Pedido WHERE DATE(fecha) = ?",
      [ayerStr]
    );
    const [ventasAntesAyer] = await pool.query(
      "SELECT SUM(total) AS total FROM Pedido WHERE DATE(fecha) = ?",
      [antesAyerStr]
    );

    const totalRevenueHoy = ventasHoy[0].total || 0;
    const totalRevenueAyer = ventasAyer[0].total || 0;
    const cambioRevenue =
      totalRevenueAyer > 0
        ? ((totalRevenueHoy - totalRevenueAyer) / totalRevenueAyer) * 100
        : totalRevenueHoy > 0
        ? 100
        : 0;

    // Total Orders
    const [ordenesHoy] = await pool.query(
      "SELECT COUNT(*) AS total FROM Pedido WHERE DATE(fecha) = ?",
      [hoyStr]
    );
    const [ordenesAyer] = await pool.query(
      "SELECT COUNT(*) AS total FROM Pedido WHERE DATE(fecha) = ?",
      [ayerStr]
    );
    const [ordenesAntesAyer] = await pool.query(
      "SELECT COUNT(*) AS total FROM Pedido WHERE DATE(fecha) = ?",
      [antesAyerStr]
    );

    const cambioOrdenes =
      ordenesAyer[0].total > 0
        ? ((ordenesHoy[0].total - ordenesAyer[0].total) / ordenesAyer[0].total) *
          100
        : ordenesHoy[0].total > 0
        ? 100
        : 0;

    // Total Products
    const [productosHoy] = await pool.query(
      "SELECT COUNT(*) AS total FROM Productos WHERE DATE(fecha) = ?",
      [hoyStr]
    );
    const [productosAyer] = await pool.query(
      "SELECT COUNT(*) AS total FROM Productos WHERE DATE(fecha) = ?",
      [ayerStr]
    );
    const [productosTotal] = await pool.query("SELECT COUNT(*) AS total FROM Productos");
    const cambioProductos =
      productosAyer[0].total > 0
        ? ((productosHoy[0].total - productosAyer[0].total) / productosAyer[0].total) *
          100
        : productosHoy[0].total > 0
        ? 100
        : 0;

    // Total Users
    const [usuariosTotal] = await pool.query("SELECT COUNT(*) AS total FROM Usuarios");
    const [usuariosHastaAyer] = await pool.query(
      "SELECT COUNT(*) AS total FROM Usuarios WHERE DATE(fecha) <= ?",
      [ayerStr]
    );
    const cambioUsuarios =
      usuariosHastaAyer[0].total > 0
        ? ((usuariosTotal[0].total - usuariosHastaAyer[0].total) / usuariosHastaAyer[0].total) *
          100
        : usuariosTotal[0].total > 0
        ? 100
        : 0;

    // Sales Trends últimos 3 días
    const salesTrends = [
      {
        date: hoyStr,
        totalRevenue: ventasHoy[0].total || 0,
        orders: ordenesHoy[0].total,
      },
      {
        date: ayerStr,
        totalRevenue: ventasAyer[0].total || 0,
        orders: ordenesAyer[0].total,
      },
      {
        date: antesAyerStr,
        totalRevenue: ventasAntesAyer[0].total || 0,
        orders: ordenesAntesAyer[0].total,
      },
    ];

    // Últimos pedidos
    const [pedidos] = await pool.query(
  "SELECT * FROM Pedido ORDER BY id_pedido DESC LIMIT 4"
);

    if (!pedidos.length)
      return res.json({
        revenue: { total: totalRevenueHoy, change: cambioRevenue },
        orders: { total: ordenesHoy[0].total, change: cambioOrdenes },
        products: {
          total: productosTotal[0].total,
          new: productosHoy[0].total,
          change: cambioProductos,
        },
        users: { total: usuariosTotal[0].total, change: cambioUsuarios },
        salesTrends,
        recentOrders: [],
      });

    // Obtener nombres de usuarios de los pedidos
    const usuarioIds = pedidos.map((p) => p.id_usuario);
    const [usuarios] = await pool.query(
      "SELECT id_usuario, nombre FROM usuarios WHERE id_usuario IN (?)",
      [usuarioIds]
    );

    // Mapear pedidos con nombres de usuarios
    const pedidosConDetalles = pedidos.map((pedido) => {
      const usuario = usuarios.find((u) => u.id_usuario === pedido.id_usuario);
      return {
        ...pedido,
        nombre_usuario: usuario ? usuario.nombre : null,
      };
    });

    // Responder con todo el resumen y pedidos complementados
    res.json({
      revenue: { total: totalRevenueHoy, change: cambioRevenue },
      orders: { total: ordenesHoy[0].total, change: cambioOrdenes },
      products: {
        total: productosTotal[0].total,
        new: productosHoy[0].total,
        change: cambioProductos,
      },
      users: { total: usuariosTotal[0].total, change: cambioUsuarios },
      salesTrends,
      recentOrders: pedidosConDetalles,
    });
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    res.status(500).json({ message: "Error al obtener estadísticas", error: err.message });
  }
};

module.exports = { getResumenEstadisticas };
