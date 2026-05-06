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
    
    project_root = Path(__file__).parent
    
    # Cursor config
    cursor_config = project_root / ".cursor" / "mcp.json"
    cursor_config.parent.mkdir(exist_ok=True)
    
    config_content = '''{
  "mcpServers": {
    "openmemory": {
      "command": "python",
      "args": ["run_mcp_server.py"],
      "cwd": "__PROJECT_ROOT__",
      "env": {
        "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite"
      }
    }
  }
}'''.replace("__PROJECT_ROOT__", str(project_root).replace("\\", "\\\\"))
    
    cursor_config.write_text(config_content)
    print(f"  [OK] Created: {cursor_config}")
    
    # Environment file
    env_file = project_root / ".env.memory"
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

def main():
    """Run full setup."""
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
