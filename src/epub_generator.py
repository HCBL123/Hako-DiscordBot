import os
import requests
from bs4 import BeautifulSoup
from ebooklib import epub
import time
import logging
import sys
from urllib.parse import urlparse

# Set UTF-8 encoding for Python
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', encoding='utf-8')
logger = logging.getLogger(__name__)

def extract_novel_info(soup):
    """Extract novel info from hako.vn"""
    # Title from title element
    title_element = soup.find("title")
    if title_element:
        title = title_element.text.strip().split(" - ")[0].strip()
        logger.info(f"Found title: {title}")
    else:
        title = "Unknown Title"
        logger.warning("Title not found")

    # Author from info-item
    author_div = soup.find("div", class_="info-item", string=lambda text: "Tác giả:" in str(text) if text else False)
    if author_div and author_div.find("a"):
        author = author_div.find("a").text.strip()
        logger.info(f"Found author: {author}")
    else:
        author = "Unknown Author"
        logger.warning("Author not found")

    return title, author

def get_chapter_content(url, headers):
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        content_div = soup.find("div", {"id": "chapter-content"})
        
        if not content_div:
            logger.error(f"Content div not found for URL: {url}")
            return None

        chapter_html = []
        for p in content_div.find_all(["p", "div"]):
            if p.find("img"):
                img = p.find("img")
                chapter_html.append(f'<p class="image">[Image: {img.get("alt", "No description")}]</p>')
            else:
                text = p.text.strip()
                if text:
                    # Add proper paragraph formatting
                    chapter_html.append(f'<p class="text">{text}</p>')

        if not chapter_html:
            logger.error(f"No content extracted from {url}")
            return None
            
        content = f"""
        <div class="chapter-content">
            <style>
                .chapter-content p {{
                    margin: 1.5em 0;
                    line-height: 1.8;
                }}
                .chapter-content .text {{
                    text-indent: 1.5em;
                }}
            </style>
            {'\n'.join(chapter_html)}
        </div>
        """
        
        logger.info(f"Successfully extracted content ({len(chapter_html)} paragraphs)")
        return content

    except Exception as e:
        logger.error(f"Error processing chapter: {e}")
        return None

def get_chapter_list(soup):
    """Extract chapters from volume sections"""
    chapters = []
    
    # Find all volume sections
    volume_sections = soup.find_all("section", class_="volume-list")
    if not volume_sections:
        logger.warning("No volume sections found")
        return []

    for volume in volume_sections:
        chapter_list = volume.find("ul", class_="list-chapters")
        if chapter_list:
            for chapter in chapter_list.find_all("li"):
                link = chapter.find("a")
                if link:
                    chapter_url = f"https://ln.hako.vn{link['href']}"
                    chapters.append({
                        'url': chapter_url,
                        'title': link.text.strip()
                    })
                    logger.debug(f"Found chapter: {link.text.strip()}")

    logger.info(f"Total chapters found: {len(chapters)}")
    return chapters

def create_epub(novel_url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    try:
        logger.info(f"Fetching novel page: {novel_url}")
        response = requests.get(novel_url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        novel_title, author = extract_novel_info(soup)
        logger.info(f"Creating EPUB for: {novel_title} by {author}")

        book = epub.EpubBook()
        book.set_identifier(f'id_{novel_title.lower().replace(" ", "_")}')
        book.set_title(novel_title)
        book.set_language('en')
        book.add_author(author)

        chapters_data = get_chapter_list(soup)
        if not chapters_data:
            raise ValueError("No chapters found")

        epub_chapters = []
        for idx, chapter in enumerate(chapters_data, 1):
            logger.info(f"Processing chapter {idx}/{len(chapters_data)}: {chapter['title']}")
            
            content = get_chapter_content(chapter['url'], headers)
            if content and len(content.strip()) > 100:  # Validate minimum content length
                epub_chapter = epub.EpubHtml(
                    title=chapter['title'],
                    file_name=f'chapter_{idx}.xhtml',
                    content=f"""
                    <?xml version="1.0" encoding="UTF-8"?>
                    <!DOCTYPE html>
                    <html xmlns="http://www.w3.org/1999/xhtml">
                        <head>
                            <meta charset="utf-8" />
                            <title>{chapter['title']}</title>
                            <style>
                                .chapter-content {{ padding: 1em; }}
                                p {{ margin: 1em 0; line-height: 1.6; }}
                            </style>
                        </head>
                        <body>
                            <h1>{chapter['title']}</h1>
                            {content}
                        </body>
                    </html>
                    """.encode('utf-8').decode('utf-8')
                )
                book.add_item(epub_chapter)
                epub_chapters.append(epub_chapter)
            else:
                logger.warning(f"Skipping chapter {idx} due to empty content")
            time.sleep(1)

        if not epub_chapters:
            raise ValueError("No chapters were successfully processed")

        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())
        book.toc = epub_chapters
        book.spine = ['nav'] + epub_chapters

        epub_filename = f"{novel_title.lower().replace(' ', '_')}.epub"
        epub.write_epub(epub_filename, book, {'encoding': 'utf-8'})
        print(f"EPUB created successfully: {os.path.abspath(epub_filename)}")
        return True

    except Exception as e:
        logger.error(f"Error creating EPUB: {e}")
        return False

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print("Error: URL argument is required")
            sys.exit(1)
            
        novel_url = sys.argv[1]
        parsed_url = urlparse(novel_url)
        
        if not parsed_url.scheme or not parsed_url.netloc:
            print("Error: Invalid URL provided")
            sys.exit(1)
            
        logger.info("Starting EPUB generation...")
        create_epub(novel_url)
        
    except Exception as e:
        logger.error(f"Program failed: {e}")
        sys.exit(1)
