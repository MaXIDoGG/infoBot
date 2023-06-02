require('dotenv').config()
const { Client, GatewayIntentBits, InteractionType} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const dsToken = process.env.dsToken
const clientId = process.clientId

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]});

const commands = [
    new SlashCommandBuilder().setName('countusers').setDescription('Number of users in voice channels'),
    new SlashCommandBuilder().setName('addtelegram').setDescription('Add telegram bot'),
    new SlashCommandBuilder().setName('cool').setDescription('Picks a random person to be cool all day')
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
	} else if (commandName == 'cool') {
        let members = []
        interaction.guild.channels.cache.forEach(channel => {
            if (channel.type == 2 && channel.members.size != 0) {
                channel.members.forEach(member => {
                    members.push(member.displayName)
                })
            } else return;
        })
        if (members[0] == undefined) {
            await interaction.reply(`${interaction.member.displayName}, You are cool!`)
        } else {
            await interaction.reply(`${members[Math.floor(Math.random()*members.length)]}, You are cool!`)
        }
        
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

client.login(dsToken);

module.exports.checkVoiceChannels = checkVoiceChannels
module.exports.client = client
