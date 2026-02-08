const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Inicializa una nueva jornada
 * Resetea todos los contadores a 0
 */
exports.inicializarJornada = functions.https.onRequest(async (req, res) => {
  try {
    const jornadaNumero = Number(req.query.jornada) || 1;

    const partidos = {};
    for (let i = 1; i <= 14; i++) {
      partidos[i] = { "1": 0, "X": 0, "2": 0 };
    }

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

    res.send(`Jornada ${jornadaNumero} inicializada correctamente`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error inicializando la jornada");
  }
});
