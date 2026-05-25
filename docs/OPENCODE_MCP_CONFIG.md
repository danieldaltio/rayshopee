.opencode/mcp.json configuration for OpenCode IDE:

{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "openmemory": {
      "type": "local",
      "command": "python",
      "args": ["run_mcp_server.py"],
      "enabled": true,
      "cwd": "C:/Ubuntu/root/Projeto-OpenClaw-Docker/RayShopee/scripts/util",
      "environment": {
        "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite",
        "OM_DEFAULT_USER": "opencode",
        "OM_TIER": "smart",
        "OM_EMBEDDING_PROVIDER": "synthetic"
      }
    }
  }
}

# Alternative: Global OpenCode config (~/.config/opencode/opencode.json)
{
  "mcp": {
    "servers": {
      "openmemory": {
        "type": "stdio",
        "command": "python",
        "args": ["/full/path/to/run_mcp_server.py"],
        "env": {
          "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite"
        }
      }
    }
  }
}
