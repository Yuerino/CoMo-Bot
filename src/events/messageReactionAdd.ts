import {Event} from "../libs/Event";
import {wobbot} from "../wobbot";
import {DMChannel, Message, MessageActionRow, MessageButton, MessageEmbed, User} from "discord.js";

const reportEmoji: String = "‼️";

export default new Event(wobbot, "messageReactionAdd", async (reaction, user): Promise<void> => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (err) {
            // TODO: logging system
            console.error("Something went wrong when fetching message:", err);
            return;
        }
    }

    // if (wobbot.config.guildIDs.includes(reaction.message.guild?.id))
    //     console.log(`${user.username}' reacted with ${reaction.emoji} to ${reaction.message.author?.username}'s message`);

    if (reaction.emoji.toString() === reportEmoji) {
        // const message: Message = await reaction.message.fetch();
        const reporter_user: User = await user.fetch();

        const reporter_user_reply: String = await ask_reporter_user(reporter_user);
        await reporter_user.send(`User reply: ${reporter_user_reply}`);
    }
});

async function ask_reporter_user(user: User): Promise<String> {
    const user_dm_channel: DMChannel = await user.createDM();

    const embed: MessageEmbed = new MessageEmbed()
        .setTitle("Report")
        .setDescription("Please add some description.")

    const buttonRow: MessageActionRow = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId("cancel")
                .setLabel("Cancel")
                .setStyle("DANGER")
        );

    const filter = (m: Message): boolean => m.author.id === user.id;

    await user_dm_channel.send({embeds: [embed], components: [buttonRow]});
    return user_dm_channel.awaitMessages({filter, max: 1, time: 60000, errors: ["time"]})
        .then((collected) => {
            return collected.first()!.content;
        })
        .catch(() => {
            return "Time out";
        });
}