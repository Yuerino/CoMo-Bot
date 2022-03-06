import {Event} from "../libs/Event";
import {wobbot} from "../wobbot";
import {CommandInteractionOptionResolver} from "discord.js";

export default new Event(wobbot, "interactionCreate", async (interaction): Promise<void> => {
    if (!interaction.isCommand()) return;
    const command = wobbot.commands.get(interaction.commandName);
    if (!command) return;
    command.run({
        client: wobbot,
        interaction: interaction,
        args: interaction.options as CommandInteractionOptionResolver
    });
})