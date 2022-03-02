from typing import Optional

import discord
from discord.ext import commands
from bot import WobBot


class EmergencyButton(commands.Cog, name="Emergency Button"):
    def __init__(self, bot: WobBot) -> None:
        self.bot = bot
        self.emergency_emoji = '‼️'

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent) -> None:
        if payload.member.bot or payload.guild_id not in self.bot.config.GUILD_IDS:
            return

        if str(payload.emoji) == self.emergency_emoji:
            channel = await self.bot.fetch_channel(payload.channel_id)
            msg = await channel.fetch_message(payload.message_id)

            reporter_msg = await self.ask_reporter_user(payload.member, msg)
            reported_msg = await self.ask_reported_user(msg)

            ticket_channel = await self.bot.fetch_channel(self.bot.config.TICKET_CHANNEL_ID)

            ticket_msg = f"Hello Staffs! This message has been reported recently!\n<{msg.jump_url}>\n" \
                         f"Reporter user: {payload.member.name}#{payload.member.discriminator}\n" \
                         f"Reported user: {msg.author.name}#{msg.author.discriminator}\n"
            if reporter_msg:
                ticket_msg += f"Here is the information from the reporter user: ```{reporter_msg}```\n"
            else:
                ticket_msg += f"The reporter user didn't give me any information, please reach out to they as soon " \
                              f"as possible.\n"
            if reported_msg:
                ticket_msg += f"Here is the information from the reported user: ```{reported_msg}```\n"
            else:
                ticket_msg += f"The reported user didn't give me any information, please reach out to they as soon" \
                              f" as possible.\n"

            await ticket_channel.send(ticket_msg)

    async def ask_reporter_user(self, reporter_user: discord.Member, reported_msg: discord.Message) -> Optional[str]:
        await reporter_user.send(f"Hello {reporter_user.display_name}, you reported this message recently."
                                 f"\n<{reported_msg.jump_url}>\nPlease give staff some information about the report :)."
                                 f" Type `exit` to cancel this process and summon a human instead :)")

        def check(m: discord.Message):
            if m.author != reporter_user or not isinstance(m.channel, discord.DMChannel):
                return False
            return True

        msg = await self.bot.wait_for("message", check=check)

        if msg.clean_content == "exit":
            await reporter_user.send(f"Staff will reach out to you as soon as possible. Thank you for your report!")
            return None
        else:
            await reporter_user.send(f"Your message to the staff is ```{msg.clean_content}```"
                                     f"Thank you for your report!")
        return msg.clean_content

    async def ask_reported_user(self, reported_msg: discord.Message) -> Optional[str]:
        reported_user = reported_msg.author

        await reported_user.send(f"Hello {reported_user.display_name}, your message gets reported recently."
                                 f"\n<{reported_msg.jump_url}>\nPlease give staff some information about the message :)"
                                 f". Type `exit` to cancel this process and summon a human instead :)")

        def check(m: discord.Message):
            if m.author != reported_user or not isinstance(m.channel, discord.DMChannel):
                return False
            return True

        msg = await self.bot.wait_for("message", check=check)

        if msg.clean_content == "exit":
            await reported_user.send(f"Staff will reach out to you as soon as possible. Thank you for your time!")
            return None
        else:
            await reported_user.send(f"Your message to the staff is ```{msg.clean_content}```"
                                     f"Thank you for your information!")
        return msg.clean_content


def setup(bot: WobBot) -> None:
    bot.add_cog(EmergencyButton(bot))
