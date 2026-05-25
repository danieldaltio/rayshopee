# Antigravity MCP Configuration for OpenMemory
# File: ~/.config/antigravity/mcp.json or project root

{
  "mcpServers": {
    "openmemory": {
      "type": "stdio",
      "command": "python",
      "args": [
        "run_mcp_server.py"
      ],
      "cwd": "C:/Ubuntu/root/Projeto-OpenClaw-Docker/RayShopee/scripts/util",
      "env": {
        "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite",
        "OM_DEFAULT_USER": "antigravity",
        "OM_TIER": "smart",
        "OM_EMBEDDING_PROVIDER": "synthetic"
      }
    }
  }
}

## Installation Steps

### 1. Place Configuration File

**Option A: Project-specific (recommended)**
```bash
# Create in project root
cp antigravity.mcp.config.json .antigravity-mcp.json
```

**Option B: Global configuration**
```bash
# Linux/MacOS
mkdir -p ~/.config/antigravity
cp antigravity.mcp.config.json ~/.config/antigravity/mcp.json

# Windows
# Place in %APPDATA%\Antigravity\mcp.json
```

### 2. Verify Installation

```bash
# Run setup verification
python setup_mcp.py

# Expected output:
# [PASS]: Requirements
# [PASS]: Database
# [PASS]: Environment
# [PASS]: Memory
# [PASS]: MCP Server
# [PASS]: Config Files
```

### 3. Restart Antigravity

```bash
# Close and reopen Antigravity
# The MCP server will auto-connect
```

### 4. Test Connection

In Antigravity AI chat:
```
@tools What MCP servers are available?
```

Expected response:
```
Available MCP tools:
- openmemory_query
- openmemory_store
- openmemory_get
- openmemory_delete
- openmemory_list
```

## Usage in Antigravity

### Query Project Knowledge

```
@openmemory What architecture decisions have we made?
```

### Search for Patterns

```
@openmemory Find memories about state management
```

### Get Specific Memory

```
@openmemory Get memory with ID: abc123
```

### Store New Knowledge

```
@openmemory Store: "Use Hilt for dependency injection"
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OM_DB_URL` | Database connection string | Required |
| `OM_DEFAULT_USER` | Default user ID | `antigravity` |
| `OM_TIER` | Memory tier (fast/smart/deep/hybrid) | `smart` |
| `OM_EMBEDDING_PROVIDER` | Embedding provider | `synthetic` |
| `OM_MAX_CONTEXT_ITEMS` | Max items in context | `50` |
| `OM_MAX_CONTEXT_TOKENS` | Max context tokens | `4096` |

### Memory Tiers

| Tier | Description | Use Case |
|------|-------------|----------|
| `fast` | Single embedding | Quick responses |
| `smart` | 1-3 sectors | Balanced (default) |
| `deep` | 5 sectors | Maximum accuracy |
| `hybrid` | Adaptive | Dynamic workloads |

## Troubleshooting

### Server Not Starting

```bash
# Check Python path
which python

# Verify dependencies
pip list | grep -E "mcp|openmemory"

# Test manually
python run_mcp_server.py
```

### No Tools Available

```bash
# Check configuration
cat ~/.config/antigravity/mcp.json

# Verify JSON syntax
python -m json.tool ~/.config/antigravity/mcp.json

# Restart Antigravity
```

### Permission Errors

```bash
# Check database permissions
ls -la RayShopeeAndroid/.memory/openmemory.sqlite

# Fix permissions
chmod 644 RayShopeeAndroid/.memory/openmemory.sqlite
```

## Advanced Configuration

### Multiple Memory Databases

```json
{
  "mcpServers": {
    "openmemory-main": {
      "command": "python",
      "args": ["run_mcp_server.py"],
      "env": {
        "OM_DB_URL": "sqlite:///main.db",
        "OM_DEFAULT_USER": "antigravity"
      }
    },
    "openmemory-archive": {
      "command": "python",
      "args": ["run_mcp_server.py"],
      "env": {
        "OM_DB_URL": "sqlite:///archive.db",
        "OM_DEFAULT_USER": "antigravity"
      }
    }
  }
}
```

### Remote OpenMemory Server

```json
{
  "mcpServers": {
    "openmemory": {
      "type": "stdio",
      "command": "curl",
      "args": [
        "-X", "POST",
        "http://localhost:8080/mcp",
        "-d", "@{input}"
      ]
    }
  }
}
```

## Integration Examples

### With Code Generation

```
@openmemory What's our state management pattern?
→ Returns: MVVM with StateFlow and sealed interfaces

@antigravity Generate code using MVVM pattern
→ Generates: ViewModel with StateFlow implementation
```

### With Documentation

```
@openmemory Find all architecture decisions
→ Returns: List of decisions

@antigravity Create documentation page
→ Creates: Architecture decisions page
```

### With Testing

```
@openmemory What test patterns do we use?
→ Returns: Testing patterns and examples

@antigravity Generate test following patterns
→ Generates: Test implementation
```

## Performance Optimization

### Large Databases

```json
{
  "mcpServers": {
    "openmemory": {
      "command": "python",
      "args": ["run_mcp_server.py"],
      "env": {
        "OM_DB_URL": "sqlite:///large.db?cache_size=-16000",
        "OM_TIER": "fast"
      }
    }
  }
}
```

### Network Latency

```json
{
  "mcpServers": {
    "openmemory": {
      "command": "python",
      "args": ["-u", "run_mcp_server.py"],
      "env": {
        "PYTHONUNBUFFERED": "1",
        "OM_TIER": "fast"
      }
    }
  }
}
```

## Best Practices

1. **Use Project-Specific Configs**: Keep configs in project root
2. **Version Control**: Don't commit sensitive data
3. **Environment Variables**: Use for secrets
4. **Regular Backups**: Backup database regularly
5. **Monitor Performance**: Check query times
6. **Update Dependencies**: Keep packages current

## Support

- Documentation: `MCP_CONFIGURATION.md`
- Quick Reference: `MCP_QUICK_REFERENCE.md`
- Implementation: `IMPLEMENTATION_SUMMARY.md`

## License

Apache 2.0 - Same as RayShopeeAndroid project
