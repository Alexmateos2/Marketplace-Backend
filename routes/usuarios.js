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

router.post("/login", validarCorreo, validarPassword, login);
router.post("/", correoExistente, validarCrearUsuario, crearUsuario);
router.get("/", getUsuarios);
router.get("/:id", getUsuario);
router.patch("/:id",validarActualizarUsuario, actualizarUsuario);
router.delete("/:id", eliminarUsuario);

module.exports = router;
