import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).parent.parent))

st.set_page_config(page_title="Alertes", page_icon="🔔", layout="wide")
st.title("🔔 Alertes & Rapports")
st.info("🚧 En cours de développement — disponible prochainement.")
