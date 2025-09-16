import psycopg
from contextlib import asynccontextmanager
from .config import settings

async def get_conn():
    # psycopg3 async connection
    return await psycopg.AsyncConnection.connect(settings.DATABASE_URL)

async def insert_url_check(conn, *, user_id, url, verdict, reasons, summary, raw_meta):
    async with conn.cursor() as cur:
        await cur.execute(
            """
            insert into url_checks (user_id, url, verdict, reasons, summary, raw_meta)
            values (%s, %s, %s, %s::jsonb, %s, %s::jsonb)
            returning id
            """,
            (user_id, url, verdict, reasons, summary, raw_meta),
        )
        row = await cur.fetchone()
        return row[0]
