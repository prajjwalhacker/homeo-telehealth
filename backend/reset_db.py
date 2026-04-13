import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from backend.database import engine

with engine.begin() as conn:
    print("Dropping appointments table...")
    conn.execute(text("DROP TABLE IF EXISTS appointments CASCADE;"))
    print("Dropping doctors table...")
    conn.execute(text("DROP TABLE IF EXISTS doctors CASCADE;"))
    print("Dropping clinics table...")
    conn.execute(text("DROP TABLE IF EXISTS clinics CASCADE;"))
print("Done dropping tables.")
