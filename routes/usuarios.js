const express = require("express");
const router = express.Router();
const { validarCorreo, validarPassword, correoExistente } = require("../middlewares/auth");
const {
  login,
  crearUsuario,
  getUsuarios,
  getUsuario,
  actualizarUsuario,
  eliminarUsuario
} = require("../controllers/usuariosController");
 
router.post("/login", validarCorreo, validarPassword, login);
router.post("/", correoExistente,crearUsuario);
router.get("/", getUsuarios);
router.get("/:id", getUsuario);
router.patch("/:id", actualizarUsuario);
router.delete("/:id", eliminarUsuario);

module.exports = router;
