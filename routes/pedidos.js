const express = require("express");
const router = express.Router();
const {
  crearPedido,
  getPedidos,
  getDetallesPedido,
  getAllPedidos,
} = require("../controllers/pedidosController");
/**
 * @swagger
 * tags:
 *   name: Pedidos
 *   description: Gestión de pedidos del marketplace
 */

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Crear un nuevo pedido
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_usuario:
 *                 type: integer
 *                 example: 2
 *               total:
 *                 type: number
 *                 example: 200
 *               productos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_producto:
 *                       type: integer
 *                       example: 3
 *                     cantidad:
 *                       type: integer
 *                       example: 1
 *     responses:
 *       201:
 *         description: Pedido creado correctamente
 *       400:
 *         description: Error de validación (stock insuficiente, productos vacíos)
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error al crear pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al crear pedido"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.post("/", crearPedido);

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Obtener todos los pedidos
 *     tags: [Pedidos]
 *     responses:
 *       200:
 *         description: Lista de todos los pedidos
 *       500:
 *         description: Error al obtener pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener pedidos"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.get("/", getAllPedidos);

/**
 * @swagger
 * /pedidos/{id_usuario}:
 *   get:
 *     summary: Obtener todos los pedidos de un usuario
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id_usuario
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de pedidos del usuario
 *       500:
 *         description: Error al obtener pedidos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener pedidos"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.get("/:id_usuario", getPedidos);

/**
 * @swagger
 * /pedidos/detalles/{id_usuario}/{id_pedido}:
 *   get:
 *     summary: Obtener detalles de un pedido específico
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: id_usuario
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *       - in: path
 *         name: id_pedido
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del pedido
 *     responses:
 *       200:
 *         description: Detalles del pedido
 *       404:
 *         description: No se encontraron detalles para este pedido
 *       500:
 *         description: Error al obtener detalles del pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener detalles del pedido"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.get("/detalles/:id_usuario/:id_pedido", getDetallesPedido);

module.exports = router;
