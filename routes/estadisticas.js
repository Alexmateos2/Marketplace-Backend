const express = require("express");
const router = express.Router();
const { getResumenEstadisticas } = require("../controllers/estadisticasControler");


router.get("/resumen", getResumenEstadisticas);

module.exports = router;
