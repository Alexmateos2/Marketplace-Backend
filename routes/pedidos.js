const express = require("express");
const router = express.Router();
const {
  crearPedido,
  getPedidos,
  getDetallesPedido,
  getAllPedidos
} = require("../controllers/pedidosController");

router.post("/", crearPedido);
router.get("/", getAllPedidos);
router.get("/:id_usuario", getPedidos);
router.get("/detalles/:id_usuario/:id_pedido", getDetallesPedido);

module.exports = router;
