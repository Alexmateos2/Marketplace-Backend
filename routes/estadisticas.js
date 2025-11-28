const express = require("express");
const router = express.Router();
const { getResumenEstadisticas } = require("../controllers/estadisticasControler");


/**
 * @swagger
 * tags:
 *   name: Estadísticas
 *   description: Resumen de ventas, productos, usuarios y pedidos
 */

/**
 * @swagger
 * /estadisticas/resumen:
 *   get:
 *     summary: Obtener resumen de estadísticas del marketplace
 *     tags: [Estadísticas]
 *     responses:
 *       200:
 *         description: Resumen exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenue:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total de ingresos del día
 *                     change:
 *                       type: number
 *                       description: Cambio porcentual respecto al día anterior
 *                 orders:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total de pedidos del día
 *                     change:
 *                       type: number
 *                       description: Cambio porcentual respecto al día anterior
 *                 products:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total de productos
 *                     new:
 *                       type: integer
 *                       description: Nuevos productos añadidos hoy
 *                     change:
 *                       type: number
 *                       description: Cambio porcentual de productos respecto al día anterior
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total de usuarios
 *                     change:
 *                       type: number
 *                       description: Cambio porcentual de usuarios respecto al día anterior
 *                 salesTrends:
 *                   type: array
 *                   description: Tendencia de ventas últimos 3 días
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       totalRevenue:
 *                         type: number
 *                       orders:
 *                         type: integer
 *                 recentOrders:
 *                   type: array
 *                   description: Últimos 4 pedidos realizados
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_pedido:
 *                         type: integer
 *                       id_usuario:
 *                         type: integer
 *                       nombre_usuario:
 *                         type: string
 *                       fecha:
 *                         type: string
 *                       total:
 *                         type: number
 *                       otros_campos:
 *                         type: object
 *                         description: Otros campos de la tabla Pedido
 *       500:
 *         description: Error al obtener estadísticas
 */
router.get("/resumen", getResumenEstadisticas);


module.exports = router;
