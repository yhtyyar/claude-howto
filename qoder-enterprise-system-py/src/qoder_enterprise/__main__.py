"""
Main entry point for Qoder Enterprise Python services
"""

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m qoder_enterprise [hooks|nlp]")
        sys.exit(1)

    service = sys.argv[1]

    if service == "hooks":
        from qoder_enterprise.hooks.api import app
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8001)

    elif service == "nlp":
        from qoder_enterprise.nlp.api import app
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8002)

    else:
        print(f"Unknown service: {service}")
        print("Available: hooks, nlp")
        sys.exit(1)
