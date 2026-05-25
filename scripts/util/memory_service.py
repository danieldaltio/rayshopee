#!/usr/bin/env python3
"""
OpenMemory Integration Service for RayShopeeAndroid

This service provides persistent memory for AI assistants working with
the RayShopeeAndroid project, enabling context retention across sessions
for AIs with limited context windows (e.g., minimax 2.5, Claude 3 Haiku).

Usage:
    python memory_service.py
    python memory_service.py --add "User preference for dark mode"
    python memory_service.py --search "preferences"
"""

import os
import sys
import json
import asyncio
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime

try:
    from openmemory import Memory
except ImportError:
    print("Error: openmemory-py not installed. Run: pip install openmemory-py")
    sys.exit(1)

# Project paths
PROJECT_ROOT = Path(__file__).parent
MEMORY_DIR = PROJECT_ROOT / "RayShopeeAndroid" / ".memory"
DATABASE_PATH = MEMORY_DIR / "openmemory.sqlite"

# Set environment variable for database
os.environ["OM_DB_URL"] = f"sqlite:///{DATABASE_PATH}"


class RayShopeeMemoryService:
    """Memory service for RayShopeeAndroid project context management."""

    def __init__(self, user_id: str = "ai-assistant"):
        """
        Initialize the memory service.

        Args:
            user_id: Identifier for the AI/user accessing memories
        """
        self.user_id = user_id
        self.memory = Memory(user=user_id)
        self._ensure_memory_dir()

    def _ensure_memory_dir(self):
        """Ensure the .memory directory exists."""
        MEMORY_DIR.mkdir(parents=True, exist_ok=True)

    async def add_project_context(
        self, content: str, tags: List[str] = None, **kwargs
    ) -> Dict[str, Any]:
        """
        Add project-specific context to memory.

        Args:
            content: The context/content to store
            tags: Optional tags for categorization
            **kwargs: Additional metadata

        Returns:
            Dictionary with memory details
        """
        meta = kwargs.get("meta", {})
        meta.update(
            {
                "project": "RayShopeeAndroid",
                "category": kwargs.get("category", "general"),
                "timestamp": datetime.now().isoformat(),
            }
        )

        effective_tags: List[str] = tags if tags is not None else ["project-context"]

        result = await self.memory.add(
            content=content, user_id=self.user_id, tags=effective_tags, meta=meta
        )
        return result

    async def search_context(
        self, query: str, limit: int = 10, category: str = None
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant project context.

        Args:
            query: Search query
            limit: Maximum number of results
            category: Optional category filter

        Returns:
            List of matching memory entries
        """
        filters = {}
        if category:
            filters["category"] = category

        effective_query = query if query else ""

        results = await self.memory.search(
            query=effective_query, user_id=self.user_id, limit=limit, **filters
        )
        return results

    async def get_recent_context(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get recent project context entries.

        Args:
            limit: Maximum number of entries

        Returns:
            List of recent memory entries
        """
        return self.memory.history(user_id=self.user_id, limit=limit)

    async def add_architecture_decision(
        self, decision: str, context: str, alternatives: List[str] = None
    ):
        """
        Add an architecture decision record to memory.

        Args:
            decision: The decision made
            context: Context/justification for the decision
            alternatives: Alternative options considered
        """
        content = f"Architecture Decision: {decision}\n\nContext: {context}"
        if alternatives:
            content += f"\n\nAlternatives considered: {', '.join(alternatives)}"

        await self.add_project_context(
            content=content,
            tags=["architecture", "decision"],
            category="architecture",
            decision=decision,
            alternatives=alternatives or [],
        )

    async def add_code_pattern(self, pattern: str, description: str, example: str):
        """
        Add a code pattern/idiom to memory.

        Args:
            pattern: The code pattern
            description: What it does
            example: Usage example
        """
        content = f"Code Pattern: {pattern}\n\nDescription: {description}\n\nExample:\n{example}"

        await self.add_project_context(
            content=content,
            tags=["code-pattern", "best-practice"],
            category="code_patterns",
        )

    async def add_bug_fix(self, bug_description: str, root_cause: str, fix: str):
        """
        Add a bug fix record to memory.

        Args:
            bug_description: Description of the bug
            root_cause: Root cause analysis
            fix: How it was fixed
        """
        content = f"Bug: {bug_description}\n\nRoot Cause: {root_cause}\n\nFix: {fix}"

        await self.add_project_context(
            content=content, tags=["bug", "fix"], category="bug_fixes"
        )

    async def get_context_summary(self) -> Dict[str, Any]:
        """
        Get a summary of all stored context.

        Returns:
            Summary dictionary
        """
        recent = await self.get_recent_context(limit=50)

        categories = {}
        for entry in recent:
            meta = entry.get("meta", {})
            if isinstance(meta, dict):
                cat = meta.get("category", "uncategorized")
            else:
                cat = "uncategorized"
            categories[cat] = categories.get(cat, 0) + 1

        return {
            "total_entries": len(recent),
            "categories": categories,
            "recent_entries": recent[:10],
        }

    async def clear_user_context(self):
        """Clear all context for the current user."""
        await self.memory.delete_all(user_id=self.user_id)


async def main():
    """Main entry point for CLI usage."""
    import argparse

    parser = argparse.ArgumentParser(
        description="RayShopeeAndroid Memory Service - Manage project context"
    )
    parser.add_argument(
        "--add", help="Add a memory entry", nargs="+", metavar="CONTENT"
    )
    parser.add_argument("--search", help="Search memories", metavar="QUERY")
    parser.add_argument("--recent", help="Show recent memories", action="store_true")
    parser.add_argument("--summary", help="Show context summary", action="store_true")
    parser.add_argument(
        "--limit", help="Limit results (default: 10)", type=int, default=10
    )
    parser.add_argument(
        "--user", help="User ID (default: ai-assistant)", default="ai-assistant"
    )
    parser.add_argument(
        "--tags", help="Tags for new entries (comma-separated)", metavar="TAGS"
    )
    parser.add_argument(
        "--category", help="Category for new entries", metavar="CATEGORY"
    )

    args = parser.parse_args()

    # Initialize service
    service = RayShopeeMemoryService(user_id=args.user)

    if args.add:
        content = " ".join(args.add)
        tags = args.tags.split(",") if args.tags else []

        result = await service.add_project_context(
            content=content, tags=tags, category=args.category or "general"
        )
        print(f"[OK] Added memory: {result.get('id', 'unknown')}")

    elif args.search:
        results = await service.search_context(query=args.search, limit=args.limit)
        print(f"\nFound {len(results)} results:\n")
        for i, r in enumerate(results, 1):
            print(f"{i}. {r.get('content', '')[:200]}...")
            print(f"   Tags: {r.get('tags', [])}")
            print()

    elif args.recent:
        results = await service.get_recent_context(limit=args.limit)
        print(f"\nRecent {len(results)} entries:\n")
        for i, r in enumerate(results, 1):
            meta = r.get("meta", {})
            if isinstance(meta, dict):
                cat = meta.get("category", "general")
            else:
                cat = "general"
            print(f"{i}. [{cat}] {r.get('content', '')[:150]}...")
            print()

    elif args.summary:
        summary = await service.get_context_summary()
        print(f"\nContext Summary:\n")
        print(f"Total entries: {summary['total_entries']}")
        print(f"\nCategories:")
        for cat, count in summary["categories"].items():
            print(f"  - {cat}: {count}")
        print(f"\nRecent entries:")
        for r in summary["recent_entries"]:
            meta = r.get("meta", {})
            if isinstance(meta, dict):
                cat = meta.get("category", "general")
            else:
                cat = "general"
            print(f"  - [{cat}] {r.get('content', '')[:100]}...")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
