import asyncio
import os
import sys
from pathlib import Path

# Add the scripts/util folder to python path so we can import memory_wrapper
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT / "scripts" / "util"))

from memory_wrapper import RayShopeeMemory

async def main():
    print("Connecting to OpenMemory database...")
    mem = RayShopeeMemory()
    
    if not mem.is_available:
        print("Error: OpenMemory is not available.")
        return
        
    print("Database available! Adding entries...")
    
    # 1. Add Architecture/Feature decision for AI SEO Title
    title_content = (
        "Feature: SEO Title Improvement using Generative AI (Gemini & Groq)\n\n"
        "Description: Implemented a button in the product Editor screen to automatically improve "
        "and optimize product titles for SEO (Shopee Brazil).\n\n"
        "Key Changes:\n"
        "- Added 'improveTitle' method to AiRepository interface and delegated it via AiRepositoryImpl.\n"
        "- Implemented GeminiService and GroqAiRepositoryImpl. Prompt normalizes titles with SEO structure: "
        "'[Produto] + [Marca] + [Característica Principal] + [Benefício/Tamanho]'.\n"
        "- Restricts to 120 chars, removes emojis, and enforces 'Title Case' (First Letter Capitalized for all words).\n"
        "- Added Kotlin transformation on the returned AI title to guarantee capitalization: "
        "cleanText.split(' ').joinToString(' ') { word -> word.lowercase().replaceFirstChar { it.titlecase() } }.\n"
        "- Exposed 'isImprovingTitle' state in EditorViewModel.kt to drive a CircularProgressIndicator loader in EditorScreen.kt."
    )
    
    title_res = await mem.add(
        content=title_content,
        tags=["ai", "seo", "editor", "gemini", "groq", "title-optimization"],
        category="code_patterns"
    )
    print(f"Added SEO Title memory entry: {title_res}")
    
    # 2. Add Bug Fix for Price Cents float precision
    bug_res = await mem.add_bug_fix(
        bug="Floating point precision issue where price of 19.90 was saved/shown in Shopee as 19.89.",
        root_cause=(
            "The product price input string was converted to Double and multiplied by 100 to get cents. "
            "However, floating point division/multiplication (e.g. 19.90 * 100) resulted in 1989.9999999999998. "
            "Using a simple cast to Long (.toLong()) truncated the decimal part, resulting in 1989 (19.89) instead of 1990."
        ),
        fix=(
            "Replaced the direct .toLong() cast with kotlin.math.round(doubleValue * 100).toLong() in EditorViewModel.kt "
            "and kotlin.math.round((clean.toDoubleOrNull() ?: 0.0) * 100).toLong() in EditorScreen.kt for variation prices."
        )
    )
    print(f"Added Price precision bug fix entry: {bug_res}")
    
    print("\nSession memory saved successfully!")

if __name__ == "__main__":
    asyncio.run(main())
