import sys
import json
import argparse
import re
from scrapling.fetchers import Fetcher

def scrape_product(query=None, ean=None):
    """
    Search for product info using Scrapling.
    Uses DuckDuckGo Lite to find relevant marketplace URLs and then scrapes them.
    """
    results = {
        "title": None,
        "price": None,
        "description": None,
        "brand": None,
        "source_url": None,
        "success": False
    }

    search_term = ean if ean else query
    if not search_term:
        return results

    try:
        # Step 1: Search for the product on marketplaces via DuckDuckGo Lite
        # DuckDuckGo Lite is great because it doesn't require JS and is fast for scraping
        search_query = f"{search_term}"
        search_url = f"https://duckduckgo.com/lite/?q={search_query}"
        page = Fetcher.get(search_url)
        
        def extract_links(html_page, current_links):
            found = []
            all_a = html_page.css('a::attr(href)').getall()
            for l in all_a:
                # Resolve DDG redirects
                if 'duckduckgo.com' in l and '/l/?uddg=' in l:
                    m = re.search(r'uddg=([^&]+)', l)
                    if m:
                        import urllib.parse
                        l = urllib.parse.unquote(m.group(1))
                
                # Resolve Google redirects
                if '/url?q=' in l:
                    m = re.search(r'url\?q=([^&]+)', l)
                    if m:
                        import urllib.parse
                        l = urllib.parse.unquote(m.group(1))

                is_marketplace = any(domain in l for domain in ['shopee.com.br', 'mercadolivre.com.br', 'amazon.com.br'])
                is_search = any(se in l for se in ['duckduckgo.com', 'bing.com', 'google.com'])
                
                if is_marketplace and not (is_search and '?q=' in l):
                    if l.startswith('http'):
                        found.append(l)
            return list(dict.fromkeys(current_links + found))

        links = extract_links(page, [])
        print(f"DEBUG: DDG Lite links: {len(links)}", file=sys.stderr)
        
        if len(links) == 0:
            print("DEBUG: DDG Lite failed or no links, trying Bing...", file=sys.stderr)
            search_url = f"https://www.bing.com/search?q={search_term}"
            page = Fetcher.get(search_url)
            links = extract_links(page, links)
            print(f"DEBUG: Bing links: {len(links)}", file=sys.stderr)

        if len(links) == 0:
            print("DEBUG: Bing failed or no links, trying Google...", file=sys.stderr)
            search_url = f"https://www.google.com/search?q={search_term}"
            page = Fetcher.get(search_url)
            links = extract_links(page, links)
            print(f"DEBUG: Google links: {len(links)}", file=sys.stderr)

        print(f"DEBUG: Total relevant links found: {len(links)}", file=sys.stderr)
        for l in links: print(f"DEBUG: Found Link: {l}", file=sys.stderr)
        
        if not links:
            return results

        # Step 2: Try to scrape the first relevant marketplace link
        # Prioritize product pages over list pages
        links.sort(key=lambda x: 0 if any(p in x for p in ['/p/', '/dp/', '/product/', 'produto.mercadolivre.com.br']) else 1)

        for target_url in links[:5]:
            print(f"DEBUG: Evaluating URL: {target_url}", file=sys.stderr)
            try:
                print(f"DEBUG: Scraping {target_url}...", file=sys.stderr)
                product_page = Fetcher.get(target_url)
                print(f"DEBUG: Scrape status: {product_page.status}", file=sys.stderr)
            except Exception as e:
                print(f"DEBUG: Scrape error: {e}", file=sys.stderr)
                continue
            
            # Refined extraction for major Brazilian marketplaces
            title = product_page.css('h1::text, .ui-pdp-title::text, #productTitle::text, ._44q80::text').get()
            
            if not title:
                print(f"DEBUG: Title null for {target_url}. HTML length: {len(product_page.text)}", file=sys.stderr)
                if len(product_page.text) < 1000:
                    print(f"DEBUG: HTML Snippet: {product_page.text[:500]}", file=sys.stderr)

            # If title is still null, it might be a list page. Try to get the first result title.
            if not title:
                title = product_page.css('.ui-search-item__title::text, .a-size-medium.a-color-base.a-text-normal::text, .shopee-item-card__name::text').get()

            # Try multiple common price selectors
            price_selectors = [
                '.ui-pdp-price__part .andes-money-amount__fraction::text', # ML Product
                '.andes-money-amount__fraction::text', # ML General
                '.a-price-whole::text',                # Amazon
                '[itemprop="price"]::attr(content)',    # Schema.org
                '.shopee-product-notification__price::text', # Shopee
                '.ui-search-price__part .andes-money-amount__fraction::text', # ML Search list
                '.price-tag-fraction::text',
                '.a-offscreen::text', # Amazon fallback
                '.G9u64P::text', # Shopee new
                '.L9A4A6::text'  # Shopee new 2
            ]
            
            price = None
            for selector in price_selectors:
                price = product_page.css(selector).get()
                if price: 
                    print(f"DEBUG: Price found with selector {selector}: {price}", file=sys.stderr)
                    break

            if not price:
                # Deep search in text for R$ pattern
                price_match = re.search(r'R\$\s?(\d+[\.,]\d{2})', product_page.text)
                if price_match:
                    price = price_match.group(1)
                    print(f"DEBUG: Price found in text: {price}", file=sys.stderr)

            if not title or not title.strip():
                # If we found a price, we can use the search term as title fallback
                if price:
                    title = search_term

            if title and title.strip():
                results["title"] = title.strip()
                print(f"DEBUG: Title set to: {results['title']}", file=sys.stderr)
                
                # Normalize price: keep only digits and decimal separator
                if price:
                    # ML often has price in parts, if fraction is there, we might need decimals
                    decimals = product_page.css('.andes-money-amount__cents::text, .ui-pdp-price__part .andes-money-amount__cents::text').get()
                    # Clean the price string: remove everything except digits and the LAST separator
                    # Find if there's a comma or dot followed by 2 digits at the end
                    match = re.search(r'(\d+)[\.,](\d{2})$', price)
                    if match:
                        # Keep all digits before the separator and the 2 digits after
                        cents = match.group(2)
                        # Remove all non-digits from the part before cents
                        prefix = re.sub(r'[^\d]', '', price[:-3])
                        clean_price = f"{prefix}{match.group(1)},{cents}"
                    else:
                        # No standard decimal separator found, just take all digits and add ,00
                        clean_price = re.sub(r'[^\d]', '', price)
                        clean_price = f"{clean_price},00"
                    
                    results["price"] = clean_price
                    print(f"DEBUG: Normalized price: {results['price']}", file=sys.stderr)
                
                results["source_url"] = target_url
                results["success"] = True
                
                # Try to get description
                desc = product_page.css('#productDescription::text, .ui-pdp-description__content::text, .description::text, [itemprop="description"]::text').get()
                if desc:
                    results["description"] = desc.strip()
                
                break # Found a result
        
        # Fallback: If no direct scrape succeeded, try to extract from DDG snippets
        if not results["success"]:
            snippets = page.css('.result-snippet::text').getall()
            for snip in snippets:
                # Look for patterns like R$ 99,90 or $ 99.99
                price_match = re.search(r'R\$\s?(\d+[\.,]\d+)', snip)
                if price_match:
                    results["price"] = price_match.group(1)
                    results["success"] = True
                    break

    except Exception as e:
        results["error"] = str(e)

    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrapling Product Search Service")
    parser.add_argument("--query", help="Product name to search")
    parser.add_argument("--ean", help="Barcode (EAN) to search")
    
    args = parser.parse_args()
    
    if not args.query and not args.ean:
        print(json.dumps({"error": "Query or EAN required"}))
        sys.exit(1)
        
    output = scrape_product(query=args.query, ean=args.ean)
    print(json.dumps(output, ensure_ascii=False))
