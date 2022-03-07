import {ApplicationCommandDataResolvable, Client, ClientEvents, Collection, Intents} from "discord.js";
import {ICommandOptions, IDeployCommandOptions, CoMoBotConfig} from "./types";
import * as fs from 'fs';
import path from "path";
import {Event} from "./Event";
import ReportManager from "./ReportManager";

export class CoMoBot extends Client {
    public readonly commands: Collection<string, ICommandOptions> = new Collection();
    public readonly config: CoMoBotConfig;
    public reportManager?: ReportManager;

    // TODO: look up on intents
    constructor(config: CoMoBotConfig) {
        super({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
            ],
            partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
        });
        this.config = config;
    }

    async start(): Promise<void> {
        await this.registerModules();
        await this.login(this.config.botToken);

        this.reportManager = await new ReportManager(this).init();
        this.on("messageReactionAdd", this.reportManager!.messageReactionAddHandler.bind(this.reportManager));
    }

    async deployCommands({commands, guildIDs}: IDeployCommandOptions): Promise<void> {
        if (guildIDs) {
            for (const guildID of guildIDs) {
                await this.guilds.cache.get(guildID)?.commands.set(commands);
                console.log(`Deploying commands to ${guildID}`);
            }
        }
        if (this.config.environment === 'prod') {
            await this.application?.commands.set(commands);
            console.log(`Deploying commands globally`);
        }
    }

    async registerModules(): Promise<void> {
        const slashCommands: ApplicationCommandDataResolvable[] = [];
        const commandFiles: string[] = fs.readdirSync(path.join(__dirname, "../commands"))
            .filter(file => ['.ts', '.js'].some(pattern => file.endsWith(pattern)));

        for (const filePath of commandFiles) {
            const command: ICommandOptions = (await import(path.join("../commands", filePath)))?.default;
            if (!command.data.name) continue;

            this.commands.set(command.data.name, command);
            slashCommands.push(command.data.toJSON());
        }

        this.once("ready", async (): Promise<void> => {
            await this.deployCommands({
                commands: slashCommands, guildIDs: this.config.guildIDs
            });
        });

        const eventFiles: string[] = fs.readdirSync(path.join(__dirname, "../events"))
            .filter(file => ['.ts', '.js'].some(pattern => file.endsWith(pattern)));

        for (const filePath of eventFiles) {
            const event: Event<keyof ClientEvents> = (await import(path.join("../events", filePath)))?.default;
            this.on(event.event, event.run);
        }
    }
}