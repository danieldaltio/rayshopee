#!/usr/bin/env python3
"""
OpenMemory MCP Server Runner for RayShopee

Runs the OpenMemory MCP server natively for integration with Claude Desktop,
Cursor, and other MCP-compatible clients.
"""

import os
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

# Configure database path (updated for rayshopee-organize)
MEMORY_DB = PROJECT_ROOT / ".memory" / "openmemory.db"
os.environ["OM_DB_URL"] = f"sqlite:///{MEMORY_DB}"

# Set default user for MCP server
os.environ.setdefault("OM_DEFAULT_USER", "mcp-client")

# Use sys.stderr for all prints so we don't break JSON-RPC over stdout
def log_err(*args, **kwargs):
    kwargs['file'] = sys.stderr
    print(*args, **kwargs)

log_err("=" * 60)
log_err("OpenMemory MCP Server for RayShopee")
log_err("=" * 60)
log_err(f"Database: {MEMORY_DB}")
log_err(f"User: {os.environ['OM_DEFAULT_USER']}")
log_err(f"Memory Tier: smart")
log_err(f"Embeddings: synthetic")
log_err("=" * 60)

# Import and run MCP server
from openmemory.ai.mcp import run_mcp_server

if __name__ == "__main__":
    log_err("\nStarting OpenMemory MCP server...")
    log_err("Waiting for MCP client connections...\n")
    
    try:
        import asyncio
        asyncio.run(run_mcp_server())
    except KeyboardInterrupt:
        log_err("\n\nServer stopped by user.")
        sys.exit(0)
    except Exception as e:
        log_err(f"\n\nServer error: {e}")
        sys.exit(1)
