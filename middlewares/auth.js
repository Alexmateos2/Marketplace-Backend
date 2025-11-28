const pool = require("../config/db");
const bcrypt = require("bcrypt");
const validarCorreo = async (req, res, next) => {
  try {
    const { email } = req.body;
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);

    if (!rows.length)
      return res
        .status(400)
        .json({ message: "Correo o contraseña incorrecta" });

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
      return res
        .status(400)
        .json({ message: "Correo o contraseña incorrecta" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error validando contraseña" });
  }
};
const correoExistente = async (req, res, next) => {
  try {
    const { email } = req.body; // Extraer email del body
    if (!email) return res.status(400).json({ message: "Se requiere email" });

    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);

    if (rows.length > 0) {
      return res.status(400).json({ message: "Correo ya existente" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en la base de datos" });
  }
};

const validarCrearUsuario = async (req, res, next) => {
  try {
    const { nombre, password, email, direccion, telefono, rol } = req.body;

    // Campos obligatorios
    if (!nombre || !email || !password || !direccion || !telefono) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    // Regex email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email no válido" });
    }

    // Validaciones
    if (nombre.length > 30 || nombre.length < 3) {
      return res.status(400).json({
        message:
          "El nombre de usuario no puede ser mayor de 30 caracteres o menor de 3",
      });
    }

    if (email.length > 30) {
      return res
        .status(400)
        .json({ message: "El email no puede ser mayor de 30 caracteres" });
    }

    if (password.length < 6 || password.length > 30) {
      return res.status(400).json({
        message:
          "La contraseña debe tener al menos 6 caracteres y no ser mayor de 30",
      });
    }
    if (telefono < 9 || telefono.length > 12) {
      return res.status(400).json({
        message:
          "El telefono debe tener al menos 9 caracteres y no ser mayor de 12",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    req.userData = {
      nombre,
      hashedPassword,
      email,
      direccion,
      telefono,
      rolFinal: rol ?? "usuario",
    };

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error en la validación del registro",
      error: error.message,
    });
  }
};
const validarActualizarUsuario = async (req, res, next) => {
  try {
    const { nombre, password, email, direccion, telefono } = req.body;

    // Validaciones solo si se envían los campos
    if (nombre && (nombre.length < 3 || nombre.length > 30)) {
      return res.status(400).json({
        message: "El nombre debe tener entre 3 y 30 caracteres",
      });
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email no válido" });
      }

      if (email.length > 30) {
        return res
          .status(400)
          .json({ message: "El email no puede ser mayor de 30 caracteres" });
      }

      // Validar si email ya existe en otro usuario
      const [rows] = await pool.query(
        "SELECT * FROM usuarios WHERE email = ? AND id_usuario != ?",
        [email, req.params.id]
      );
      if (rows.length > 0) {
        return res.status(400).json({ message: "El email ya está en uso" });
      }
    }

    if (password && (password.length < 6 || password.length > 30)) {
      return res.status(400).json({
        message: "La contraseña debe tener entre 6 y 30 caracteres",
      });
    }

    if (telefono && (telefono.length < 9 || telefono.length > 12)) {
      return res.status(400).json({
        message: "El teléfono debe tener entre 9 y 12 caracteres",
      });
    }

    next();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error en la validación de actualización", error: err.message });
  }
};
//Auth para la documentacion de swagger
function swaggerAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Acceso restringido"');
    return res.status(401).send('Autenticación requerida.');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  
  const USERNAME = process.env.SWAGGER_USER || 'admin';
  const PASSWORD = process.env.SWAGGER_PASS || 'admin';

  if (username === USERNAME && password === PASSWORD) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Acceso restringido"');
    return res.status(401).send('Usuario o contraseña incorrectos.');
  }
}
module.exports = {
  validarCorreo,
  validarPassword,
  correoExistente,
  validarCrearUsuario,
  validarActualizarUsuario,
  swaggerAuth
};
