const express = require("express");
const router = express.Router();
const {
  validarCorreo,
  validarPassword,
  correoExistente,
  validarCrearUsuario,
  validarActualizarUsuario,
} = require("../middlewares/auth");
const {
  login,
  crearUsuario,
  getUsuarios,
  getUsuario,
  actualizarUsuario,
  eliminarUsuario,
} = require("../controllers/usuariosController");

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios del marketplace
 */

/**
 * @swagger
 * /usuarios/login:
 *   post:
 *     summary: Login de usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "usuario@correo.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Usuario logeado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario logeado correctamente"
 *                 usuario:
 *                   type: integer
 *                   example: 1
 *                 rol:
 *                   type: string
 *                   example: "usuario"
 *                 avatar:
 *                   type: integer
 *                   example: "1"
 *       400:
 *         description: Correo o contraseña incorrecta
 *       500: 
 *        description: Error en la base de datos
 */
router.post("/login", validarCorreo, validarPassword, login);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 example: "juan@mail.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               direccion:
 *                 type: string
 *                 example: "Calle Falsa 123"
 *               telefono:
 *                 type: integer
 *                 example:  5551234567
 *               rolFinal:
 *                 type: string
 *                 example: "usuario"
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario creado correctamente"
 *                 usuario:
 *                   type: integer
 *                   example: 1
 *                 rol:
 *                   type: string
 *                   example: "usuario"
 *       400:
 *         description: Error en los datos enviados (email existente, campos faltantes, etc.)
 *       500:
 *         description: Error al crear usuario
 */
router.post("/", correoExistente, validarCrearUsuario, crearUsuario);

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_usuario:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   email:
 *                     type: string
 *                   direccion:
 *                     type: string
 *                   telefono:
 *                     type: integer
 *                   rol:
 *                     type: string
 *       500:
 *         description: Error al obtener usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener usuarios"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.get("/", getUsuarios);

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_usuario:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 email:
 *                   type: string
 *                 direccion:
 *                   type: string
 *                 telefono:
 *                   type: integer
 *                 rol:
 *                   type: string
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al obtener el usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener el usuario"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.get("/:id", getUsuario);

/**
 * @swagger
 * /usuarios/{id}:
 *   patch:
 *     summary: Actualizar un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               direccion:
 *                 type: string
 *               telefono:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       400:
 *         description: No se enviaron campos para actualizar o campos inválidos
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error actualizando usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error actualizando usuario"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.patch("/:id", validarActualizarUsuario, actualizarUsuario);

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al eliminar usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al eliminar usuario"
 *                 error:
 *                   type: string
 *                   example: "detalle del error"
 */
router.delete("/:id", eliminarUsuario);

module.exports = router;
