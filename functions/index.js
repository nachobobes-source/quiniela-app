const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

/**
 * ---------------------------------------------------------
 * FUNCIÓN 1: Inicializar jornada
 * Resetea todos los contadores a 0
 * Se puede llamar al empezar cada nueva jornada
 * ---------------------------------------------------------
 *
 * Uso (ejemplo):
 *   https://<url>/inicializarJornada?jornada=5
 */
exports.inicializarJornada = functions.https.onRequest(async (req, res) => {
  try {
    const jornadaNumero = Number(req.query.jornada) || 1;

    // Partidos 1 al 14
    const partidos = {};
    for (let i = 1; i <= 14; i++) {
      partidos[i] = { "1": 0, "X": 0, "2": 0 };
    }

    // Pleno al 15
    const pleno15 = {
      local: { "1": 0, "2": 0, "3+": 0 },
      visitante: { "1": 0, "2": 0, "3+": 0 }
    };

    await db
      .collection("jornada_actual")
      .doc("datos")
      .set({
        jornada: jornadaNumero,
        partidos,
        pleno15
      });

    res.status(200).send(`Jornada ${jornadaNumero} inicializada correctamente`);
  } catch (error) {
    console.error("Error inicializando jornada:", error);
    res.status(500).send("Error inicializando la jornada");
  }
});

/**
 * ---------------------------------------------------------
 * FUNCIÓN 2: Registrar voto
 * Incrementa los contadores correspondientes
 * ---------------------------------------------------------
 *
 * Espera un JSON con este formato:
 * {
 *   "pronosticos": {
 *     "p1": "1",
 *     "p2": "X",
 *     ...
 *     "p14": "2"
 *   },
 *   "pleno15": {
 *     "ganador": "local" | "visitante",
 *     "goles": "1" | "2" | "3+"
 *   }
 * }
 */
exports.votar = functions.https.onRequest(async (req, res) => {
  try {
    const { pronosticos, pleno15 } = req.body;

    if (!pronosticos || !pleno15) {
      return res.status(400).send("Datos incompletos");
    }

    const updates = {};

    // Partidos 1 al 14
    for (let i = 1; i <= 14; i++) {
      const voto = pronosticos[`p${i}`];

      if (!["1", "X", "2"].includes(voto)) {
        return res
          .status(400)
          .send(`Voto inválido en el partido ${i}`);
      }

      updates[`partidos.${i}.${voto}`] =
        admin.firestore.FieldValue.increment(1);
    }

    // Pleno al 15
    const { ganador, goles } = pleno15;

    if (!["local", "visitante"].includes(ganador)) {
      return res.status(400).send("Ganador inválido en el pleno al 15");
    }

    if (!["1", "2", "3+"].includes(goles)) {
      return res.status(400).send("Goles inválidos en el pleno al 15");
    }

    updates[`pleno15.${ganador}.${goles}`] =
      admin.firestore.FieldValue.increment(1);

    await db
      .collection("jornada_actual")
      .doc("datos")
      .update(updates);

    res.status(200).send("Voto registrado correctamente");
  } catch (error) {
    console.error("Error registrando voto:", error);
    res.status(500).send("Error registrando el voto");
  }
});
