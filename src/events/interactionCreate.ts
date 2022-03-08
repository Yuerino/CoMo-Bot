import {Event} from "../libs/Event";
import {comobot} from "../comobot";
import {CommandInteractionOptionResolver, Interaction, MessageEmbed} from "discord.js";

export default new Event({
    event: "interactionCreate",
    run: async (interaction: Interaction) => {
        if (!interaction.isCommand()) return;

        const command = comobot.commands.get(interaction.commandName);
        if (!command) return;

        if (command.isDMOnly() && interaction.inGuild()) {
            const embed = new MessageEmbed()
                .setColor("RED")
                .setTitle("Error")
                .setDescription("This command can only be used in private chat. Please try again in my private chat!");

            await interaction.reply({embeds: [embed], ephemeral: true});
            return;
        }

        command.run({
            client: comobot,
            interaction: interaction,
            args: interaction.options as CommandInteractionOptionResolver
        });
    }
});