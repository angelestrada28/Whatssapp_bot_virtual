// 📌 Importar dependencias necesarias
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const readline = require("readline");
const xlsx = require("xlsx");
const fs = require("fs");

// 🟢 Configurar variables de entorno (para Railway)
require("dotenv").config();

// 🟢 Crear cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(), // Guarda sesión para que no pida QR cada vez
});

// 🟢 Crear interfaz para entrada de usuario
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 🟢 Función para preguntar al usuario
const preguntar = (pregunta) => {
    return new Promise(resolve => {
        rl.question(pregunta, (respuesta) => {
            resolve(respuesta);
        });
    });
};

// 📌 Función para obtener contactos desde Excel
const obtenerContactosDesdeExcel = async () => {
    const archivo = await preguntar("📂 Ingresa el nombre del archivo de Excel (ej: contactos.xlsx): ");
    
    if (!fs.existsSync(archivo)) {
        console.log("❌ El archivo no existe. Verifica el nombre e intenta de nuevo.");
        rl.close();
        process.exit(1);
    }

    const workbook = xlsx.readFile(archivo);
    const hojas = workbook.SheetNames;
    
    console.log("\n📋 Hojas disponibles:");
    hojas.forEach((hoja, i) => console.log(`${i + 1}. ${hoja}`));

    const indice = await preguntar("\n🔢 Ingresa el número de la hoja que quieres usar: ");
    const nombreHoja = hojas[indice - 1];

    if (!nombreHoja) {
        console.log("❌ Opción no válida.");
        rl.close();
        process.exit(1);
    }

    const worksheet = workbook.Sheets[nombreHoja];
    const datos = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Se asume que los números están en la primera columna
    const contactos = datos.map(row => row[0]).filter(numero => typeof numero === "number");

    return contactos.map(numero => "52" + numero.toString() + "@c.us"); // Formato internacional
};

// 📌 Configuración del cliente WhatsApp
client.on("qr", (qr) => {
    console.log("Escanea este código QR con tu WhatsApp:");
    qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
    console.log("✅ Bot de WhatsApp conectado y listo para enviar mensajes.");

    const contactos = await obtenerContactosDesdeExcel();
    const mensaje = await preguntar("✍️ Escribe el mensaje a enviar: ");
    
    console.log(`📤 Enviando mensajes a ${contactos.length} contactos...`);

    for (const numero of contactos) {
        client.sendMessage(numero, mensaje)
            .then(() => console.log(`✅ Mensaje enviado a ${numero}`))
            .catch(err => console.log(`❌ Error enviando a ${numero}: ${err}`));
    }

    rl.close();
});

// 📌 Iniciar cliente
client.initialize();

// 🔹 Mantener servidor activo en Railway
const PORT = process.env.PORT || 3000;
require("http").createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot de WhatsApp activo 🚀");
}).listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
