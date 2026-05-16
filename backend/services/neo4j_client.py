import os
import logging
from contextlib import asynccontextmanager
from neo4j import AsyncGraphDatabase, AsyncDriver

logger = logging.getLogger(__name__)


class Neo4jClient:
    _driver: AsyncDriver = None

    @classmethod
    async def connect(cls):
        cls._driver = AsyncGraphDatabase.driver(
            os.environ["NEO4J_URI"],
            auth=(
                os.environ["NEO4J_USERNAME"],
                os.environ["NEO4J_PASSWORD"]
            ),
            max_connection_pool_size=50,
            connection_timeout=30.0
        )
        await cls._driver.verify_connectivity()
        logger.info("Neo4j AuraDB connection established")

    @classmethod
    async def close(cls):
        if cls._driver:
            await cls._driver.close()
            cls._driver = None

    @classmethod
    @asynccontextmanager
    async def session(cls):
        if cls._driver is None:
            raise RuntimeError("Neo4j driver not initialised — call connect() first")
        async with cls._driver.session(database="neo4j") as session:
            yield session

    @classmethod
    async def get_auradb_instance(cls) -> str:
        uri = os.environ.get("NEO4J_URI", "")
        if "databases.neo4j.io" in uri:
            return uri.split("//")[1].split(".")[0]
        return "unknown"

    @classmethod
    async def health_check(cls) -> bool:
        try:
            async with cls.session() as session:
                result = await session.run("RETURN 1 AS ok")
                record = await result.single()
                return record["ok"] == 1
        except Exception as e:
            logger.error(f"Neo4j health check failed: {e}")
            return False
