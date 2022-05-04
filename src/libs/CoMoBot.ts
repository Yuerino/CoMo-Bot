import {ApplicationCommandDataResolvable, Client, ClientEvents, Collection, Intents, TextChannel} from "discord.js";
import {CoMoBotConfig, DeployCommandOptions, EventOptions} from "./types";
import * as fs from 'fs';
import path from "path";
import {ReportManager} from "./ReportManager";
import {Command} from "./Command";
import {VoiceManager} from "./VoiceManager";

export class CoMoBot extends Client {
    public readonly commands: Collection<string, Command> = new Collection<string, Command>();
    public readonly config: CoMoBotConfig;
    public readonly reportManager: ReportManager;
    public readonly voiceManager: VoiceManager;

    constructor(config: CoMoBotConfig) {
        super({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
                Intents.FLAGS.GUILD_WEBHOOKS,
                Intents.FLAGS.GUILD_VOICE_STATES,
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
            ],
            partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
        });
        this.config = config;
        this.reportManager = new ReportManager({client: this, expireTime: 5 * 60 * 1000});
        this.voiceManager = new VoiceManager({client: this, deletionDelay: 30 * 60 * 1000});
    }

    public async start() {
        await this.registerModules();
        await this.login(this.config.botToken);
        await this.reportManager.init();
    }

    public async getMessageByURL(messageURL: string) {
        const messageURLSplit = messageURL.split('/');
        if (!messageURLSplit.length) return;
        const messageChannel = await this.channels.fetch(messageURLSplit[5]).catch(() => {return;});
        if (!messageChannel || !(messageChannel instanceof TextChannel)) return;
        return await messageChannel.messages.fetch(messageURLSplit[6]).catch(() => {return;});
    }

    private async deployCommands({commands, guildIDs}: DeployCommandOptions) {
        if (this.config.environment === "dev") {
            if (guildIDs) {
                for (const guildID of guildIDs) {
                    await this.guilds.cache.get(guildID)?.commands.set(commands);
                    console.log(`Deploying commands to ${guildID}`);
                }
            }
        } else if (this.config.environment === "prod") {
            if (guildIDs) {
                for (const guildID of guildIDs) {
                    await this.guilds.cache.get(guildID)?.commands.set([]);
                }
            }
            await this.application?.commands.set(commands);
            console.log(`Deploying commands globally`);
        }
    }

    private async registerModules() {
        const slashCommands: ApplicationCommandDataResolvable[] = [];
        const commandFiles = fs.readdirSync(path.join(__dirname, "../commands"))
            .filter(file => ['.ts', '.js'].some(pattern => file.endsWith(pattern)));

        for (const filePath of commandFiles) {
            const command: Command = (await import(path.join("../commands", filePath)))?.default;
            if (!command.data.name) continue;

            this.commands.set(command.data.name, command);
            slashCommands.push(command.data.toJSON());
        }

        this.once("ready", async () => {
            await this.deployCommands({commands: slashCommands, guildIDs: this.config.guildIDs});
        });

        const eventFiles = fs.readdirSync(path.join(__dirname, "../events"))
            .filter(file => ['.ts', '.js'].some(pattern => file.endsWith(pattern)));

        for (const filePath of eventFiles) {
            const event: EventOptions<keyof ClientEvents> = (await import(path.join("../events", filePath)))?.default;
            this.on(event.event, event.run);
        }

        this.on("messageReactionAdd", this.reportManager.messageReactionAddHandler.bind(this.reportManager));
        this.on("voiceStateUpdate", this.voiceManager.voiceStateUpdateHandler.bind(this.voiceManager));
    }
}
