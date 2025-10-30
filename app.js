// app.js
const express = require("express");
const app = express();
const PORT = 3000;
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "marketplace",
  port: 3306,
});
app.use(express.json());
app.get("/", (req, res) => {
  res.send("¡Hola Mundo desde Express!");
});
app.post("/", function (req, res) {
  res.send("POST request to the homepage");
});

app.get("/usuarios", (req, res) => {
  connection.query("SELECT * FROM usuarios", (err, results) => {
    if (err) return res.status(500).send("Error en la base de datos");
    res.json(results);
  });
});
app.post("/usuarios", (req, res) => {
  const { nombre, password, email, direccion, telefono, rol } = req.body;

  const rolFinal = rol ?? "usuario";

  connection.query(
    "INSERT INTO usuarios (nombre, password, email, direccion, telefono, rol) VALUES (?,?,?,?,?,?)",
    [nombre, password, email, direccion, telefono, rolFinal],
    (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error en el servidor", error: err });
      }
      res.json({ message: "Usuario creado correctamente" });
    }
  );
});

app.delete("/usuario/:id", (req, res) => {
  const { id } = req.params;

  connection.query(
    "DELETE FROM usuarios WHERE id_usuario = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).send("Error al borrar el usuario");

      if (results.affectedRows === 0)
        return res.status(404).send("Usuario no encontrado");

      res.json({ message: "Usuario eliminado correctamente" });
    }
  );
});

app.post("/productos", (req, res) => {
  const {
    nombre,
    id_categoria,
    precio,
    stock,
    oferta,
    imagen,
    especificaciones,
    resena,
  } = req.body;

  const productoQuery = `INSERT INTO Productos (nombre, id_categoria, precio, stock, oferta, imagen) 
                         VALUES (?, ?, ?, ?, ?, ?)`;
  connection.query(
    productoQuery,
    [nombre, id_categoria, precio, stock, oferta, imagen],
    (err, productoResult) => {
      if (err) {
        console.error("Error al crear producto:", err);
        return res
          .status(500)
          .json({ message: "Error al crear el producto", error: err });
      }

      const idProducto = productoResult.insertId;

      if (Array.isArray(especificaciones) && especificaciones.length > 0) {
        let specsCompleted = 0;
        especificaciones.forEach((spec) => {
          connection.query(
            `INSERT INTO especificaciones (nombre, descripcion, id_producto) VALUES (?, ?, ?)`,
            [spec.nombre, spec.descripcion, idProducto],
            (err) => {
              if (err) console.error("Error al insertar especificación:", err);

              specsCompleted++;
              // Cuando todas las especificaciones terminen, insertamos la reseña
              if (specsCompleted === especificaciones.length) insertResena();
            }
          );
        });
      } else {
        insertResena();
      }

      function insertResena() {
        if (resena) {
          connection.query(
            `INSERT INTO Resenas (id_producto, valoracion, descripcion) VALUES (?, ?, ?)`,
            [idProducto, resena.valoracion, resena.descripcion],
            (err) => {
              if (err) console.error("Error al insertar reseña:", err);
              res.status(201).json({
                message: "Producto creado con éxito",
                id_producto: idProducto,
              });
            }
          );
        } else {
          res.status(201).json({
            message: "Producto creado con éxito",
            id_producto: idProducto,
          });
        }
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
