import {CoMoBot} from "./CoMoBot";
import {
    Collection,
    Permissions,
    CategoryChannel,
    CommandInteraction,
    VoiceChannel,
    VoiceState,
} from "discord.js";
import {VoiceManagerOptions} from "./types";

export class VoiceManager {
    private readonly client: CoMoBot;
    private readonly voiceCategoryChannel: Collection<string, CategoryChannel> = new Collection<string, CategoryChannel>();
    private readonly voiceChannels: Collection<string, Array<VoiceChannel>> = new Collection<string, Array<VoiceChannel>>();
    private readonly deletionDelay: number = 30 * 60 * 1000;

    constructor(voiceManagerOptions: VoiceManagerOptions) {
        this.client = voiceManagerOptions.client;
        if (voiceManagerOptions.deletionDelay) this.deletionDelay = voiceManagerOptions.deletionDelay;
    }

    public async voiceStateUpdateHandler(oldState: VoiceState, newState: VoiceState) {
        if (newState.channel) return;
        const voiceChannel = oldState.channel;
        if (!voiceChannel || !(voiceChannel instanceof VoiceChannel)) return;
        if (voiceChannel.members.first()) return;
        if (!this.voiceChannels.find(arr => arr.includes(voiceChannel))) return;
        this.delayVoiceDeletion(voiceChannel);
    }

    public async handleCommand(interaction: CommandInteraction) {
        if (!interaction.inGuild())
            return await interaction.reply({content:"This command can only be used in a server!", ephemeral: true});

        switch (interaction.options.getSubcommand()) {
            case "create":
                await this.createVoiceChannel(interaction);
                break;
            case "set_category":
                await this.setCategoryChannel(interaction);
                break;
            case "close":
                await this.closeVoiceChannel(interaction);
                break;
            case "change_name":
                await this.changeChannelName(interaction);
                break;
            case "change_limit":
                await this.changeChannelUserLimit(interaction);
                break;
            default:
                return await interaction.reply({content:"Something went wrong!", ephemeral:true});
        }
    }

    private async createVoiceChannel(interaction: CommandInteraction) {
        const guildId = interaction.guildId!;
        if (!this.voiceCategoryChannel.has(guildId))
            return await interaction.reply({content:"Category channel for voice channel hasn't been set, please contact admin of the server!", ephemeral:true});

        if (this.voiceChannels.get(interaction.user.id)?.at(0) && !interaction.memberPermissions!.has(Permissions.FLAGS.ADMINISTRATOR))
            return await interaction.reply({content:"You already have a voice channel, please close that one before create new one", ephemeral:true});

        let voiceChannel = await this.voiceCategoryChannel.get(guildId)!.createChannel(
            interaction.options.getString("name")!,
            {type:"GUILD_VOICE"}
            ).catch(async () => {
                await interaction.reply({content:"Failed to create channel!", ephemeral:true});
        });
        if (!voiceChannel) return;

        this.voiceChannels.ensure(interaction.user.id, () => {return []}).push(voiceChannel);
        await interaction.reply({content:`Successfully create ${interaction.options.getString("name")} voice channel.`});
        this.delayVoiceDeletion(voiceChannel);
    }

    private async setCategoryChannel(interaction: CommandInteraction) {
        if (!interaction.memberPermissions!.has(Permissions.FLAGS.ADMINISTRATOR))
            return await interaction.reply({content:"You don't have permission to use this command!", ephemeral:true});

        const categoryChannel = interaction.options.getChannel("category_channel");
        if (!(categoryChannel instanceof CategoryChannel))
            return await interaction.reply({content:"This channel isn't a category channel!", ephemeral:true});

        this.voiceCategoryChannel.set(interaction.guildId!, categoryChannel);
        await interaction.reply({content:`Successfully set ${categoryChannel.name} category channel for voice.`})
    }

    private async closeVoiceChannel(interaction: CommandInteraction) {
        let voiceChannel = interaction.options.getChannel("voice_channel");
        if (voiceChannel && !(voiceChannel instanceof VoiceChannel))
            return await interaction.reply({content:"This channel isn't a voice channel!", ephemeral:true});

        if (voiceChannel && !this.voiceChannels.get(interaction.user.id)?.includes(voiceChannel) && !interaction.memberPermissions!.has(Permissions.FLAGS.ADMINISTRATOR))
            return await interaction.reply({content:"This voice channel isn't yours!", ephemeral:true});
        if (!voiceChannel && !this.voiceChannels.get(interaction.user.id)?.at(0))
            return await interaction.reply({content:"You don't own any voice channel!", ephemeral:true});
        if (!voiceChannel)
            voiceChannel = this.voiceChannels.get(interaction.user.id)!.pop()!;

        this.voiceChannels.forEach((arr, key) => {
            this.voiceChannels.set(key, arr.filter(_channel => _channel.id != voiceChannel!.id));
        });
        try {
            await voiceChannel.delete();
        } catch {
            return await interaction.reply({content: "Failed to delete channel!", ephemeral:true});
        }
        await interaction.reply({content:`Successfully close ${voiceChannel.name} voice channel.`});
    }

    private delayVoiceDeletion(voiceChannel: VoiceChannel) {
        setTimeout(async () => {
            if (!voiceChannel.deletable) return;
            if (voiceChannel.members.first()) return;
            if (!this.voiceChannels.find(arr => arr.includes(voiceChannel))) return;
            this.voiceChannels.forEach((arr, key) => {
                this.voiceChannels.set(key, arr.filter(_channel => _channel.id != voiceChannel.id));
            });
            try { await voiceChannel.delete();} catch {}
        }, this.deletionDelay);
    }

    private async changeChannelName(interaction: CommandInteraction) {
        let voiceChannel = interaction.options.getChannel("voice_channel");
        if (voiceChannel && !(voiceChannel instanceof VoiceChannel))
            return await interaction.reply({content:"This channel isn't a voice channel!", ephemeral:true});

        if (voiceChannel && !this.voiceChannels.get(interaction.user.id)?.includes(voiceChannel) && !interaction.memberPermissions!.has(Permissions.FLAGS.ADMINISTRATOR))
            return await interaction.reply({content:"This voice channel isn't yours!", ephemeral:true});
        if (!voiceChannel && !this.voiceChannels.get(interaction.user.id)?.at(0))
            return await interaction.reply({content:"You don't own any voice channel!", ephemeral:true});
        if (!voiceChannel)
            voiceChannel = this.voiceChannels.get(interaction.user.id)!.at(0)!;

        try {
            await voiceChannel.setName(interaction.options.getString("name")!);
        } catch {
            return await interaction.reply({content: "Failed to change channel's name!", ephemeral:true});
        }
        await interaction.reply({content:`Successfully changes voice channel to ${voiceChannel.name}.`});
    }

    private async changeChannelUserLimit(interaction: CommandInteraction) {
        let voiceChannel = interaction.options.getChannel("voice_channel");
        if (voiceChannel && !(voiceChannel instanceof VoiceChannel))
            return await interaction.reply({content:"This channel isn't a voice channel!", ephemeral:true});

        if (voiceChannel && !this.voiceChannels.get(interaction.user.id)?.includes(voiceChannel) && !interaction.memberPermissions!.has(Permissions.FLAGS.ADMINISTRATOR))
            return await interaction.reply({content:"This voice channel isn't yours!", ephemeral:true});
        if (!voiceChannel && !this.voiceChannels.get(interaction.user.id)?.at(0))
            return await interaction.reply({content:"You don't own any voice channel!", ephemeral:true});
        if (!voiceChannel)
            voiceChannel = this.voiceChannels.get(interaction.user.id)!.at(0)!;

        try {
            await voiceChannel.setUserLimit(interaction.options.getInteger("limit")!);
        } catch {
            return await interaction.reply({content: "Failed to change channel's user amount limit!", ephemeral:true});
        }
        await interaction.reply({content:`Successfully changes user amount limit to ${voiceChannel.name}.`});
    }
}