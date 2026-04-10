"""
Intent NLP CLI
Command-line interface for NLP service
"""

import argparse
import os

import uvicorn


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Qoder Intent NLP - Advanced intent detection service"
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host to bind to (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8002,
        help="Port to bind to (default: 8002)"
    )
    parser.add_argument(
        "--model",
        default="all-MiniLM-L6-v2",
        help="Sentence transformer model"
    )
    parser.add_argument(
        "--device",
        choices=["cpu", "cuda", "auto"],
        default="auto",
        help="Device to run on"
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

    # Set environment variables
    os.environ["NLP_MODEL"] = args.model
    if args.device != "auto":
        os.environ["NLP_DEVICE"] = args.device

    print(f"Starting Intent NLP API...")
    print(f"  Host: {args.host}")
    print(f"  Port: {args.port}")
    print(f"  Model: {args.model}")
    print(f"  Device: {args.device}")
    print(f"  Log level: {args.log_level}")

    # Model loading takes time
    print("\nLoading transformer model (this may take a moment)...")

    uvicorn.run(
        "qoder_enterprise.nlp.api:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level=args.log_level,
    )


if __name__ == "__main__":
    main()
