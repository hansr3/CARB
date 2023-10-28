// Implementation by discordjs.guide using GatewayIntentBits (incomplete -> discordjs.guide)
/*
const fs = require('node:fs');
const path = require('node:path');
// Require the necessary discord.js classes
// another implementation with GatewayIntentBits

const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { token } = require('./config.json');


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}
*/

// Implementation using IntentsBitField
// destructure discord.js library -> (deconstruct/unpackage)
// import Client and IntentsBitField from discord.js
require('dotenv/config');
const { DisTube } = require('distube');
const { Client, Events, IntentsBitField, REST } = require('discord.js');
const { token } = require('./config.json');
const { OpenAI } = require('openai');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');



// create new client object
const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.GuildVoiceStates,
	],
});



client.DisTube = new DisTube({
	leaveOnStop: false,
	emitNewSongOnly: true,
	emitAddSongWhenCreatingQueue: false,
	emitAddListWhenCreatingQueue: false,
	plugins:[
		new SpotifyPlugin({
			emitEventsAfterFetching: true
		}),
		new SoundCloudPlugin(),
		new YtDlpPlugin(),
	],
});

const openai = new OpenAI({
	apiKey: process.env.API_KEY,
});

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`💡Ready! Logged in as ${c.user.tag}`);
});

// bot listens to message create
client.on('messageCreate', async (message) => {
	if (message.author.bot || !message.guild) return;
	if (message.mentions.has(client.user.id)) {

		await message.channel.sendTyping();

		const sendTypingInterval = setInterval(() => {
			message.channel.sendTyping();
		}, 5000);

		// chat gpt responds
		const response = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{
					// name:
					role: 'system',
					content: 'a helpful talkative bot just tag it to start talking.',
				},
				{
					role: 'user',
					content: message.content,
				},
			],
		}).catch((error) => console.error('OpenAI Error:\n', error));

		clearInterval(sendTypingInterval);

		if (!response) {
			message.reply('Currently there is a problem with the OpenAI API. Please try again later. Sorry for the inconvinience :)');
			return;
		}

		// sends message separately if the response is more that 2000 character
		const responseMessage = response.choices[0].message.content;
		const chunkSizeLimit = 2000;

		for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
			const chunk = responseMessage.substring(i, i + chunkSizeLimit);

			await message.reply(chunk);
		}

		message.reply();

	}
});


client.login(token);