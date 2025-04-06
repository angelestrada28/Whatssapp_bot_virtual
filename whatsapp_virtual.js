const xlsx = require("xlsx");
const readline = require("readline");
const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = new Client();

client.on("qr", qr => {
    qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
    console.log("✅ Cliente de WhatsApp listo!");
    
    // Preguntar por el archivo de Excel
    rl.question("📂 Ingresa la ruta del archivo Excel: ", (filePath) => {
        if (!fs.existsSync(filePath)) {
            console.log("❌ Archivo no encontrado. Verifica la ruta.");
            rl.close();
            return;
        }
        
        // Cargar el archivo de Excel
        const workbook = xlsx.readFile(filePath);
        console.log("📑 Hojas disponibles: ", workbook.SheetNames);
        
        rl.question("📜 Ingresa el nombre de la hoja: ", (sheetName) => {
            if (!workbook.SheetNames.includes(sheetName)) {
                console.log("❌ Hoja no encontrada en el archivo.");
                rl.close();
                return;
            }
            
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

            // Extraer los números de la columna C (índice 2)
            const phoneNumbers = data.slice(1).map(row => row[2]).filter(num => num);

            if (phoneNumbers.length === 0) {
                console.log("❌ No se encontraron números en la columna C.");
                rl.close();
                return;
            }

            console.log("📋 Números obtenidos:", phoneNumbers);

            // Preguntar por el mensaje manualmente
            rl.question("✍ Escribe el mensaje a enviar: ", async (message) => {
                if (!message) {
                    console.log("❌ No se puede enviar un mensaje vacío.");
                    rl.close();
                    return;
                }
                
                console.log("📤 Enviando mensajes...");
                
                for (const phoneNumber of phoneNumbers) {
                    const cleanNumber = phoneNumber.toString().trim();
                    if (cleanNumber.length >= 10) {
                        const formattedNumber = `52${cleanNumber}@c.us`;
                        try {
                            await client.sendMessage(formattedNumber, message);
                            console.log(`✅ Mensaje enviado a: ${cleanNumber}`);
                        } catch (error) {
                            console.log(`❌ Error enviando a ${cleanNumber}:`, error);
                        }
                    }
                }
                
                console.log("🏁 Proceso terminado.");
                rl.close();
            });
        });
    });
});

client.initialize();
