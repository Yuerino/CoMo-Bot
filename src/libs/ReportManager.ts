import {
    Collection,
    CommandInteraction,
    DiscordAPIError,
    Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    MessageReaction,
    PartialMessageReaction,
    PartialUser,
    TextChannel,
    User
} from "discord.js";
import {blockQuote, bold, hyperlink, time} from "@discordjs/builders";
import {CoMoBot} from "./CoMoBot";
import {ReportTicket} from "./ReportTicket";
import {CreateTicketOptions, ReportManagerOptions, TicketOptions} from "./types";
import {capitalize} from "./utils";

export class ReportManager {
    private readonly client: CoMoBot;
    private readonly userConcurrencyReport: Collection<string, void> = new Collection<string, void>();
    private ticketChannel: TextChannel | null = null;
    private readonly expireTime: number = 5 * 60 * 1000;

    constructor(reportManagerOptions: ReportManagerOptions) {
        this.client = reportManagerOptions.client;
        if (reportManagerOptions.expireTime) this.expireTime = reportManagerOptions.expireTime;
    }

    private static async handleMaxConcurrency(user: User | PartialUser, interaction?: CommandInteraction) {
        if (user.partial) await user.fetch();

        const embed = new MessageEmbed()
            .setColor("GREY")
            .setTitle("Error")
            .setDescription("Please finish your current report ticket first before reporting another one!");

        if (interaction) {
            await interaction.followUp({embeds: [embed]});
        } else {
            await user.send({embeds: [embed]});
        }
    }

    public async init(): Promise<ReportManager> {
        this.ticketChannel = await this.client.channels.fetch(this.client.config.ticketChannelID) as TextChannel | null;
        if (!this.ticketChannel) throw new Error("No ticket channel found.");
        return this;
    }

    public async createTicket(createTicketOptions: CreateTicketOptions) {
        if (createTicketOptions.user.partial) await createTicketOptions.user.fetch();
        if (!createTicketOptions.userDMChannel) createTicketOptions.userDMChannel = await createTicketOptions.user.createDM();
        if (createTicketOptions.message?.partial) await createTicketOptions.message.fetch();

        console.log(`A new report ticket was created by ${createTicketOptions.user.username} at ${new Date().toUTCString()}`)
        return new ReportTicket(createTicketOptions as TicketOptions);
    }

    public async messageReactionAddHandler(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
        try {
            if (reaction.partial) reaction = await reaction.fetch();

            if (reaction.message.guild && !this.client.config.guildIDs.includes(reaction.message.guild.id)) return;
            if (reaction.emoji.toString() != this.client.config.reportEmoji) return;
            if (this.userConcurrencyReport.has(user.id)) return await ReportManager.handleMaxConcurrency(user);

            this.userConcurrencyReport.set(user.id);

            const ticket = await this.createTicket({user: user, message: reaction.message, createByReaction: true});

            if (!await this.askUserOptions(ticket)) return;

            await this.handleReport(ticket);
        } catch (err) {
            if (err instanceof DiscordAPIError && err.code === 50007) {
                await user.fetch();
                await reaction.message.reactions.resolve(this.client.config.reportEmoji)?.users.remove(user as User);
            } else {
                throw(err);
            }
        }
    }

    public async handleCommand(interaction: CommandInteraction) {
        await interaction.deferReply();

        if (this.userConcurrencyReport.has(interaction.user.id)) return await ReportManager.handleMaxConcurrency(interaction.user, interaction);
        this.userConcurrencyReport.set(interaction.user.id);

        const ticket = await this.createTicket({user: interaction.user});

        const messageURL = await this.askUserMessageURL(ticket, interaction);
        if (!messageURL) return;

        const message = await this.client.getMessageByURL(messageURL);
        if (!message) return await this.handleWrongURL(ticket);

        ticket.message = message;

        if (interaction.commandName === "report") {
            if (!await this.askUserOptions(ticket)) return;
        } else if (interaction.commandName === "emergency") {
            ticket.case = "emergency";
        } else {
            throw new Error("Unsupported Command!");
        }

        await this.handleReport(ticket);
    }

    private async handleReport(ticket: ReportTicket) {
        if (ticket.isEmergency()) await ticket.message.delete();

        if (!await this.askUserDescription(ticket)) return;

        const replyEmbed = new MessageEmbed()
            .setColor(ticket.isEmergency() ? "RED" : "BLUE")
            .setTitle(`Report Ticket #${ticket.id}`)
            .setDescription(`The ticket has been created. The staffs will review it and reach out to you soon!`);
        await ticket.userDMChannel.send({embeds: [replyEmbed]});
        this.userConcurrencyReport.delete(ticket.user.id);

        await this.submitTicket(ticket);
        await this.notifyNewTicket(ticket);
    }

    private async submitTicket(ticket: ReportTicket) {
        ticket.ticketThread = await this.ticketChannel!.threads.create({
            name: `Report Ticket from ${ticket.user.username} - ${ticket.id}`,
            reason: `Thread for report ticket #${ticket.id} from ${ticket.user.tag} at ${time(ticket.createTime)}`,
            autoArchiveDuration: "MAX"
        });

        let channelLink: string | null = null;
        if (ticket.message.channel instanceof TextChannel) {
            channelLink = hyperlink(
                ticket.message.channel.name,
                `https://discord.com/channels/${ticket.message.channel.guildId}/${ticket.message.channelId}`);
        }

        const messageText = ticket.isEmergency() ? "A message" : hyperlink("This message", ticket.message.url);
        const embed = new MessageEmbed()
            .setColor(ticket.isEmergency() ? "RED" : "BLUE")
            .setTitle(`Report Ticket #${ticket.id} - ${time(ticket.createTime)}`)
            .setDescription(`${messageText} has been flagged recently.`)
            .setFields(
                {
                    name: "Type of report",
                    value: bold(capitalize(ticket.case!)),
                    inline: true
                },
                {
                    name: "Reporter User",
                    value: ticket.user.tag,
                    inline: true
                },
                {
                    name: "Reported User",
                    value: ticket.reportedUser!.tag,
                    inline: true
                },
                {
                    name: "User Description",
                    value: ticket.userDescription ? blockQuote(ticket.userDescription) : "Empty"
                },
                {
                    name: "Reported Message",
                    value: blockQuote(ticket.messageContent)
                },
                {
                    name: "Message Channel",
                    value: channelLink ? channelLink : "Could not find",
                    inline: true
                },
                {
                    name: "Message Time",
                    value: time(ticket.message.createdAt),
                    inline: true
                });

        await ticket.ticketThread.send({embeds: [embed]});
    }

    private async askUserOptions(ticket: ReportTicket) {
        const embed = new MessageEmbed()
            .setColor("BLUE")
            .setTitle(`Report Ticket #${ticket.id}`)
            .setDescription(`You flagged ${hyperlink("this message", ticket.message.url)} as inappropriate.\nPlease choose one of these 3 options:`)
            .addFields(
                {
                    name: "Report",
                    value: "Flag the message and create a ticket for staff to review.",
                    inline: true
                },
                {
                    name: "Emergency",
                    value: "Same as Report but also deletes the Message immediately.",
                    inline: true
                },
                {
                    name: "Cancel",
                    value: "False alarm, please choose this option to stop this process",
                    inline: true
                }
            )
            .setFooter({text: "This report will be automatically cancelled after 5 minutes of inactivity"});

        const buttonRow = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("report")
                    .setLabel("Report")
                    .setStyle("PRIMARY")
            )
            .addComponents(
                new MessageButton()
                    .setCustomId("emergency")
                    .setLabel("Emergency")
                    .setStyle("DANGER")
            )
            .addComponents(
                new MessageButton()
                    .setCustomId("cancel")
                    .setLabel("Cancel")
                    .setStyle("SECONDARY")
            );

        const botMessage = await ticket.userDMChannel.send({embeds: [embed], components: [buttonRow]});

        const filter = (i: MessageComponentInteraction): boolean => i.user.id === ticket.user.id;
        return ticket.userDMChannel.awaitMessageComponent({filter, time: this.expireTime})
            .then(async (i) => {
                await i.update({components: []});
                if (i.customId === "report" || i.customId === "emergency") {
                    ticket.case = i.customId;
                    return true;
                }
                if (i.customId === "cancel") await this.handleCancel(ticket);
                return false;
            })
            .catch(async () => {
                await botMessage.edit({embeds: [embed], components: []});
                await this.handleCancel(ticket);
                return false;
            });
    }

    private async askUserDescription(ticket: ReportTicket) {
        const optionEmergencyInfo = ticket.isEmergency() ? `The inappropriate message is ${bold("deleted and archived")} for the staff to check!\n` : "";
        const embed = new MessageEmbed()
            .setColor(ticket.isEmergency() ? "RED" : "BLUE")
            .setTitle(`Report Ticket #${ticket.id}`)
            .setDescription(`You chose the ${bold(capitalize(ticket.case!))} option.\n${optionEmergencyInfo}Please tell us more detail about this report.`)
            .setFooter({text: "This report will be automatically submitted after 5 minutes of inactivity"});

        await ticket.userDMChannel.send({embeds: [embed]});

        const filter = (m: Message): boolean => m.author.id === ticket.user.id;
        return ticket.userDMChannel.awaitMessages({filter, max: 1, time: this.expireTime, errors: ["time"]})
            .then(async (messages) => {
                ticket.userDescription = messages.first()!.cleanContent;
                return true;
            })
            .catch(() => {
                return true;
            });
    }

    private async handleCancel(ticket: ReportTicket) {
        let embed = new MessageEmbed()
            .setColor("GREY")
            .setTitle(`Report Ticket #${ticket.id}`)
            .setDescription(`${bold("False Alarm!")} This ticket is discarded ${ticket.isByReaction() ? "and your reaction will be removed" : ""}.`);

        if (ticket.isByReaction()) await ticket.message.reactions.resolve(this.client.config.reportEmoji)?.users.remove(ticket.user);

        this.userConcurrencyReport.delete(ticket.user.id);
        await ticket.userDMChannel.send({embeds: [embed]});
    }

    private async notifyNewTicket(ticket: ReportTicket) {
        let embed = new MessageEmbed()
            .setColor(ticket.isEmergency() ? "RED" : "BLUE")
            .setTitle(`Report Ticket #${ticket.id}`);

        const textChannelURL = `https://discord.com/channels/${this.ticketChannel!.guildId}/${this.ticketChannel!.id}`;

        for (const staffID of this.client.config.onDutyStaffIDs) {
            const staff = await this.client.users.fetch(staffID);
            await ticket.ticketThread?.members.add(staff);
            embed.setDescription(`Hello ${staff.username}. We have a new ${bold(capitalize(ticket.case!))} ticket in the ${hyperlink("ticket channel", textChannelURL)}!`);
            await staff.send({embeds: [embed]});
        }
    }

    private async askUserMessageURL(ticket: ReportTicket, interaction: CommandInteraction) {
        const embed = new MessageEmbed()
            .setColor("BLUE")
            .setTitle(`Report Ticket`)
            .setDescription("Please enter message URL that you want to report.")
            .setFooter({text: "This report will be automatically cancelled after 5 minutes of inactivity"});

        await interaction.followUp({embeds: [embed]});

        const filter = (m: Message): boolean => m.author.id === ticket.user.id;
        return ticket.userDMChannel.awaitMessages({filter, max: 1, time: this.expireTime, errors: ["time"]})
            .then(async (messages) => {
                return messages.first()!.cleanContent;
            })
            .catch(async () => {
                await this.handleCancel(ticket);
                return null;
            });
    }

    private async handleWrongURL(ticket: ReportTicket) {
        const embed = new MessageEmbed()
            .setColor("GREY")
            .setTitle("Error")
            .setDescription("You entered an invalid message URL. Please try again!")
            .setFooter({text: "Hints: Right click a message and click on `Copy Message Link` option."});

        this.userConcurrencyReport.delete(ticket.user.id);
        await ticket.userDMChannel.send({embeds: [embed]});
    }
}