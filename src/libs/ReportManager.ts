import {
    Collection,
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
import {bold} from "@discordjs/builders";
import {CoMoBot} from "./CoMoBot";
import {ReportTicket} from "./ReportTicket";

export default class ReportManager {
    private readonly client: CoMoBot;
    private readonly userConcurrencyReport: Collection<string, void>;
    private ticketChannel?: TextChannel | null;

    constructor(
        client: CoMoBot,
    ) {
        this.client = client;
        this.userConcurrencyReport = new Collection<string, void>();
    }

    public async init(): Promise<ReportManager> {
        this.ticketChannel = await this.client.channels.fetch(this.client.config.ticketChannelID) as TextChannel | null;
        return this;
    }

    public async messageReactionAddHandler(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<void> {
        if (reaction.partial) reaction = await reaction.fetch();
        if (user.partial) user = await user.fetch();

        if (reaction.message.guild && !this.client.config.guildIDs.includes(reaction.message.guild.id)) return;
        if (reaction.emoji.toString() !== this.client.config.reportEmoji) return;
        if (this.userConcurrencyReport.has(user.id)) return;

        this.userConcurrencyReport.set(user.id);

        let ticket = await new ReportTicket(true).createTicket(user, reaction.message);

        await this.handleReport(ticket);
    }

    private async handleReport(ticket: ReportTicket): Promise<void> {
        if (!await this.askUserOptions(ticket)) return;
        if (ticket.isEmergency()) {
            await ticket.message!.delete();
            ticket.message = undefined;
        }

        if (!await this.askUserDescription(ticket)) return;

        let embed = new MessageEmbed().setTitle(`Report Ticket #${ticket.id}`).setDescription(`The ticket has been created. The staffs will review it and reach out to you!`);
        await ticket.userDMChannel!.send({embeds: [embed]});
        this.userConcurrencyReport.delete(ticket.user!.id);

        await this.submitTicket(ticket);
    }

    private async submitTicket(ticket: ReportTicket): Promise<void> {
        const thread = await this.ticketChannel!.threads.create({
            name: `Report Ticket #${ticket.id}`,
            reason: `Thread for report ticket number ${ticket.id}`,
            autoArchiveDuration: "MAX"
        });

        const messageText = ticket.isEmergency() ? "A message" : `[This message](${ticket.message!.url})`;
        let embed = new MessageEmbed()
            .setTitle(`Report Ticket #${ticket.id}`)
            .setDescription(`${messageText} has been flagged recently.`)
            .setFields(
                {
                    name: "Type of report",
                    value: `${ticket.case}`,
                    inline: true
                },
                {
                    name: "Reporter User",
                    value: `${ticket.user!.username}`,
                    inline: true
                },
                {
                    name: "Reported User",
                    value: `${ticket.reportedUser?.username ?? "Empty"}`,
                    inline: true
                },
                {
                    name: "User Description",
                    value: `${ticket.userDescription}`
                },
                {
                    name: "Reported Message",
                    value: `${ticket.messageContent}`
                });

        await thread.send({embeds: [embed]});
    }

    private async askUserOptions(ticket: ReportTicket): Promise<boolean> {
        let embed = new MessageEmbed()
            .setTitle(`Report Ticket #${ticket.id}`)
            .setDescription(`You flagged [this message](${ticket.message!.url}) as inappropriate.\nPlease choose one of these 3 options:`)
            .addFields(
                {
                    name: "Report",
                    value: "This will flag the message and create a ticket for staff to review.",
                    inline: true
                },
                {
                    name: "Emergency",
                    value: "Similar to the Report option, this will also delete the inappropriate message.",
                    inline: true
                },
                {
                    name: "Cancel",
                    value: "In case of a false alarm, please choose this option to stop this process",
                    inline: true
                }
            )

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

        await ticket.userDMChannel!.send({embeds: [embed], components: [buttonRow]});

        const filter = (i: MessageComponentInteraction): boolean => i.user.id === ticket.user!.id;
        return ticket.userDMChannel!.awaitMessageComponent({filter, time: 60 * 1000})
            .then(async (i) => {
                await i.update({components: []});
                // await i.deferReply();
                if (i.customId === "report" || i.customId === "emergency") {
                    ticket.case = i.customId;
                    return true;
                }
                if (i.customId === "cancel") {
                    await this.handleCancel(ticket);
                }
                return false;
            })
            .catch(async () => {
                await this.handleCancel(ticket);
                return false;
            });
    }

    private async askUserDescription(ticket: ReportTicket): Promise<boolean> {
        const optionEmergencyInfo: string = ticket.isEmergency() ? "The inappropriate message has been deleted and archived for the staff to check!\n" : "";
        let embed = new MessageEmbed()
            .setTitle(`Report Ticket ${ticket.id}`)
            .setDescription(`You chose the ${bold(ticket.case!)} option.\n${optionEmergencyInfo}Please tell us more detail about this report.`);

        await ticket.userDMChannel!.send({embeds: [embed]});

        const filter = (m: Message): boolean => m.author.id === ticket.user!.id;
        return ticket.userDMChannel!.awaitMessages({filter, max: 1, time: 60 * 1000, errors: ["time"]})
            .then(async (messages) => {
                ticket.userDescription = messages.first()!.content;
                return true;
            })
            .catch(async () => {
                await this.handleCancel(ticket);
                return false;
            });
    }

    private async handleCancel(ticket: ReportTicket): Promise<void> {
        let embed = new MessageEmbed()
            .setTitle(`Report Ticket ${ticket.id}`)
            .setDescription(`False Alarm! The ticket is discarded ${ticket.isByReaction() ? "and your reaction will be removed" : ""}.`)

        if (!ticket.isEmergency()) {
            await ticket.message!.reactions.resolve(this.client.config.reportEmoji)?.users.remove(ticket.user);
        }

        this.userConcurrencyReport.delete(ticket.user!.id);
        await ticket.userDMChannel!.send({embeds: [embed]});
    }
}