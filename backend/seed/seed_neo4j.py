"""
Seed Neo4j AuraDB with constraints, programmes, geographies, mentors,
and 15 historical startup cases for the few-shot learning loop.
Run: python -m seed.seed_neo4j
"""
import asyncio
import os
import sys
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from services.neo4j_client import Neo4jClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HISTORICAL_CASES = [
    # Fintech
    {"id": "HIST001", "name": "PayNow Sdn Bhd", "sector": "Fintech", "stage": "Pre-seed",
     "incorporation_date": "2022-06-01", "ownership": 100, "age": 2,
     "verdict_id": "VHIST001", "verdict": "APPROVE",
     "reasoning": "Clear Malaysian majority ownership with two resident directors. B2B payments TAM well-validated with 8 LOIs from SME customers.",
     "signals": ["100% Malaysian ownership", "2 resident directors", "under 5 years old", "validated traction"]},
    {"id": "HIST002", "name": "LoanBridge Technologies", "sector": "Fintech", "stage": "Seed",
     "incorporation_date": "2019-03-15", "ownership": 65, "age": 5,
     "verdict_id": "VHIST002", "verdict": "APPROVE",
     "reasoning": "51%+ Malaysian ownership met with CIP Sprint timelines. Revenue of RM 120K/month demonstrates commercialisation.",
     "signals": ["65% Malaysian ownership", "RM 120K MRR", "Sprint-eligible age", "revenue demonstrated"]},
    {"id": "HIST003", "name": "CryptoSafe MY", "sector": "Fintech", "stage": "Pre-seed",
     "incorporation_date": "2020-11-20", "ownership": 40, "age": 4,
     "verdict_id": "VHIST003", "verdict": "DECLINE",
     "reasoning": "Malaysian ownership at 40% falls below the 51% minimum threshold. Foreign investor holds majority.",
     "signals": ["below 51% Malaysian ownership", "no confirmed resident director", "ownership threshold failed"]},
    {"id": "HIST004", "name": "EasyTransfer Fintech", "sector": "Fintech", "stage": "Pre-seed",
     "incorporation_date": "2023-01-10", "ownership": 80, "age": 1,
     "verdict_id": "VHIST004", "verdict": "APPROVE",
     "reasoning": "Strong Malaysian ownership at 80%, very early stage with clear B2C remittance product. 500 beta users.",
     "signals": ["80% Malaysian ownership", "1 year old", "500 beta users", "clear market segment"]},
    {"id": "HIST005", "name": "WealthTrack Analytics", "sector": "Fintech", "stage": "Pre-seed",
     "incorporation_date": "2018-05-05", "ownership": 75, "age": 6,
     "verdict_id": "VHIST005", "verdict": "DECLINE",
     "reasoning": "Company age of 6 years exceeds the 5-year maximum for CIP Spark. Did not meet Sprint revenue threshold.",
     "signals": ["exceeds 5-year age limit", "no Sprint revenue evidence", "age threshold failed"]},
    # Healthtech
    {"id": "HIST006", "name": "HealthScan AI", "sector": "Healthtech", "stage": "Pre-seed",
     "incorporation_date": "2022-09-15", "ownership": 70, "age": 2,
     "verdict_id": "VHIST006", "verdict": "APPROVE",
     "reasoning": "AI diagnostics for rural clinics with 70% Malaysian ownership and a hospital pilot signed. In-house IP.",
     "signals": ["70% Malaysian ownership", "hospital pilot signed", "2 years old", "in-house IP"]},
    {"id": "HIST007", "name": "MedConnect Platform", "sector": "Healthtech", "stage": "Seed",
     "incorporation_date": "2020-04-20", "ownership": 55, "age": 4,
     "verdict_id": "VHIST007", "verdict": "APPROVE",
     "reasoning": "Telehealth platform with 55% Malaysian ownership, RM 80K MRR and 3 KPJ hospital integrations qualifies for CIP Sprint.",
     "signals": ["55% Malaysian ownership", "RM 80K MRR", "3 hospital integrations", "Sprint-eligible"]},
    {"id": "HIST008", "name": "PharmaSolve MY", "sector": "Healthtech", "stage": "Pre-seed",
     "incorporation_date": "2021-07-01", "ownership": 49, "age": 3,
     "verdict_id": "VHIST008", "verdict": "DECLINE",
     "reasoning": "Malaysian ownership at 49% is below the 51% minimum threshold by a narrow margin.",
     "signals": ["49% Malaysian ownership", "below threshold by 2%", "ownership failed"]},
    {"id": "HIST009", "name": "NursingCare Tech", "sector": "Healthtech", "stage": "Pre-seed",
     "incorporation_date": "2023-03-10", "ownership": 100, "age": 1,
     "verdict_id": "VHIST009", "verdict": "APPROVE",
     "reasoning": "100% Malaysian ownership with registered nurse as founder-director. SaaS scheduling tool with 12 paying customers.",
     "signals": ["100% Malaysian ownership", "resident director confirmed", "12 paying customers", "1 year old"]},
    {"id": "HIST010", "name": "BioTech Ventures MY", "sector": "Healthtech", "stage": "Pre-seed",
     "incorporation_date": "2016-02-14", "ownership": 60, "age": 8,
     "verdict_id": "VHIST010", "verdict": "DECLINE",
     "reasoning": "Company is 8 years old, exceeding both CIP Spark (5 years) and CIP Sprint (10 years) without meeting revenue threshold.",
     "signals": ["8 years old", "exceeds Spark age limit", "no revenue for Sprint", "age threshold failed"]},
    # AgriTech
    {"id": "HIST011", "name": "FarmSense IoT", "sector": "AgriTech", "stage": "Pre-seed",
     "incorporation_date": "2022-01-20", "ownership": 85, "age": 2,
     "verdict_id": "VHIST011", "verdict": "APPROVE",
     "reasoning": "IoT sensors for palm oil yield optimisation with 85% Malaysian ownership. 15 farm pilots with measurable yield data.",
     "signals": ["85% Malaysian ownership", "15 farm pilots", "2 years old", "yield data validated"]},
    {"id": "HIST012", "name": "AgriDrone Solutions", "sector": "AgriTech", "stage": "Seed",
     "incorporation_date": "2018-08-30", "ownership": 72, "age": 6,
     "verdict_id": "VHIST012", "verdict": "APPROVE",
     "reasoning": "Drone spraying for paddy fields with RM 200K MRR qualifies for CIP Sprint at 6 years old.",
     "signals": ["72% Malaysian ownership", "RM 200K MRR", "6 years old Sprint-eligible", "validated revenue"]},
    {"id": "HIST013", "name": "SoilTech Analytics", "sector": "AgriTech", "stage": "Pre-seed",
     "incorporation_date": "2021-11-05", "ownership": 55, "age": 3,
     "verdict_id": "VHIST013", "verdict": "APPROVE",
     "reasoning": "Soil microbiome analysis for smallholders with 55% Malaysian ownership and MARDI partnership. 8 LOIs.",
     "signals": ["55% Malaysian ownership", "MARDI partnership", "8 LOIs", "3 years old"]},
    {"id": "HIST014", "name": "AquaFarm Technologies", "sector": "AgriTech", "stage": "Pre-seed",
     "incorporation_date": "2019-06-12", "ownership": 35, "age": 5,
     "verdict_id": "VHIST014", "verdict": "DECLINE",
     "reasoning": "Aquaculture monitoring has only 35% Malaysian ownership due to foreign joint venture. Fails 51% minimum.",
     "signals": ["35% Malaysian ownership", "foreign JV majority", "ownership threshold failed"]},
    {"id": "HIST015", "name": "GreenHarvest Platform", "sector": "AgriTech", "stage": "Pre-seed",
     "incorporation_date": "2023-05-01", "ownership": 100, "age": 1,
     "verdict_id": "VHIST015", "verdict": "APPROVE",
     "reasoning": "B2B marketplace connecting smallholders to supermarket buyers, 100% Malaysian. RM 30K GMV in month one.",
     "signals": ["100% Malaysian ownership", "RM 30K GMV month 1", "1 year old", "validated demand"]},
]


async def seed():
    await Neo4jClient.connect()
    logger.info("Connected to Neo4j AuraDB")

    async with Neo4jClient.session() as session:
        for cypher in [
            "CREATE CONSTRAINT IF NOT EXISTS FOR (s:Startup) REQUIRE s.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (m:Mentor) REQUIRE m.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (p:Programme) REQUIRE p.name IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (g:Geography) REQUIRE g.country IS UNIQUE",
        ]:
            await session.run(cypher)
        logger.info("Constraints created")

        await session.run(
            "MERGE (:Programme {name: 'CIP Spark', country: 'MY', stage: 'Pre-seed', max_company_age_years: 5, min_malaysian_ownership_pct: 51})"
        )
        await session.run(
            "MERGE (:Programme {name: 'CIP Sprint', country: 'MY', stage: 'Seed', max_company_age_years: 10, min_malaysian_ownership_pct: 51})"
        )
        logger.info("Programmes seeded")

        for region, country in [("SEA", "MY"), ("SEA", "SG"), ("SEA", "ID")]:
            await session.run(
                "MERGE (:Geography {region: $region, country: $country})",
                region=region, country=country
            )
        await session.run(
            "MATCH (p:Programme {country: 'MY'}), (g:Geography {country: 'MY'}) MERGE (p)-[:BELONGS_TO]->(g)"
        )
        logger.info("Geographies seeded")

        mentors = [
            {"id": "M001", "name": "Farouk Ismail", "expertise": "Fintech", "sectors": ["Payments", "Lending"], "country": "MY"},
            {"id": "M002", "name": "Dr Lim Wei Shan", "expertise": "Healthtech", "sectors": ["Digital Health", "MedDevice"], "country": "MY"},
            {"id": "M003", "name": "Priya Nair", "expertise": "AI/ML", "sectors": ["Computer Vision", "NLP"], "country": "MY"},
            {"id": "M004", "name": "Ahmad Razif", "expertise": "E-commerce", "sectors": ["Retail Tech", "Logistics"], "country": "MY"},
            {"id": "M005", "name": "Siti Rahmah", "expertise": "SaaS/B2B", "sectors": ["Enterprise Software", "HR Tech"], "country": "MY"},
        ]
        for m in mentors:
            await session.run(
                "MERGE (:Mentor {id: $id, name: $name, expertise: $expertise, sectors: $sectors, country: $country})",
                **m
            )
        await session.run("MATCH (m:Mentor), (p:Programme) MERGE (m)-[:AVAILABLE_FOR]->(p)")
        logger.info("Mentors seeded")

        for case in HISTORICAL_CASES:
            await session.run(
                """
                MERGE (s:Startup {id: $id})
                SET s.name = $name, s.sector = $sector, s.stage = $stage,
                    s.incorporation_date = $date, s.total_malaysian_ownership_pct = $ownership,
                    s.company_age_years = $age, s.country = 'MY'
                """,
                id=case["id"], name=case["name"], sector=case["sector"], stage=case["stage"],
                date=case["incorporation_date"], ownership=case["ownership"], age=case["age"]
            )
            await session.run(
                """
                MERGE (v:JudgeVerdict {id: $verdict_id})
                SET v.verdict = $verdict, v.reasoning_summary = $reasoning,
                    v.key_eligibility_signals = $signals
                WITH v
                MATCH (s:Startup {id: $startup_id})
                MERGE (s)-[:REVIEWED_BY {alignment_score: 1}]->(v)
                """,
                verdict_id=case["verdict_id"], verdict=case["verdict"],
                reasoning=case["reasoning"], signals=case["signals"],
                startup_id=case["id"]
            )
        logger.info("15 historical cases seeded")

    await Neo4jClient.close()
    logger.info("Seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed())
