const pool = require("../config/db");
const bcrypt = require('bcrypt');
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

const validarPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const usuario = req.usuario;

    const match = await bcrypt.compare(password, usuario.password);
    if (!match) {
      return res.status(400).json({ message: "Correo o contraseña incorrecta" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error validando contraseña" });
  }
  
};
const correoExistente = async (req, res, next) => {
  try {
    const { email } = req.body; // ⚠️ Extraer email del body
    if (!email) return res.status(400).json({ message: "Se requiere email" });

    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      return res.status(400).json({ message: "Correo ya existente" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en la base de datos" });
  }
};


module.exports = { validarCorreo, validarPassword,correoExistente};
