const { Client, GatewayIntentBits, InteractionType} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const TelegramApi = require('node-telegram-bot-api')
const sequelize = require('./db')
const UserModel = require('./models')
const { token, clientId } = require('./config.json');

const tgToken = '5298213348:AAG4aS9wyqRekKgdz6t5lIRSwO9VnD2PyRY'

const bot = new TelegramApi(tgToken, {polling: true})


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]});

const commands = [
    new SlashCommandBuilder().setName('countusers').setDescription('Number of users in voice channels'),
    new SlashCommandBuilder().setName('addtelegram').setDescription('Add telegram bot')
].map(command => command.toJSON());

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("guildCreate", guild => {
    guild.channels.cache.some(channel => {
        if (channel.type == 0) {
            channel.send('Приветик! Я тут поселюсь, чтобы отправлять в телеграм информацию об активных пользователях в голосовых каналах')
            return true
        }
    });

    const rest = new REST({ version: '9' }).setToken(token);

    rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
});


client.on('interactionCreate', async interaction => {
	if (!(interaction.type === InteractionType.ApplicationCommand)) return;

	const { commandName } = interaction;

	if (commandName === 'countusers') {
        text = checkVoiceChannels(interaction.guild)
        await interaction.reply(text);
	} else if (commandName == 'addtelegram') {
        await interaction.reply(interaction.guild.id);
    }
});

function checkVoiceChannels(guild) {
    let text = ""
        guild.channels.cache.forEach(channel => {
            if (channel.type == 2 && channel.members.size != 0) {
                text += channel.name + ': ' + channel.members.size + '\n'
                channel.members.forEach(member => {
                    text += '   '
                    text += member.displayName
                    if (member.voice.selfDeaf) text += ' - выкл. звук'
                    else if (member.voice.selfMute) text += ' - выкл. микрофон'
                    text += '\n'
                })
            } else return;
        })
        
        if (text == "") text = "В голосовых каналах нет участников"

    return text
}

client.login(token);


////////////////

const start = async () => {
	try {
		await sequelize.authenticate()
		await sequelize.sync()
	} catch (e) {
		console.log(e)
	}

	bot.setMyCommands([
		{command: '/start', description: 'hello'},
		{command: '/info', description: 'info'}
	])

	bot.on('message', async msg => {
		const text = msg.text
		const chatId = msg.chat.id


		try {
			if (text === '/start') {
                const user = await UserModel.findOne({chatId})
                if (!(user === null)) {
                    return bot.sendMessage(chatId, 'Если вы хотите привязать другой сервер в Discord, то укажите ID сервера. Ссылка для добавления бота на сервер в Discord: https://discord.com/api/oauth2/authorize?client_id=999365645814726666&permissions=8&scope=bot')
                } else {
                    await UserModel.create({chatId})
                    await bot.sendMessage(chatId, 'Добро пожаловать!\nДля использования бота нужно добавить бота в свой Discord сервер с помощью этой ссылки: https://discord.com/api/oauth2/authorize?client_id=999365645814726666&permissions=8&scope=bot\nПозже следуйте указаниям бота в Discord')
                    return bot.sendSticker(chatId, 'https://chpic.su/_data/stickers/i/iris_vk/iris_vk_001.webp')
                }
			}

			if (text === '/info') {
				const user = await UserModel.findOne({chatId})
                console.log(user.guildId)
                let guild = client.guilds.cache.get(user.guildId)
                let text = checkVoiceChannels(guild)
				return bot.sendMessage(chatId, text)
			}
            
            if (!isNaN(text) && text.length == 18) {
                let user = await UserModel.findOne({chatId})
                user.guildId = text
                await user.save()
                return bot.sendMessage(chatId, `Готово! можешь проверять количество людей в голосовых каналах с помощью комманды: "/info"`)
            }
			return bot.sendMessage(chatId, 'Я твоя не понимать')
		} catch (e) {
			console.log(e)
			return bot.sendMessage(chatId, 'Произошла ошибка, сорян((')
		}
	})
}

start()