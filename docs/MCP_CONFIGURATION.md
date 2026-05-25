# OpenMemory MCP Server Configuration
# For Claude Desktop, Cursor, and other MCP-compatible clients

## Claude Desktop

File location: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "openmemory": {
      "command": "python",
      "args": [
        "C:/Ubuntu/root/Projeto-OpenClaw-Docker/RayShopee/run_mcp_server.py"
      ],
      "env": {
        "OM_DB_URL": "sqlite:///C:/Ubuntu/root/Projeto-OpenClaw-Docker/RayShopee/RayShopeeAndroid/.memory/openmemory.sqlite",
        "OM_DEFAULT_USER": "claude-desktop"
      }
    }
  }
}
```

## Cursor

File location: `.cursor/mcp.json` in project root

```json
{
  "mcpServers": {
    "openmemory": {
      "command": "python",
      "args": ["run_mcp_server.py"],
      "cwd": "C:/Ubuntu/root/Projeto-OpenClaw-Docker/RayShopee/scripts/util",
      "env": {
        "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite"
      }
    }
  }
}
```

## VS Code with Cline Extension

File location: `.cline/mcp_servers.json`

```json
{
  "mcpServers": {
    "openmemory": {
      "type": "stdio",
      "command": "python",
      "args": ["run_mcp_server.py"],
      "cwd": "${workspaceFolder}/scripts/util",
      "env": {
        "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite"
      }
    }
  }
}
```

## Windsurf

File location: `.windsurf/mcp.json`

```json
{
  "mcpServers": {
    "openmemory": {
      "command": "python",
      "args": ["run_mcp_server.py"],
      "cwd": "C:/Ubuntu/root/Projeto-OpenClaw-Docker/RayShopee/scripts/util",
      "env": {
        "OM_DB_URL": "sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite"
      }
    }
  }
}
```

## Environment Variables

You can also set these environment variables:

```bash
# Database configuration
export OM_DB_URL="sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite"

# User identification
export OM_DEFAULT_USER="your-username"

# Memory tier (fast, smart, deep, hybrid)
export OM_TIER="smart"

# Embedding provider (synthetic, openai, gemini, ollama, aws)
export OM_EMBEDDING_PROVIDER="synthetic"
```

## Testing the MCP Server

### Quick Test

```bash
# Run the server
python run_mcp_server.py
```

### With Python MCP Client

```python
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test():
    server_params = StdioServerParameters(
        command="python",
        args=["run_mcp_server.py"]
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            # List available tools
            tools = await session.list_tools()
            print("Available tools:", tools)
            
            # Query memory
            result = await session.call_tool(
                "openmemory_query",
                {"query": "MVVM", "type": "contextual"}
            )
            print("Query result:", result)

asyncio.run(test())
```

## Available Tools

The OpenMemory MCP server provides these tools:

### 1. `openmemory_query`
Query memories with semantic search.

**Parameters:**
- `query` (string): Search query
- `type` (string): Query type - "contextual", "factual", or "unified"
- `k` (integer): Max results (default: 10)
- `user_id` (string): Filter by user
- `sector` (string): Filter by memory sector
- `fact_pattern` (object): Pattern for temporal fact queries
- `at` (string): ISO date for point-in-time queries

### 2. `openmemory_store`
Store new memories.

**Parameters:**
- `content` (string): Memory content
- `type` (string): Storage type - "contextual", "factual", or "both"
- `user_id` (string): User identifier
- `tags` (array): Tags for categorization
- `metadata` (object): Additional metadata
- `facts` (array): Facts to store (for factual/both types)

### 3. `openmemory_get`
Get a specific memory by ID.

**Parameters:**
- `id` (string): Memory ID

### 4. `openmemory_delete`
Delete a memory.

**Parameters:**
- `id` (string): Memory ID
- `user_id` (string): User identifier (for ownership check)

### 5. `openmemory_list`
List recent memories.

**Parameters:**
- `limit` (integer): Max results (default: 20)
- `user_id` (string): Filter by user

## Troubleshooting

### Server won't start

```bash
# Check Python version (needs 3.10+)
python --version

# Check dependencies
pip install mcp langchain-core openmemory-py

# Verify database path
ls RayShopeeAndroid/.memory/openmemory.sqlite
```

### MCP client can't connect

```bash
# Test server manually
python run_mcp_server.py

# Should see: "Starting OpenMemory MCP server..."
# Press Ctrl+C to stop
```

### No results from queries

```bash
# Check database has data
python -c "
from openmemory import Memory
mem = Memory()
print('Total memories:', len(mem.history(limit=100)))
"

# Add test memory
python memory_service.py --add "Test memory" --tags test
```

## Integration Examples

### Claude Desktop Usage

Once configured, you can ask Claude:

```
"What architecture decisions have we made about MVVM?"
"Find memories related to repository pattern"
"What did we decide about state management?"
```

### Cursor Usage

In Cursor, you can:

1. Ask questions about the project
2. Get context-aware suggestions
3. Reference past decisions
4. Find code patterns

### In Development Workflow

```python
# IDE can now access project memory
# Ask: "How do we handle API errors?"
# → Finds: Error handling patterns in Repository

# Ask: "What's our state management approach?"
# → Finds: MVVM + StateFlow + sealed interfaces

# Ask: "Show me bug fixes from last sprint"
# → Finds: Bug fix records with root causes
```

## Benefits

1. **Context-Aware AI**: AI assistants understand project context
2. **Persistent Knowledge**: Team knowledge is preserved
3. **Semantic Search**: Find information without exact matches
4. **Cross-Session Memory**: AI remembers across conversations
5. **Team Knowledge Sharing**: Everyone accesses same knowledge base

## Next Steps

- [ ] Configure Claude Desktop
- [ ] Configure Cursor
- [ ] Test with actual queries
- [ ] Add more memories
- [ ] Document team workflow
- [ ] Train team on usage
