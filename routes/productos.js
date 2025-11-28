const express = require("express");
const router = express.Router();
const {
  getProductos,
  getProductosPorCategoria,
  getProducto,
  crearProducto,
  getProductosNuevos,
  actualizarProducto,
  getMejoresProductos,
  eliminarProducto,
} = require("../controllers/productosController");

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión de productos del marketplace
 */

/**
 * @swagger
 * /productos:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos con su categoría
 *       500:
 *         description: Error al obtener productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener productos"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.get("/", getProductos);

/**
 * @swagger
 * /productos/categoria/{id_categoria}:
 *   get:
 *     summary: Obtener productos por categoría
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id_categoria
 *         schema:
 *           type: integer
 *           enum: [1,2,3,4,5,6,7,8]
 *         required: true
 *         description: "ID de la categoría: 1: Audio, 2: Ratones, 3: Teclados, 4: Laptops, 5: Wearables, 6: Monitores, 7: Smartphones, 8: Accesorios"
 *     responses:
 *       200:
 *         description: Lista de productos filtrados por categoría
 *       404:
 *         description: No se encontraron productos para esta categoría
 *       500:
 *         description: Error al obtener productos por categoría
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener productos por categoría"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.get("/categoria/:id_categoria", getProductosPorCategoria);

/**
 * @swagger
 * /productos/nuevos:
 *   get:
 *     summary: Obtener los últimos 12 productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos nuevos
 *       500:
 *         description: Error al obtener nuevos productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener nuevos productos"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.get("/nuevos", getProductosNuevos);

/**
 * @swagger
 * /productos/mejores:
 *   get:
 *     summary: Obtener los 4 productos mejor valorados
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos destacados
 *       500:
 *         description: Error al obtener los mejores productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener mejores productos"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.get("/mejores", getMejoresProductos);

/**
 * @swagger
 * /productos/{id}:
 *   get:
 *     summary: Obtener un producto por ID con especificaciones y reseñas
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error al obtener producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener producto"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.get("/:id", getProducto);

/**
 * @swagger
 * /productos:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               id_categoria:
 *                 type: integer
 *               precio:
 *                 type: number
 *               stock:
 *                 type: integer
 *               oferta:
 *                 type: boolean
 *               imagen:
 *                 type: string
 *               especificaciones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     descripcion:
 *                       type: string
 *               resena:
 *                 type: object
 *                 properties:
 *                   valoracion:
 *                     type: number
 *                   descripcion:
 *                     type: string
 *     responses:
 *       201:
 *         description: Producto creado con éxito
 *       400:
 *         description: Faltan campos o valoración incorrecta
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error al crear producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al crear producto"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.post("/", crearProducto);

/**
 * @swagger
 * /productos/edit/{id}:
 *   put:
 *     summary: Actualizar un producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto a actualizar
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente
 *       500:
 *         description: Error al actualizar el producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al actualizar el producto"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.put("/edit/:id", actualizarProducto);

/**
 * @swagger
 * /productos/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado o desactivado correctamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error al eliminar el producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al borrar el producto"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.delete("/:id", eliminarProducto);


module.exports = router;
