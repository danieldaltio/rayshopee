#!/usr/bin/env python3
"""
OpenMemory MCP Server Runner for RayShopeeAndroid

Runs the OpenMemory MCP server natively for integration with Claude Desktop,
Cursor, and other MCP-compatible clients.

Usage:
    python run_mcp_server.py
    
    Or use directly with MCP clients:
    
    # Claude Desktop configuration (~/.claude_desktop/config.json)
    {
      "mcpServers": {
        "openmemory": {
          "command": "python",
          "args": ["/path/to/run_mcp_server.py"],
          "env": {
            "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite"
          }
        }
      }
    }
    
    # Cursor configuration (.cursor/mcp.json)
    {
      "mcpServers": {
        "openmemory": {
          "command": "python",
          "args": ["run_mcp_server.py"]
        }
      }
    }
"""

import os
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

# Configure database path
MEMORY_DB = PROJECT_ROOT / "RayShopeeAndroid" / ".memory" / "openmemory.sqlite"
os.environ["OM_DB_URL"] = f"sqlite:///{MEMORY_DB}"

# Set default user for MCP server
os.environ.setdefault("OM_DEFAULT_USER", "mcp-client")

print("=" * 60)
print("OpenMemory MCP Server for RayShopeeAndroid")
print("=" * 60)
print(f"Database: {MEMORY_DB}")
print(f"User: {os.environ['OM_DEFAULT_USER']}")
print(f"Memory Tier: smart")
print(f"Embeddings: synthetic")
print("=" * 60)

# Import and run MCP server
from openmemory.ai.mcp import run_mcp_server

if __name__ == "__main__":
    print("\nStarting OpenMemory MCP server...")
    print("Waiting for MCP client connections...\n")
    
    try:
        import asyncio
        asyncio.run(run_mcp_server())
    except KeyboardInterrupt:
        print("\n\nServer stopped by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nServer error: {e}")
        sys.exit(1)
