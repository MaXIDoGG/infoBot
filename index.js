require('dotenv').config()
const TelegramApi = require('node-telegram-bot-api')
const sequelize = require('./db')
const UserModel = require('./models')
const {checkVoiceChannels, client} = require('./dsBot')

const tgToken = process.env.tgToken

const bot = new TelegramApi(tgToken, {polling: true})


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