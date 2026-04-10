"""
Hook Runner CLI
Command-line interface for workflow execution
"""

import argparse
import json
import sys
from pathlib import Path

import uvicorn
from qoder_enterprise.hooks.api import app


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Qoder Hook Runner - Workflow automation service"
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host to bind to (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8001,
        help="Port to bind to (default: 8001)"
    )
    parser.add_argument(
        "--workflows-path",
        default="./workflows",
        help="Path to workflow definitions"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload (development only)"
    )
    parser.add_argument(
        "--log-level",
        default="info",
        choices=["debug", "info", "warning", "error"],
        help="Logging level"
    )

    args = parser.parse_args()

    # Set workflows path
    import os
    os.environ["QODER_WORKFLOWS_PATH"] = args.workflows_path

    print(f"Starting Hook Runner API...")
    print(f"  Host: {args.host}")
    print(f"  Port: {args.port}")
    print(f"  Workflows: {args.workflows_path}")
    print(f"  Log level: {args.log_level}")

    uvicorn.run(
        "qoder_enterprise.hooks.api:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level=args.log_level,
    )


if __name__ == "__main__":
    main()
