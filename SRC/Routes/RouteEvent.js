const express = require("express");
const router = express.Router();
const baseURL = "${req.protocol}://${req.get('host')}";
const upload = require("../Middlewares/Upload");
const Event = require("../Models/Event");
const User = require("../Models/User");

// Crear un evento y asignarlo al organizador
router.post("/events", upload.single("imgEvent"), async (req, res) => {
  try {
    const { name, description, organizer_id, imgEvent, ...otherFields } = req.body;

    // Validación básica
    if (!name || !description || !organizer_id ) {
      return res.status(400).json({ message: "Datos incompletos para crear el evento" });
    }

    // Verificar si el organizador existe
    const organizer = await User.findById(organizer_id);
    if (!organizer) {
      return res.status(404).json({ message: "Organizador no encontrado" });
    }

    // Crear el evento

    const imgEventPath = req.file ? req.file.path : null;

    if (!imgEventPath) {
      return res.status(400).json({ message: "Se requiere una imagen para el evento" });
    }



    const newEvent = new Event({ name, description, organizer_id, imgEvent: imgEventPath   , ...otherFields });
    const savedEvent = await newEvent.save();

    // Asignar el evento al organizador
    await User.updateOne(
      { _id: organizer_id },
      { $push: { "organizer.events": savedEvent._id } }
    );

    res.status(201).json({ message: "Evento creado con éxito", event: savedEvent });
  } catch (error) {
    console.error("Error al crear el evento:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

// Obtener todos los eventos
router.get("/events", async (req, res) => {
  try {
    const events = await Event.find()
      .populate("organizer_id", "first_name last_name email")
      .lean();
      const baseUrl = `${req.protocol}://${req.get('host')}/`;

    const eventsWithUrls = events.map(event => ({
      ...event,
      imgEvent: `${baseUrl}${event.imgEvent}` // Agregar URL absoluta de la imagen
    }));

    res.json(eventsWithUrls);
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

// Obtener un evento por ID
router.get("/events/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id)
      .populate("organizer_id", "first_name last_name email")
      .lean();

      const baseUrl = `${req.protocol}://${req.get('host')}/`;

    if (!event) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    res.json({
      ...event,
      imgEvent: `${baseUrl}${event.imgEvent}`
    });
  } catch (error) {
    console.error("Error al obtener el evento:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

// Actualizar un evento por ID
router.put("/events/:id", upload.single("imgEvent") , async (req, res) => {
  const { id } = req.params;
  try {
    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedEvent) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    if (req.file) {
      updatedEvent.imgEvent = req.file.filename,".jpg";
      await updatedEvent.save();
    }

    res.json({ message: "Evento actualizado con éxito", event: updatedEvent });
  } catch (error) {
    console.error("Error al actualizar el evento:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

// Eliminar un evento por ID
router.delete("/events/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const eventToDelete = await Event.findById(id);

    if (!eventToDelete) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    // Eliminar el evento de los eventos del organizador
    const updateResult = await User.updateOne(
      { _id: eventToDelete.organizer_id },
      { $pull: { "organizer.events": eventToDelete._id } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: "Organizador no encontrado o evento no asociado" });
    }

    await eventToDelete.remove();

    res.status(200).json({ message: "Evento eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar el evento:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

// Eliminar todos los eventos
router.delete("/events", async (req, res) => {
  try {
    await Event.deleteMany();

    // Limpiar los eventos en los organizadores
    await User.updateMany({}, { $set: { "organizer.events": [] } });

    res.status(200).json({ message: "Todos los eventos eliminados" });
  } catch (error) {
    console.error("Error al eliminar los eventos:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

module.exports = router;
