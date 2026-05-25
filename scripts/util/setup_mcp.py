#!/usr/bin/env python3
"""
Setup script for OpenMemory MCP Server
"""

import os
import sys
from pathlib import Path

def check_requirements():
    """Check that all requirements are met."""
    print("Checking requirements...")
    
    requirements = [
        ("openmemory", "openmemory-py"),
        ("mcp", "mcp"),
        ("langchain_core", "langchain-core"),
    ]
    
    for module, package in requirements:
        try:
            __import__(module)
            print(f"  [OK] {package} installed")
        except ImportError:
            print(f"  [FAIL] {package} NOT installed")
            print(f"    Run: pip install {package}")
            return False
    
    return True

def setup_database():
    """Verify database is in correct location."""
    print("\nChecking database...")
    
    project_root = Path(__file__).parent
    db_path = project_root / "RayShopeeAndroid" / ".memory" / "openmemory.sqlite"
    
    if db_path.exists():
        size = db_path.stat().st_size
        print(f"  [OK] Database found: {db_path}")
        print(f"    Size: {size:,} bytes")
        return True
    else:
        print(f"  [FAIL] Database NOT found: {db_path}")
        print(f"    Creating directory...")
        db_path.parent.mkdir(parents=True, exist_ok=True)
        return False

def configure_environment():
    """Set up environment variables."""
    print("\nConfiguring environment...")
    
    project_root = Path(__file__).parent
    db_path = project_root / "RayShopeeAndroid" / ".memory" / "openmemory.sqlite"
    
    os.environ["OM_DB_URL"] = f"sqlite:///{db_path}"
    os.environ.setdefault("OM_DEFAULT_USER", "mcp-client")
    
    print(f"  [OK] OM_DB_URL={os.environ['OM_DB_URL']}")
    print(f"  [OK] OM_DEFAULT_USER={os.environ['OM_DEFAULT_USER']}")
    
    return True

def test_memory():
    """Test memory operations."""
    print("\nTesting memory operations...")
    
    try:
        from openmemory import Memory
        import asyncio
        
        mem = Memory()
        
        # Check history
        history = mem.history(limit=5)
        print(f"  [OK] Memory initialized")
        print(f"    Entries in database: {len(history)}")
        
        # Add test entry
        async def test():
            result = await mem.add(
                "MCP server test entry",
                user_id="setup-test",
                tags=["test", "mcp"]
            )
            print(f"  [OK] Test entry added: {result.get('id', 'unknown')}")
            
            # Search
            results = await mem.search("MCP", limit=5)
            print(f"  [OK] Search works: {len(results)} results")
        
        asyncio.run(test())
        
        return True
    except Exception as e:
        print(f"  [FAIL] Memory test failed: {e}")
        return False

def test_mcp_server():
    """Test MCP server imports."""
    print("\nTesting MCP server...")
    
    try:
        from openmemory.ai.mcp import run_mcp_server
        print(f"  [OK] MCP server module imported")
        print(f"    Available tools:")
        print(f"    - openmemory_query")
        print(f"    - openmemory_store")
        print(f"    - openmemory_get")
        print(f"    - openmemory_delete")
        print(f"    - openmemory_list")
        return True
    except Exception as e:
        print(f"  [FAIL] MCP server test failed: {e}")
        return False

def create_config_files():
    """Create configuration file templates."""
    print("\nCreating configuration templates...")
    
    scripts_util = Path(__file__).parent
    workspace_root = scripts_util.parent.parent
    
    # Cursor config in workspace root
    cursor_config = workspace_root / ".cursor" / "mcp.json"
    cursor_config.parent.mkdir(exist_ok=True)
    
    cursor_content = '''{
  "mcpServers": {
    "openmemory": {
      "command": "python",
      "args": ["run_mcp_server.py"],
      "cwd": "__SCRIPTS_UTIL__",
      "env": {
        "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite"
      }
    },
    "notebooklm-mcp": {
      "command": "npx",
      "args": ["-y", "notebooklm-mcp@latest"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "linear": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-linear"],
      "env": {
        "LINEAR_API_KEY": "YOUR_LINEAR_API_KEY"
      }
    },
    "openspec": {
      "command": "npx",
      "args": ["-y", "@igor-olikh/openspec-mcp-server"]
    }
  }
}'''.replace("__SCRIPTS_UTIL__", str(scripts_util).replace("\\", "\\\\"))
    
    cursor_config.write_text(cursor_content)
    print(f"  [OK] Created: {cursor_config}")
    
    # OpenCode config in workspace root
    opencode_config = workspace_root / ".opencode" / "mcp.json"
    opencode_config.parent.mkdir(exist_ok=True)
    
    opencode_content = '''{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "openmemory": {
      "type": "local",
      "command": "python",
      "args": ["run_mcp_server.py"],
      "enabled": true,
      "cwd": "__SCRIPTS_UTIL__",
      "environment": {
        "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite",
        "OM_DEFAULT_USER": "opencode",
        "OM_TIER": "smart",
        "OM_EMBEDDING_PROVIDER": "synthetic"
      }
    },
    "notebooklm": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "notebooklm-mcp@latest"],
      "enabled": true
    },
    "sequential-thinking": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "enabled": true
    },
    "linear": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-linear"],
      "enabled": true,
      "environment": {
        "LINEAR_API_KEY": "YOUR_LINEAR_API_KEY"
      }
    },
    "openspec": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@igor-olikh/openspec-mcp-server"],
      "enabled": true
    }
  }
}'''.replace("__SCRIPTS_UTIL__", str(scripts_util).replace("\\", "/"))
    
    opencode_config.write_text(opencode_content)
    print(f"  [OK] Created: {opencode_config}")
    
    # Antigravity config in workspace root
    antigravity_config = workspace_root / "antigravity.mcp.config.json"
    antigravity_content = '''{
  "mcpServers": {
    "openmemory": {
      "type": "stdio",
      "command": "python",
      "args": [
        "run_mcp_server.py"
      ],
      "cwd": "__SCRIPTS_UTIL__",
      "env": {
        "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite",
        "OM_DEFAULT_USER": "antigravity",
        "OM_TIER": "smart",
        "OM_EMBEDDING_PROVIDER": "synthetic"
      }
    },
    "notebooklm": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "notebooklm-mcp@latest"
      ]
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "linear": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-linear"
      ],
      "env": {
        "LINEAR_API_KEY": "YOUR_LINEAR_API_KEY"
      }
    },
    "openspec": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@igor-olikh/openspec-mcp-server"
      ]
    }
  }
}'''.replace("__SCRIPTS_UTIL__", str(scripts_util).replace("\\", "/"))
    
    antigravity_config.write_text(antigravity_content)
    print(f"  [OK] Created/Updated: {antigravity_config}")
    
    # Environment file
    env_file = scripts_util / ".env.memory"
    if not env_file.exists():
        env_content = '''# OpenMemory Configuration
OM_DB_URL=sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite
OM_DEFAULT_USER=mcp-client
OM_TIER=smart
OM_EMBEDDING_PROVIDER=synthetic
'''
        env_file.write_text(env_content)
        print(f"  [OK] Created: {env_file}")
    else:
        print(f"  [OK] Already exists: {env_file}")
    
    return True

def print_instructions():
    """Print setup instructions."""
    print("\n" + "=" * 60)
    print("SETUP COMPLETE")
    print("=" * 60)
    
    print("""
Next Steps:

1. Configure your MCP client:
   
   # For Cursor:
   - Configuration saved to: .cursor/mcp.json
   - Restart Cursor
   
   # For Claude Desktop:
   - Edit: %APPDATA%\\Claude\\claude_desktop_config.json
   - Add the configuration from MCP_CONFIGURATION.md
   
   # For VS Code (Cline):
   - Create: .cline/mcp_servers.json
   - Add the configuration from MCP_CONFIGURATION.md

2. Test the connection:
   
   # In your AI client, try:
   "What architecture decisions have we made?"
   "Find memories about state management"
   "Show me recent bug fixes"

3. Add more memories:
   
   python memory_service.py --add "Your memory" --tags tag1,tag2

4. Monitor the server:
   
   python run_mcp_server.py
   
   (Press Ctrl+C to stop)

For more information, see:
- MCP_CONFIGURATION.md
- OPENMEMORY_INTEGRATION.md
- OPENMEMORY_IMPLEMENTATION_SUMMARY.md
""")

import json
import argparse


# ─── MCP Toggle System ───────────────────────────────────────

def _get_config_paths():
    """Return paths to all MCP config files."""
    scripts_util = Path(__file__).parent
    workspace_root = scripts_util.parent.parent
    return {
        "antigravity": workspace_root / "antigravity.mcp.config.json",
        "cursor": workspace_root / ".cursor" / "mcp.json",
        "opencode": workspace_root / ".opencode" / "mcp.json",
    }


def _load_json(path):
    """Load JSON file safely."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"  [WARN] Cannot read {path.name}: {e}")
        return None


def _save_json(path, data):
    """Save JSON file with pretty formatting."""
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _get_servers_key(data, ide):
    """Get the key that holds MCP server definitions."""
    if ide == "opencode":
        return "mcp"
    return "mcpServers"


def mcp_status():
    """Show current status of all MCPs across all IDEs."""
    print("=" * 60)
    print("MCP Server Status")
    print("=" * 60)

    configs = _get_config_paths()
    all_servers = set()

    # Collect all server names
    for ide, path in configs.items():
        data = _load_json(path)
        if not data:
            continue
        key = _get_servers_key(data, ide)
        if key in data:
            all_servers.update(data[key].keys())

    if not all_servers:
        print("  No MCP servers found.")
        return

    # Header
    print(f"\n  {'Server':<25} {'Antigravity':<15} {'Cursor':<15} {'OpenCode':<15}")
    print(f"  {'-'*25} {'-'*15} {'-'*15} {'-'*15}")

    for server in sorted(all_servers):
        statuses = []
        for ide, path in configs.items():
            data = _load_json(path)
            if not data:
                statuses.append("-")
                continue
            key = _get_servers_key(data, ide)
            servers = data.get(key, {})
            if server not in servers:
                statuses.append("-")
            elif ide == "opencode":
                enabled = servers[server].get("enabled", True)
                statuses.append("[ON]" if enabled else "[OFF]")
            elif ide == "cursor":
                disabled = servers[server].get("disabled", False)
                statuses.append("[OFF]" if disabled else "[ON]")
            else:
                # Antigravity: present = on
                statuses.append("[ON]")

        print(f"  {server:<25} {statuses[0]:<15} {statuses[1]:<15} {statuses[2]:<15}")

    print()


def mcp_toggle(server_name, enable=True):
    """Enable or disable an MCP server across all IDEs."""
    action = "Enabling" if enable else "Disabling"
    print(f"\n{action} '{server_name}' across all IDEs...")

    configs = _get_config_paths()
    modified = 0

    for ide, path in configs.items():
        data = _load_json(path)
        if not data:
            continue

        key = _get_servers_key(data, ide)
        servers = data.get(key, {})

        if server_name not in servers:
            print(f"  [{ide}] Server '{server_name}' not found — skipped")
            continue

        if ide == "opencode":
            servers[server_name]["enabled"] = enable
        elif ide == "cursor":
            if enable:
                servers[server_name].pop("disabled", None)
            else:
                servers[server_name]["disabled"] = True
        else:
            # Antigravity: no native disabled flag, skip
            print(f"  [{ide}] Antigravity has no disabled flag — manage manually")
            continue

        _save_json(path, data)
        status = "ON" if enable else "OFF"
        print(f"  [{ide}] '{server_name}' → {status}")
        modified += 1

    if modified:
        print(f"\n  ✅ Modified {modified} config(s). Restart IDE(s) to apply.")
    else:
        print(f"\n  ⚠️ No configs modified.")


# ─── Main ─────────────────────────────────────────────────────

def main():
    """Run setup or MCP toggle commands."""
    parser = argparse.ArgumentParser(
        description="OpenMemory MCP Server Setup & Toggle",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python setup_mcp.py                  # Full setup
  python setup_mcp.py --status         # Show MCP status
  python setup_mcp.py --enable notebooklm   # Enable MCP
  python setup_mcp.py --disable notebooklm  # Disable MCP
        """
    )
    parser.add_argument("--status", action="store_true", help="Show MCP server status")
    parser.add_argument("--enable", type=str, metavar="SERVER", help="Enable an MCP server")
    parser.add_argument("--disable", type=str, metavar="SERVER", help="Disable an MCP server")

    args = parser.parse_args()

    # Toggle commands
    if args.status:
        mcp_status()
        return 0
    if args.enable:
        mcp_toggle(args.enable, enable=True)
        return 0
    if args.disable:
        mcp_toggle(args.disable, enable=False)
        return 0

    # Default: full setup
    print("=" * 60)
    print("OpenMemory MCP Server Setup")
    print("=" * 60)
    
    checks = [
        ("Requirements", check_requirements),
        ("Database", setup_database),
        ("Environment", configure_environment),
        ("Memory", test_memory),
        ("MCP Server", test_mcp_server),
        ("Config Files", create_config_files),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n[FAIL] {name} failed: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    
    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {name}")
    
    all_passed = all(r for _, r in results)
    
    if all_passed:
        print_instructions()
        return 0
    else:
        print("\n[FAIL] Some checks failed. Please review above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
