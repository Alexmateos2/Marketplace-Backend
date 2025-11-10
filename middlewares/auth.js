const pool = require("../config/db");

const validarCorreo = async (req, res, next) => {
  try {
    const { email } = req.body;
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);

    if (!rows.length) return res.status(400).json({ message: "Correo o contraseña incorrecta" });

    req.usuario = rows[0];
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en la base de datos" });
  }
};

const validarPassword = (req, res, next) => {
  const { password } = req.body;
  if (password !== req.usuario.password)
    return res.status(400).json({ message: "Correo o contraseña incorrecta" });

  next();
};

module.exports = { validarCorreo, validarPassword };
