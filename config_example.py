import os

if os.environ.get("DISCORD_TOKEN") is None:
    import dotenv

    dotenv.load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")

COG_EXTENSIONS = [
    'cogs.emergency_button'
]

# List of guilds that bot listens to
GUILD_IDS = [
    42424242424242424242
]

# Ticket channel for emergency button
TICKET_CHANNEL_ID = 42424242424242
