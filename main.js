const { Client } = require("discord.js");
const client = new Client({ intents: [3243773] });
const spamDetection = require("./Schemas/schema.js");
const { handleSpamDetection } = require("./Events/spamDetection");

client.config = require("./config.json");

client
    .login(client.config.token)
    .then(() => {
    console.log(`cliente ${client.user.username} se ha iniciado`);
    client.user.setActivity(`asf`);
})
.catch((err) => console.log(err));

client.on("messageCreate", async (message) => { // detectar cada mensaje 
	if (!message.guild) {
		return; // Ignorar mensajes directos
	}
	const spamDel = await spamDetection.findOne({ // buscar el servidor em la base de datos
		guildId: message.guild.id,
	});
	if (spamDel) {
		handleSpamDetection(message, spamDel.maxDuplicate || 2 ); // ejecutar la funcion si el servidor esta en la base de datos
	} else {
		return;
	}
});

// Recuerd,a en el archivo .json, en "token", deberás poner el token de tu bot.