# OpenMemory MCP Server - Quick Reference

## What This Does

Runs OpenMemory as a native MCP (Model Context Protocol) server, enabling AI assistants (Claude, Cursor, etc.) to access persistent project context with semantic search.

## Quick Start

### 1. Run the Server

```bash
python run_mcp_server.py
```

The server will start and wait for MCP client connections.

### 2. Configure Your AI Client

**Cursor** (auto-configured by setup script):
- File: `.cursor/mcp.json`
- Already created by `setup_mcp.py`
- Restart Cursor

**Claude Desktop**:
```json
{
  "mcpServers": {
    "openmemory": {
      "command": "python",
      "args": ["/full/path/to/run_mcp_server.py"],
      "env": {
        "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite"
      }
    }
  }
}
```

**VS Code (Cline)**:
```json
{
  "mcpServers": {
    "openmemory": {
      "type": "stdio",
      "command": "python",
      "args": ["run_mcp_server.py"]
    }
  }
}
```

## Available Tools

### 1. `openmemory_query` - Search Memories

```json
{
  "query": "MVVM pattern",
  "type": "contextual",
  "k": 10
}
```

**Parameters:**
- `query` (string): Search text
- `type` (string): "contextual", "factual", or "unified"
- `k` (integer): Max results (default: 10)
- `user_id` (string): Filter by user
- `sector` (string): Filter by sector

### 2. `openmemory_store` - Store Memory

```json
{
  "content": "User prefers dark mode",
  "type": "contextual",
  "tags": ["ui", "preference"],
  "user_id": "my-user"
}
```

**Parameters:**
- `content` (string): Memory content
- `type` (string): "contextual", "factual", or "both"
- `tags` (array): Tags for categorization
- `user_id` (string): User identifier
- `metadata` (object): Additional metadata

### 3. `openmemory_get` - Get Memory by ID

```json
{
  "id": "memory-id-here"
}
```

### 4. `openmemory_delete` - Delete Memory

```json
{
  "id": "memory-id-here"
}
```

### 5. `openmemory_list` - List Recent Memories

```json
{
  "limit": 20,
  "user_id": "my-user"
}
```

## Usage Examples

### In Cursor

```
@OpenMemory What architecture decisions have we made?
```

```
@OpenMemory Find memories about state management
```

```
@OpenMemory Show me recent bug fixes
```

### In Claude Desktop

```
Use openmemory_query to find memories about MVVM pattern
```

```
Use openmemory_list to show recent memories
```

### In Development Workflow

```python
# After fixing a bug, document it
python memory_service.py --add \
  "Fixed null pointer in ScannerViewModel" \
  --tags "bug,fix,scanner" \
  --category bug_fixes

# Search for related issues
python memory_service.py --search "null pointer" --limit 5
```

## Configuration

### Environment Variables

```bash
# Database location
OM_DB_URL=sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite

# User ID for memories
OM_DEFAULT_USER=mcp-client

# Memory tier (fast, smart, deep, hybrid)
OM_TIER=smart

# Embedding provider
OM_EMBEDDING_PROVIDER=synthetic
```

### Database

- **Location:** `RayShopeeAndroid/.memory/openmemory.sqlite`
- **Type:** SQLite with WAL mode
- **Size:** ~176 KB (grows with usage)

## Testing

### Run Setup

```bash
python setup_mcp.py
```

This verifies:
- All dependencies installed
- Database exists and is accessible
- MCP server can start
- Memory operations work

### Manual Test

```bash
# Start server
python run_mcp_server.py

# In another terminal, test with Python
python -c "
import asyncio
from openmemory import Memory

async def test():
    mem = Memory()
    results = await mem.search('MVVM', limit=5)
    print(f'Found {len(results)} results')

asyncio.run(test())
"
```

## Troubleshooting

### Server Won't Start

```bash
# Check dependencies
pip install mcp langchain-core openmemory-py

# Verify database
ls RayShopeeAndroid/.memory/openmemory.sqlite

# Check Python version
python --version  # Needs 3.10+
```

### No Results from Queries

```bash
# Check database has data
python -c "
from openmemory import Memory
mem = Memory()
print('Entries:', len(mem.history(limit=100)))
"

# Add test memory
python memory_service.py --add "Test" --tags test
```

### Client Can't Connect

```bash
# Test server manually
python run_mcp_server.py

# Should see: "Starting OpenMemory MCP server..."
# If error appears, check the message
```

## Files

- `run_mcp_server.py` - MCP server runner
- `setup_mcp.py` - Setup and verification script
- `.cursor/mcp.json` - Cursor configuration
- `.env.memory` - Environment configuration
- `memory_service.py` - CLI memory tool
- `memory_wrapper.py` - Python memory wrapper

## Benefits

1. **Context-Aware AI**: AI understands project context
2. **Semantic Search**: Find info without exact matches
3. **Persistent Memory**: Knowledge survives restarts
4. **Team Knowledge**: Everyone shares same context
5. **Cross-Session**: AI remembers across conversations

## Next Steps

- [ ] Configure Claude Desktop
- [ ] Test with Cursor
- [ ] Add more memories
- [ ] Document team workflow
- [ ] Train team on usage

## More Info

- `MCP_CONFIGURATION.md` - Detailed configuration guide
- `OPENMEMORY_INTEGRATION.md` - Integration documentation
- `OPENMEMORY_IMPLEMENTATION_SUMMARY.md` - Implementation details
