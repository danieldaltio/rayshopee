# OpenMemory Integration for RayShopeeAndroid

## Overview

This project now includes **OpenMemory** integration for persistent AI context management. This enables AI assistants with limited context windows (e.g., minimax 2.5, Claude 3 Haiku) to retain project knowledge across sessions.

## What is OpenMemory?

OpenMemory is a local-first, persistent memory engine that:
- ✅ Stores project context in SQLite (local-first)
- ✅ Provides semantic search over memories
- ✅ Supports embeddings for intelligent retrieval
- ✅ Works offline (no cloud required)
- ✅ Integrates with LangChain and other AI frameworks

## Installation

The required packages are already installed:

```bash
# Python SDK
pip install openmemory-py

# Node.js SDK (if needed)
npm install openmemory-js

# LangChain support (optional)
pip install langchain-core
```

## Quick Start

### Using the Memory Service (CLI)

```bash
# Add a memory
python memory_service.py --add "User prefers dark mode" --tags "ui,preference" --category user-preferences

# Search memories
python memory_service.py --search "preferences" --limit 10

# View recent memories
python memory_service.py --recent --limit 20

# Get summary
python memory_service.py --summary
```

### Using the Memory Wrapper (Python)

```python
from memory_wrapper import RayShopeeMemory

# Initialize
mem = RayShopeeMemory(user_id="my-assistant")

# Add a memory
await mem.add(
    "User prefers dark mode in the UI",
    tags=["ui", "preference", "dark-mode"],
    category="user-preferences"
)

# Search memories
results = await mem.search("dark mode", limit=5)
for r in results:
    print(r["content"])

# Get recent memories
history = await mem.history(limit=10)

# Add architecture decision
await mem.add_architecture_decision(
    decision="Use MVVM pattern",
    context="MVVM provides better testability and separation of concerns"
)

# Add code pattern
await mem.add_code_pattern(
    pattern="StateFlow for reactive state",
    description="Use StateFlow in ViewModel for lifecycle-aware state management"
)
```

## Configuration

Edit `.env.memory` to configure:

```bash
# Database (SQLite by default)
OM_DB_URL=sqlite:///RayShopeeAndroid/.memory/openmemory.sqlite

# Memory tier: fast, smart, deep, hybrid
OM_TIER=smart

# Embedding provider: synthetic, openai, gemini, ollama, aws
OM_EMBEDDING_PROVIDER=synthetic

# Context limits
OM_MAX_CONTEXT_ITEMS=50
OM_MAX_CONTEXT_TOKENS=4096
```

## Database Location

The memory database is stored in:
```
RayShopeeAndroid/.memory/openmemory.sqlite
```

This file should be **committed to git** so all team members and AI sessions share the same context.

## Memory Categories

Use these categories to organize memories:

| Category | Purpose | Example |
|----------|---------|---------|
| `architecture` | Design decisions | MVVM pattern choice |
| `code_patterns` | Reusable code | StateFlow usage |
| `bug_fixes` | Bug resolutions | Scanner crash fix |
| `api_documentation` | API endpoints | Supabase queries |
| `test_results` | Test outcomes | ViewModel tests |
| `user_preferences` | User behaviors | Dark mode preference |
| `general` | Miscellaneous | Project notes |

## API Reference

### RayShopeeMemory Class

#### `add(content, tags=None, **kwargs)`
Add a memory entry.

**Parameters:**
- `content` (str): The content to store
- `tags` (list): Optional tags
- `**kwargs`: Additional metadata (category, meta, etc.)

**Returns:** Memory entry dict or None

#### `search(query, limit=10, **kwargs)`
Search memories.

**Parameters:**
- `query` (str): Search query
- `limit` (int): Max results
- `**kwargs`: Filters (category, etc.)

**Returns:** List of matching memories

#### `history(limit=20)`
Get recent memories.

**Parameters:**
- `limit` (int): Max entries

**Returns:** List of recent memories

#### `get(memory_id)`
Get specific memory.

**Parameters:**
- `memory_id` (str): Memory ID

**Returns:** Memory entry or None

#### `delete(memory_id)`
Delete a memory.

**Parameters:**
- `memory_id` (str): Memory ID

**Returns:** True if successful

#### `clear()`
Clear all memories for current user.

**Returns:** True if successful

#### Convenience Methods

- `add_architecture_decision(decision, context, **kwargs)`
- `add_code_pattern(pattern, description, **kwargs)`
- `add_bug_fix(bug, root_cause, fix, **kwargs)`
- `add_test_result(test_name, status, details, **kwargs)`
- `add_api_endpoint(endpoint, method, description, **kwargs)`

## Examples

### Example 1: Document Architecture Decision

```python
await mem.add_architecture_decision(
    decision="Use Hilt for Dependency Injection",
    context="Hilt is the official Android DI framework, reduces boilerplate, and integrates well with Jetpack Compose",
    alternatives=["Manual DI", "Koin", "Dagger"]
)
```

### Example 2: Record Code Pattern

```python
await mem.add_code_pattern(
    pattern="StateFlow + sealed interface for UI state",
    description="""
    Use StateFlow<UiState> in ViewModel where UiState is a data class.
    Use sealed interface for user intents/actions.
    
    Benefits:
    - Type-safe state management
    - Lifecycle-aware
    - Easy to test
    """
)
```

### Example 3: Document Bug Fix

```python
await mem.add_bug_fix(
    bug="ScannerViewModel crashes when barcode is null",
    root_cause="Missing null check before calling searchByBarcode()",
    fix="Added null safety check and error handling in processIntent()"
)
```

### Example 4: API Documentation

```python
await mem.add_api_endpoint(
    endpoint="/products/search",
    method="GET",
    description="""
    Search products by barcode or item ID.
    
    Query params:
    - barcode: String (optional)
    - itemId: String (optional)
    
    Returns: Product object with variations
    """
)
```

## Best Practices

### ✅ Do

1. **Add important decisions**: Architecture choices, tech stack decisions
2. **Document patterns**: Reusable code patterns and idioms
3. **Record bug fixes**: Root causes and solutions
4. **Tag appropriately**: Use consistent tags for easy retrieval
5. **Use categories**: Organize memories by category
6. **Keep it concise**: Focus on key information

### ❌ Don't

1. **Store sensitive data**: API keys, passwords, secrets
2. **Add temporary notes**: Use regular notes for temporary info
3. **Duplicate existing docs**: Check memory before adding
4. **Over-categorize**: Use simple, consistent categories

## Troubleshooting

### Memory not persisting

```bash
# Check database exists
ls -la RayShopeeAndroid/.memory/openmemory.sqlite

# Verify permissions
chmod 644 RayShopeeAndroid/.memory/openmemory.sqlite
```

### Search returns no results

```python
# Try broader search
results = await mem.search("pattern", limit=50)

# Check all memories
history = await mem.history(limit=100)
```

### Database locked

```bash
# Close other connections
# Don't open SQLite browser while app is running
```

## Integration with AI Assistants

### For Claude / ChatGPT

When asking questions, reference the memory:

```
"Check the project memory for architecture decisions about MVVM"
```

### For minimax 2.5 / Claude 3 Haiku

These models have limited context. The memory system helps by:
1. Storing important project facts
2. Retrieving relevant context on-demand
3. Summarizing long documents

### In Development Workflow

```python
# Before coding, check memory for existing patterns
results = await mem.search("repository pattern", category="architecture")

# After fixing a bug, document it
await mem.add_bug_fix(
    bug="Scanner crashes on null barcode",
    root_cause="Missing null check in ScannerViewModel",
    fix="Added null safety check before processing"
)

# After implementing a feature, document the pattern
await mem.add_code_pattern(
    pattern="Intent-based ViewModel",
    description="Use sealed interface for ViewModel intents"
)
```

## Testing

```bash
# Run unit tests
cd RayShopeeAndroid
./gradlew testDebugUnitTest

# Test memory service
python memory_service.py --summary

# Test memory wrapper
python -c "
import asyncio
from memory_wrapper import RayShopeeMemory

async def test():
    mem = RayShopeeMemory()
    print(f'Available: {mem.is_available}')
    result = await mem.add('Test', tags=['test'])
    print(f'Added: {result[\"id\"]}')

asyncio.run(test())
"
```

## Files

- `memory_service.py` - CLI tool for managing memories
- `memory_wrapper.py` - Python module for programmatic access
- `.env.memory` - Configuration file
- `RayShopeeAndroid/.memory/openmemory.sqlite` - Memory database
- `OPENMEMORY_INTEGRATION.md` - Detailed documentation

## Future Enhancements

- [ ] Auto-summarization of long documents
- [ ] Memory graph visualization
- [ ] Cross-project memory sharing
- [ ] Memory versioning
- [ ] Automated memory extraction from code

## Support

For issues or questions:
1. Check this guide
2. Review `memory_service.py` for implementation details
3. Check OpenMemory docs: https://openmemory.cavira.app/docs/sdks/python

## License

Same as RayShopeeAndroid project (Apache 2.0)
