const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionsBitField,
	ChannelType,
	RoleManager,
} = require("discord.js");
const axios = require("axios");
const spamDetection = require("../../Schemas/spamDetection");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("automod")
		.setDescription("Landa un sistema de autoMod")
		.addSubcommand((command) =>
			command
				.setName("anti-links")
				.setDescription("bloquea todos los links en este servidor")
				.addChannelOption((option) =>
					option
						.setName("alert-channel")
						.setDescription("Canal para enviar alertas")
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText)
				)
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("canal permitido para enviar links")
						.addChannelTypes(ChannelType.GuildText)
				)
				.addRoleOption((option) =>
					option
						.setName("rol")
						.setDescription("Rol permitido para enviar links")
				)
		)
		.addSubcommand((command) =>
			command
				.setName("mention-spam")
				.setDescription("Bloquea el spam de menciones")
				.addChannelOption((option) =>
					option
						.setName("mentions-alert")
						.setDescription("Canal para enviar alertas")
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText)
				)
				.addIntegerOption((option) =>
					option
						.setName("timeout")
						.setDescription("Aislar al miembro, maximo 40320 minutos (4 weeks)")
				)
		)
		.addSubcommand((command) =>
			command
				.setName("spam-messages")
				.setDescription("Bloquea los mensajes de spam")
				.addStringOption((option) =>
					option
						.setName("mensajes-duplicados")
						.setDescription(
							"Activa o descativa la deteccion de mensajes duplicados."
						)
						.addChoices(
							{ name: `Activar Anti mensajes Duplicados`, value: `activar` },
							{ name: `Desactivar Anti mensajes Duplicados`, value: `desactivar` }
						)
						.setRequired(true)
				)
				.addChannelOption((option) =>
					option
						.setName("alert-channel")
						.setDescription("Canal para enviar las alertas")
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText)
				)
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("canal permitido para enviar mensajes duplicados")
						.addChannelTypes(ChannelType.GuildText)
				)
				.addRoleOption((option) =>
					option
						.setName("rol")
						.setDescription("Rol permitido para enviar mensajes duplicados")
				)
				.addStringOption((option) =>
					option
						.setName("max-duplcate")
						.setDescription(
							"Escribe el numero maximo de veces que pueden enviar un mismo mensaje en menos de 5 minutos."
						)
				)
		)
		.addSubcommand((command) =>
			command
				.setName("keyword")
				.setDescription("Bloquea una palabra especidifca en este servidor")
				.addStringOption((option) =>
					option
						.setName("word")
						.setDescription("Escribe la palabra a bloquear")
						.setRequired(true)
				)
		)
		.addSubcommand((command) =>
			command
				.setName("anti-invites")
				.setDescription("Bloquea todas las invitaciones de discord")
		)
		.addSubcommand((command) =>
			command
				.setName("flagged-words")
				.setDescription("Bloquea el contenido sexual, profano o los insultos")
		)
		.addSubcommand((command) =>
			command
				.setName("lista")
				.setDescription(
					"Muestra una lista con las reglas de AutoModeracion del servidor."
				)
		)
		.addSubcommand((command) =>
			command
				.setName("eliminar")
				.setDescription("Elimina una regla de AutoModeracion del servidor.")
				.addStringOption((option) =>
					option
						.setName("regla")
						.setDescription("ingresa el iD de la regla que quieres eliminar")
						.setRequired(true)
				)
		)
		.setDMPermission(false),

	async execute(interaction, client) {
		const { guild, options } = interaction;
		const sub = options.getSubcommand();

		if (
			!interaction.member.permissions.has(
				PermissionsBitField.Flags.Administrator
			)
		)
			return await interaction.reply({
				content: `No tienes permisos para usar este comando en este servidor`,
				ephemeral: true,
			});

		try {
			switch (sub) {
				case "flagged-words":
					try {
						await interaction.reply({
							content: `Configurando regla de autoMod...`,
						});
						const rule = await guild.autoModerationRules
							.create({
								name: `Bloqueo de palabras marcadas by: ${client.user.tag}`,
								creatorId: `${client.user.id}`,
								enabled: true,
								eventType: 1,
								triggerType: 4,
								triggerMetadata: {
									baseType: 4,
									presets: [1, 2, 3],
									allowList: [],
									regexPatterns: [],
								},
								actions: [
									{
										type: 1,
										metadata: {
											channel: interaction.channel,
											durationSeconds: 10,
											customMessage: `Mensaje bloqueado by ${client.user.tag}. sistema de AutoMod.`,
										},
									},
								],
							})
							.catch(async (err) => {
								setTimeout(async () => {
									console.log(err);
									await interaction.editReply({ content: `${err}` });
								}, 2000);
							});
						setTimeout(async () => {
							if (!rule) return;
							const embed = new EmbedBuilder()
								.setColor("Random")
								.setDescription(
									`Regla de AutoMod creada by ${client.user.tag}, todo el contenido marcado sera bloqueado`
								)
								.setTimestamp()
								.setFooter({
									text: `${client.user.tag} || ${client.ws.ping}ms`,
									iconURL: client.user.displayAvatarURL(),
								});
							await interaction.editReply({ content: ``, embeds: [embed] });
						}, 3000);
					} catch (error) {
						console.log(error);
						await interaction.followUp({
							content: `Ocurrio un error al intentar crear esta regla, por favor intentalo en 15 segundos.`,
						});
						setTimeout(async () => {
							await interaction.editReply().catch(() => {});
						}, 5000);
					}
					break;
				case "keyword":
					try {
						await interaction.reply({ content: `Creando regla de AutoMod` });
						const word = options.getString("word");
						const rule2 = await guild.autoModerationRules
							.create({
								name: `Palabra bloqueada ${word} by: ${client.user.tag}`,
								creatorId: `${client.user.id}`,
								enabled: true,
								eventType: 1,
								triggerType: 1,
								triggerMetadata: {
									keywordFilter: [`${word}`],
								},
								actions: [
									{
										type: 1,
										metadata: {
											channel: interaction.channel,
											durationSeconds: 10,
											customMessage: `Mensaje bloquado by ${client.user.tag}. sistema de AutoMod.`,
										},
									},
								],
							})
							.catch(async (err) => {
								setTimeout(async () => {
									console.log(err);
									await interaction.editReply({ content: `${err}` });
								}, 2000);
							});
						setTimeout(async () => {
							if (!rule2) return;
							const embed2 = new EmbedBuilder()
								.setColor("Random")
								.setDescription(
									`Regla creada correctamente, la palbra ${word} esta bloquada en el servidor by ${client.user.tag}`
								)
								.setTimestamp()
								.setFooter({
									text: `${client.user.tag} || ${client.ws.ping}ms`,
									iconURL: client.user.displayAvatarURL(),
								});
							await interaction.editReply({ content: ``, embeds: [embed2] });
						}, 3000);
					} catch (error) {
						console.log(error);
						await interaction.followUp({
							content: `Ocurrio un error al intentar crear esta regla, por favor intentalo en 15 segundos.`,
						});
						setTimeout(async () => {
							await interaction.editReply().catch(() => {});
						}, 5000);
					}
					break;
					
					case "spam-messages":
					const permch = options.getChannel("channel");
					const permrol = options.getRole("rol");
					const alertch = options.getChannel("alert-channel");
					const maxDp = options.getString("max-duplcate");
					const spamDp = options.getString("mensajes-duplicados")
					// guardar servidor en la db para ejecutar el spam detection

					const spamDel = await spamDetection.findOne({
						guildId: interaction.guild.id,
					});
					
					if (spamDp === "activar") {
						if (spamDel) {
							const embed = new EmbedBuilder()
								.setAuthor({
									name: `Spam Detection`,
									iconURL: client.user.displayAvatarURL(),
								})
								.addFields({
									name: `❌ | Error`,
									value: `Este servidor ya tiene un sistema anti-spam de mensajes activo`,
								})
								.setColor("Red")
								.setFooter({
									text: `${client.user.tag} || ${client.ws.ping}Ms`,
									iconURL: client.user.displayAvatarURL(),
								});
							interaction.reply({ embeds: [embed] });
						} else {
							const spamDel = new spamDetection({
								guildId: guild.id,
								permCh: permch,
								permRole: permrol,
								alertChannel: alertch,
								maxDuplicate: maxDp,
							});
							await spamDel.save();
						}
					} else if (spamDp === "desactivar") {
						await spamDetection.findOneAndDelete({ guildId: interaction.guild.id })
					}

					try {
						await interaction.reply({ content: `Creando regla de AutoMod` });
						const rule3 = await guild.autoModerationRules
							.create({
								name: `Anti Spam by: ${client.user.tag}`,
								creatorId: `${client.user.id}`,
								enabled: true,
								eventType: 1,
								triggerType: 3,
								triggerMetadata: {
									// mentionTotalLimit: number
								},
								actions: [
									{
										type: 1,
										metadata: {
											channel: interaction.channel,
											durationSeconds: 10,
											customMessage: `Mensaje bloquado by ${client.user.tag} sistema de AutoMod.`,
										},
									},
									{
										type: 2,
										metadata: { channel: `${alertch.id}` },
									},
								],
								exemptChannels: permch ? [permch.id] : [],
								exemptRoles: permrol ? [permrol.id] : [],
							})
							.catch(async (err) => {
								setTimeout(async () => {
									console.log(err);
									await interaction.editReply({ content: `${err}` });
								}, 2000);
							});
						setTimeout(async () => {
							if (!rule3) return;
							const embed3 = new EmbedBuilder()
								.setColor("Random")
								.setDescription(
									`Regla creada correctamente, todo mensaje sospechoso de spam sera bloqueado by ${client.user.tag}`
								)
								.addFields(
									{
										name: `> Canal para las alertas.`,
										value: `${alertch || "No definido"}`,
									},
									{
										name: `Canal donde esta permitido enviar mensajes duplicados.`,
										value: `${permch || "No definido"}`,
									},
									{
										name: `Rol que tiene permitido hacer spam.`,
										value: `${permrol || "No definido"}`,
									},
									{
										name: `Cantidad de veces maxima que se puede enviar un mismo mensaje en menos de 5 minutos.`,
										value: `${maxDp || "No definido"}`,
									},
									{
										name: `Deteccion de mensajes duplicados`,
										value: `${spamDp || "No definido"}`
									}
								)
								.setTimestamp()
								.setFooter({
									text: `${client.user.tag} || ${client.ws.ping}ms`,
									iconURL: client.user.displayAvatarURL(),
								});
							await interaction.editReply({ content: ``, embeds: [embed3] });
						}, 3000);
					} catch (error) {
						console.log(error);
						await interaction.followUp({
							content: `Ocurrio un error al intentar crear esta regla.`,
						});
						setTimeout(async () => {
							await interaction.editReply().catch(() => {});
						}, 5000);
					}

					break;

				case "mention-spam":
					const aChannel = interaction.options.getChannel("mentions-alert");
					const timeoutSecons = interaction.options.getInteger("timeout");
					const timeoutM = timeoutSecons * 60;

					try {
						await interaction.reply({ content: `Creando regla de AutoMod` });
						const rule4 = await guild.autoModerationRules
							.create({
								name: `Anti Spam de menciones by: ${client.user.tag}`,
								creatorId: `${client.user.id}`,
								enabled: true,
								eventType: 1,
								triggerType: 1,
								triggerMetadata: {
									regexPatterns: [
										"((<@[&!]?[\\d]+>\\s*){4,}|(<#[&!]?[\\d]+>\\s*){4,}|(<@&[\\d]+>\\s*){4,}|(@\\S+\\s*){4,})",
									],
								},
								actions: [
									{
										type: 1,
										metadata: {
											channel: interaction.channel,
											durationSeconds: 10,
											customMessage: `Mensaje bloquado by ${client.user.tag} sistema de AutoMod.`,
										},
									},
									{
										type: 2,
										metadata: { channel: `${aChannel.id}` },
									},
									{
										type: 3,
										metadata: {
											durationSeconds: timeoutM || 60,
										},
									},
								],
							})
							.catch(async (err) => {
								setTimeout(async () => {
									console.log(err);
									await interaction.editReply({ content: `${err}` });
								}, 2000);
							});
						setTimeout(async () => {
							if (!rule4) return;
							const embed4 = new EmbedBuilder()
								.setColor("Random")
								.addFields(
									{
										name: `Canal para enviar alertas`,
										value: `${aChannel} Para alertas de intento de spam de menciones.`,
									},
									{
										name: `Sancion establecida:`,
										value: `**${
											timeoutSecons ? `${timeoutM} minutos` : `60 segundos`
										}** Tiempo de aislamiento.`,
									}
								)
								.setDescription(
									`Regla creada correctamente, todo mensaje con exceso de menciones sera bloqueado. by ${client.user.tag}`
								)
								.setTimestamp()
								.setFooter({
									text: `${client.user.tag} || ${client.ws.ping}ms`,
									iconURL: client.user.displayAvatarURL(),
								});
							await interaction.editReply({ content: ``, embeds: [embed4] });
						}, 3000);
					} catch (error) {
						console.log(error);
						await interaction.followUp({
							content: `Ocurrio un error al intentar crear esta regla, por favor intentalo en 15 segundos.`,
						});
						setTimeout(async () => {
							await interaction.editReply().catch(() => {});
						}, 5000);
					}
					break;

				case "anti-links":
					const permChannel = interaction.options.getChannel("channel");
					const alertChannel = interaction.options.getChannel("alert-channel");
					const permRol = interaction.options.getRole("rol");
					try {
						await interaction.reply({ content: `Creando regla de AutoMod` });
						const rule5 = await guild.autoModerationRules
							.create({
								name: `Anti Links by: ${client.user.tag}`,
								creatorId: `${client.user.id}`,
								enabled: true,
								eventType: 1,
								triggerType: 1,
								triggerMetadata: {
									regexPatterns: ["http", ".com", ".gg", ".gif"],
									allowList: [
										"*.gif",
										"*.jpeg",
										"*.jpg",
										"*.png",
										".webp*",
										"*http://open.spotify.com/*",
										"*https://open.spotify.com/*",
										"*http://tenor.com/*",
										"*https://tenor.com/*",
									],
								},
								actions: [
									{
										type: 1,
										metadata: {
											channel: interaction.channel,
											durationSeconds: 10,
											customMessage: `Links bloquados por by ${client.user.tag}. sistema de AutoMod.`,
										},
									},
									{
										type: 2,
										metadata: { channel: `${alertChannel.id}` },
									},
								],
								exemptChannels: permChannel ? [permChannel.id] : [],
								exemptRoles: permRol ? [permRol.id] : [],
							})
							.catch(async (err) => {
								setTimeout(async () => {
									console.log(err);
									await interaction.editReply({ content: `${err}` });
								}, 2000);
							});
						setTimeout(async () => {
							if (!rule5) return;
							const embed5 = new EmbedBuilder()
								.setColor("Random")
								.setDescription(
									`Regla creada correctamente, ahora todos los links son bloqueados, escepto los de spotify. by ${client.user.tag}.`
								)
								.addFields(
									{
										name: `Canal para enviar alertas`,
										value: `${alertChannel} Para alertas de intento de enviar links.`,
									},
									{
										name: `Canal permitido:`,
										value: `**${
											permChannel ? `${permChannel}` : `Ningun canal`
										}** esta habilitado para que cualquier miembro envie links.`,
									},
									{
										name: `Rol permitodo:`,
										value: `**${
											permRol ? `${permRol}` : `Ningun Rol`
										}** tiene permitido enviar links en todo el servidor.`,
									}
								)
								.setTimestamp()
								.setFooter({
									text: `${client.user.tag} || ${client.ws.ping}ms`,
									iconURL: client.user.displayAvatarURL(),
								});
							await interaction.editReply({ content: ``, embeds: [embed5] });
						}, 3000);
					} catch (error) {
						console.log(error);
						await interaction.followUp({
							content: `Ocurrio un error al intentar crear esta regla, por favor intentalo en 15 segundos.`,
						});
						setTimeout(async () => {
							await interaction.editReply().catch(() => {});
						}, 5000);
					}
					break;

				case "anti-invites":
					try {
						await interaction.reply({ content: `Creado regla de AutoMod` });
						const rule6 = await guild.autoModerationRules
							.create({
								name: `Anti Invitaciones by: ${client.user.tag}`,
								creatorId: `${client.user.id}`,
								enabled: true,
								eventType: 1,
								triggerType: 1,
								triggerMetadata: {
									regexPatterns: [
										"discord(?:.com|app.com|.gg)[/invite/]?(?:[a-zA-Z0-9-]{2,32})",
									],
								},
								actions: [
									{
										type: 1,
										metadata: {
											channel: interaction.channel,
											durationSeconds: 10,
											customMessage: `Invitaciones de discord bloquadas by ${client.user.tag}. sistema de AutoMod.`,
										},
									},
								],
							})
							.catch(async (err) => {
								setTimeout(async () => {
									console.log(err);
									await interaction.editReply({ content: `${err}` });
								}, 2000);
							});
						setTimeout(async () => {
							if (!rule6) return;
							const embed6 = new EmbedBuilder()
								.setColor("Random")
								.setDescription(
									`Regla creada correctamente, ahora todas las invitaciones de otros servidores son bloqueadas. by ${client.user.tag}`
								)
								.setTimestamp()
								.setFooter({
									text: `${client.user.tag} || ${client.ws.ping}ms`,
									iconURL: client.user.displayAvatarURL(),
								});
							await interaction.editReply({ content: ``, embeds: [embed6] });
						}, 3000);
					} catch (error) {
						console.log(error);
						await interaction.followUp({
							content: `Ocurrio un error al intentar crear esta regla, por favor intentalo en 15 segundos.`,
						});
						setTimeout(async () => {
							await interaction.editReply().catch(() => {});
						}, 5000);
					}
					break;

				case "lista":
					try {
						const guildId = interaction.guild.id;
						const guildToken = interaction.client.token;

						const response = await axios.get(
							`https://discord.com/api/v9/guilds/${guildId}/auto-moderation/rules`,
							{
								headers: {
									Authorization: `Bot ${guildToken}`,
								},
							}
						);

						const automodRules = response.data;
						const actionTypes = {
							1: "Bloquear mensaje",
							2: "Enviar alerta",
							3: "Aislar miembro",
						};

						const embed = new EmbedBuilder()
							.setTitle("Reglas de Auto Moderación")
							.setColor("e7453c");

						if (automodRules.length === 0) {
							embed
								.addFields(
									{
										name: "> Información no disponible.",
										value:
											"No encontre ninguna regla de Auto Moderación en este servidor.",
									},
									{
										name: "> Si quieres crear algunas reglas.",
										value:
											"Puedes usar mi comando </automod anti-links:1109583268023648296>.\n",
									}
								)
								.setImage(
									`https://cdn.discordapp.com/attachments/1108782554762461234/1111041086304047204/automod.png`
								);
						} else {
							automodRules.forEach((rule) => {
								const exemptRoles =
									rule.exempt_roles && rule.exempt_roles.length > 0
										? rule.exempt_roles
												.map((roleId) => {
													const role =
														interaction.guild.roles.cache.get(roleId);
													return role ? role.name : roleId;
												})
												.join(", ")
										: ["No hay roles exemptos de esta regla."];

								const exemptChannels =
									rule.exempt_channels && rule.exempt_channels.length > 0
										? rule.exempt_channels
												.map((channelId) => {
													const channel =
														interaction.guild.channels.cache.get(channelId);
													return channel ? channel.name : channelId;
												})
												.join(", ")
										: ["No hay canales exemptos de esta regla."];

								const ruleInfo = [
									`**ID:** ${rule.id}`,
									`**Creador:** <@${rule.creator_id}>`,
									`**Acciones:** ${rule.actions
										.map((action) => actionTypes[action.type])
										.join(", ")}`,
									`**Roles exemptos:** ${exemptRoles} `,
									`**Canales exemptos:** ${exemptChannels} `,
									`**Estado:** ${
										rule.enabled ? "Habilitado" : "Deshabilitado"
									}`,
								].join("\n");

								embed.addFields({
									name: `> ${rule.name}`,
									value: `${ruleInfo}`,
								});
							});
						}
						await interaction.reply({ embeds: [embed] });
					} catch (error) {
						const embed = new EmbedBuilder()
							.setTitle("❌ | Error")
							.setDescription(
								`Error al obtener las reglas de AutoMod\n${error}`
							)
							.setFooter({
								text: `${client.user.tag} || ${client.ws.ping}Ms`,
								iconURL: client.user.displayAvatarURL(),
							});

						interaction.reply({ embeds: [embed] });
					}
					break;

				case "eliminar":
					try {
						const guildId = interaction.guild.id;
						const ruleId = interaction.options.getString("regla");

						// Obtener los detalles de la regla
						const ruleResponse = await axios.get(
							`https://discord.com/api/v9/guilds/${guildId}/auto-moderation/rules/${ruleId}`,
							{
								headers: {
									Authorization: `Bot ${interaction.client.token}`,
								},
							}
						);

						const ruleName = ruleResponse.data.name; // Obtener el nombre de la regla

						// Eliminar la regla
						const response = await axios.delete(
							`https://discord.com/api/v9/guilds/${guildId}/auto-moderation/rules/${ruleId}`,
							{
								headers: {
									Authorization: `Bot ${interaction.client.token}`,
								},
							}
						);

						if (response.status === 204) {
							const embed = new EmbedBuilder()
								.setTitle("Regla eliminada")
								.setDescription(
									`Se eliminó la regla de AutoMod "**${ruleName}**" con ID: **${ruleId}**`
								)
								.setColor("#00ff00");

							await interaction.reply({ embeds: [embed] });
						} else {
							const embed = new EmbedBuilder()
								.setTitle("❌ | Error")
								.setDescription(
									"Ocurrió un error al eliminar la regla de AutoMod"
								)
								.setColor("#ff0000");

							await interaction.reply({ embeds: [embed] });
						}
					} catch (error) {
						const embed = new EmbedBuilder()
							.setTitle("❌ | Error")
							.setDescription(
								`Ocurrió un error al eliminar la regla de AutoMod\n${error}`
							)
							.setColor("#ff0000")
							.setFooter({
								text: `${client.user.tag} || ${client.ws.ping}Ms`,
								iconURL: client.user.displayAvatarURL(),
							});

						await interaction.reply({ embeds: [embed] });
					}
					break;
			}
		} catch (error) {
			await interaction.channel.send(
				"No tengo permisos para lanzar mi sistema de AutoMod en este servidor :c"
			);
		}
	},
};
