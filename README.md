An open-source standalone content moderation discord bot for 42 Wolfsburg coded in Typescript
with [Discord.js](https://discord.js.org)

# Pre-reqs
To build and run this bot, you will need a few things:
- Install [Node.js](https://nodejs.org/en/)
- (Optional) Install [Docker](https://www.docker.com/get-started)

# Installation

- Clone the repository
```
git clone https://github.com/Yuerino/CoMo-Bot.git
```
- Install dependencies
```
cd CoMo-Bot
npm install
```
- Build the project
```
npm run build
```

# Edit the configuration

You need to edit the `config_example.json` file with your configuration and rename it to `config.js`

- `botToken`: Your discord bot token, you can get it [here](https://discord.com/developers/applications)
- `guildIDs`: List of guild ID strings that the bot will listen for changes. You can get guild ID by enabling `Developer Mode` on Discord, then right-click on Discord server and select `Copy ID`
- `ticketChannelID`: ID of the channel that bot will post new Ticket in. Similarly, you can right-click and copy its channel ID
- `reportEmoji`: The emoji to flag/report the message
- `onDutyStaffIDs`: List of on-duty staff IDs. These staffs will get notified by bot when there are new tickets.
- `environment`: either `"prod"` for production or `"dev"` for development usage.

# Launch the bot

To launch the bot, you can simply run the following command
```
npm run start:prod
```
Alternatively you can also use Docker if you have installed it
```
docker build -t comobot .
docker run -d comobot
```
If you want to launch bot for development usage
```
npm run start:dev
```

# Bot Permissions and Intents

To update your bot permissions, scopes and intents, please head to [Discord Developer Portal](https://discord.com/developers/applications), select your application (Bot) and update changes there.

- Your bot will be required at least these permissions and scopes in order to work properly

![bot permissions](https://i.imgur.com/d40dqH7.png)

- Your bot should also have these intents enabled

![bot intents](https://i.imgur.com/E3Gug8K.png)