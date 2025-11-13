const pool = require("../config/db");
const bcrypt = require("bcrypt");
//Login usuario
const login = (req, res) => {
  res.json({
    message: "Usuario logeado correctamente",
    usuario: req.usuario.id_usuario,
    rol:req.usuario.rol
  });
};

//Crear un usuario
const crearUsuario = async (req, res) => {
  try {
    const { nombre, password, email, direccion, telefono, rol } = req.body;
    const rolFinal = rol ?? "usuario";
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!nombre || !email || !password || !direccion || !telefono)
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Email no válido" });

    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres" });

    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, password, email, direccion, telefono, rol) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre, hashedPassword, email, direccion, telefono, rolFinal]
    );

    res.status(201).json({
      message: "Usuario creado correctamente",
      usuario: result.insertId,
      rol: rolFinal
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error al crear usuario", error: err.message });
  }
};

//Obtener todos los usuarios
const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios");
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al obtener usuarios", error: err.message });
  }
};

//Obtener un usuario
const getUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE id_usuario = ?",
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al obtener usuario", error: err.message });
  }
};

//Actualizar datos de un usuario
const actualizarUsuario = async (req, res) => {
  const userId = parseInt(req.params.id);
  const cambios = { ...req.body };
  const campos = Object.keys(cambios);

  if (!campos.length)
    return res
      .status(400)
      .json({ error: "No se enviaron campos para actualizar" });

  try {
    // Si viene password, hashearlo
    if (cambios.password) {
      cambios.password = await bcrypt.hash(cambios.password, 10);
    }

    const valores = campos.map((campo) => cambios[campo]);
    const asignaciones = campos.map((campo) => `${campo} = ?`).join(", ");
    valores.push(userId);

    const [resultado] = await pool.query(
      `UPDATE usuarios SET ${asignaciones} WHERE id_usuario = ?`,
      valores
    );

    if (resultado.affectedRows === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error actualizando usuario", details: err.message });
  }
};

//Eliminar un usuario
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM usuarios WHERE id_usuario = ?",
      [id]
    );
    if (!result.affectedRows)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error al eliminar usuario", error: err.message });
  }
};

module.exports = {
  login,
  crearUsuario,
  getUsuarios,
  getUsuario,
  actualizarUsuario,
  eliminarUsuario,
};
