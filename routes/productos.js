const express = require("express");
const router = express.Router();
const {
  getProductos,
  getProductosPorCategoria,
  getProducto,
  crearProducto,
  getProductosNuevos,
  borrarProducto,
} = require("../controllers/productosController");

router.get("/", getProductos);
router.get("/categoria/:id_categoria", getProductosPorCategoria);
router.get("/nuevos", getProductosNuevos);
router.get("/:id", getProducto);
router.post("/", crearProducto);
router.delete("/:id", borrarProducto);

module.exports = router;
