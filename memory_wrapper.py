#!/usr/bin/env python3
"""
Memory Service Wrapper for RayShopeeAndroid

Provides a simple interface for managing project context and memories.
Designed for use by AI assistants with limited context windows.

Usage:
    from memory_wrapper import RayShopeeMemory

    mem = RayShopeeMemory()
    await mem.add("User prefers dark mode", tags=["ui", "preference"])
    results = await mem.search("preferences")
"""

import asyncio
import os
from typing import List, Dict, Optional, Any
from pathlib import Path

try:
    from openmemory import Memory
    OPENMEMORY_AVAILABLE = True
except ImportError:
    OPENMEMORY_AVAILABLE = False
    print("Warning: openmemory-py not installed. Install with: pip install openmemory-py")


class RayShopeeMemory:
    """Simplified memory interface for RayShopeeAndroid project."""

    def __init__(self, user_id: str = None):
        """
        Initialize memory service.

        Args:
            user_id: User identifier (default: from env or 'ai-assistant')
        """
        self.user_id = user_id or os.getenv("OM_DEFAULT_USER", "ai-assistant")

        if OPENMEMORY_AVAILABLE:
            # Configure database path
            db_path = Path(__file__).parent / "RayShopeeAndroid" / ".memory" / "openmemory.sqlite"
            db_path.parent.mkdir(parents=True, exist_ok=True)

            # Set environment variable for database URL
            os.environ["OM_DB_URL"] = f"sqlite:///{db_path}"

            self.memory = Memory(user=self.user_id)
            self._initialized = True
        else:
            self._initialized = False
            self.memory = None

    @property
    def is_available(self) -> bool:
        """Check if memory service is available."""
        return self._initialized and OPENMEMORY_AVAILABLE

    async def add(self, content: str, tags: List[str] = None, **kwargs) -> Optional[Dict[str, Any]]:
        """
        Add a memory entry.

        Args:
            content: The content to store
            tags: Optional tags for categorization
            **kwargs: Additional metadata

        Returns:
            Memory entry details or None if unavailable
        """
        if not self.is_available:
            return None

        meta = kwargs.get("meta", {})
        meta.update({
            "project": "RayShopeeAndroid",
            "category": kwargs.get("category", "general")
        })

        try:
            result = await self.memory.add(
                content=content,
                user_id=self.user_id,
                tags=tags or ["project"],
                meta=meta
            )
            return result
        except Exception as e:
            print(f"Error adding memory: {e}")
            return None

    async def search(self, query: str, limit: int = 10, **kwargs) -> List[Dict[str, Any]]:
        """
        Search memories.

        Args:
            query: Search query
            limit: Maximum number of results
            **kwargs: Additional filters

        Returns:
            List of matching memories
        """
        if not self.is_available:
            return []

        try:
            results = await self.memory.search(
                query=query,
                user_id=self.user_id,
                limit=limit,
                **kwargs
            )
            return results
        except Exception as e:
            print(f"Error searching memories: {e}")
            return []

    async def get(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific memory by ID.

        Args:
            memory_id: Memory identifier

        Returns:
            Memory entry or None
        """
        if not self.is_available:
            return None

        try:
            return await self.memory.get(memory_id)
        except Exception as e:
            print(f"Error getting memory: {e}")
            return None

    async def delete(self, memory_id: str) -> bool:
        """
        Delete a memory.

        Args:
            memory_id: Memory identifier

        Returns:
            True if successful
        """
        if not self.is_available:
            return False

        try:
            await self.memory.delete(memory_id)
            return True
        except Exception as e:
            print(f"Error deleting memory: {e}")
            return False

    async def history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get recent memories.

        Args:
            limit: Maximum number of entries

        Returns:
            List of recent memories
        """
        if not self.is_available:
            return []

        try:
            return self.memory.history(user_id=self.user_id, limit=limit)
        except Exception as e:
            print(f"Error getting history: {e}")
            return []

    async def clear(self) -> bool:
        """
        Clear all memories for current user.

        Returns:
            True if successful
        """
        if not self.is_available:
            return False

        try:
            await self.memory.delete_all(user_id=self.user_id)
            return True
        except Exception as e:
            print(f"Error clearing memories: {e}")
            return False

    # Convenience methods for common use cases

    async def add_architecture_decision(self, decision: str, context: str, **kwargs):
        """Add an architecture decision record."""
        content = f"Architecture Decision: {decision}\n\nContext: {context}"
        return await self.add(
            content=content,
            tags=["architecture", "decision"],
            category="architecture",
            **kwargs
        )

    async def add_code_pattern(self, pattern: str, description: str, **kwargs):
        """Add a code pattern or best practice."""
        content = f"Code Pattern: {pattern}\n\n{description}"
        return await self.add(
            content=content,
            tags=["code-pattern", "best-practice"],
            category="code_patterns",
            **kwargs
        )

    async def add_bug_fix(self, bug: str, root_cause: str, fix: str, **kwargs):
        """Add a bug fix record."""
        content = f"Bug: {bug}\n\nRoot Cause: {root_cause}\n\nFix: {fix}"
        return await self.add(
            content=content,
            tags=["bug", "fix"],
            category="bug_fixes",
            **kwargs
        )

    async def add_test_result(self, test_name: str, status: str, details: str = "", **kwargs):
        """Add a test result."""
        content = f"Test: {test_name}\nStatus: {status}"
        if details:
            content += f"\n\n{details}"
        return await self.add(
            content=content,
            tags=["test", status.lower()],
            category="test_results",
            **kwargs
        )

    async def add_api_endpoint(self, endpoint: str, method: str, description: str, **kwargs):
        """Add an API endpoint documentation."""
        content = f"API: {method} {endpoint}\n\n{description}"
        return await self.add(
            content=content,
            tags=["api", "endpoint"],
            category="api_documentation",
            **kwargs
        )


# Global instance
_memory = None


def get_memory(user_id: str = None) -> RayShopeeMemory:
    """Get or create a global memory instance."""
    global _memory
    if _memory is None:
        _memory = RayShopeeMemory(user_id=user_id)
    return _memory


# Convenience functions for quick access
async def add_memory(content: str, tags: List[str] = None, **kwargs):
    """Quick add to memory."""
    mem = get_memory()
    return await mem.add(content, tags, **kwargs)


async def search_memory(query: str, limit: int = 10, **kwargs):
    """Quick search in memory."""
    mem = get_memory()
    return await mem.search(query, limit, **kwargs)


if __name__ == "__main__":
    # Quick test
    async def test():
        mem = RayShopeeMemory()
        print(f"Memory available: {mem.is_available}")

        if mem.is_available:
            # Add test entry
            result = await mem.add(
                "Test memory entry from RayShopeeAndroid",
                tags=["test", "demo"]
            )
            print(f"Added: {result}")

            # Search
            results = await mem.search("test")
            print(f"Search results: {len(results)}")

            # History
            history = await mem.history(limit=5)
            print(f"History: {len(history)} entries")

    asyncio.run(test())
