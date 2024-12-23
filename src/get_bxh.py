import requests
from bs4 import BeautifulSoup
import sys
import codecs

# Set UTF-8 encoding for stdout
if sys.stdout.encoding != 'utf-8':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def get_popular_stories(html_content):
    """Extract popular stories with their titles, URLs, and background images"""
    soup = BeautifulSoup(html_content, "html.parser")
    stories = []
    
    # Find all story items
    popular_items = soup.find_all("div", class_="popular-thumb-item")
    
    for item in popular_items:
        # Find title and URL
        title_div = item.find("div", class_="thumb_attr series-title")
        if title_div and title_div.find("a"):
            title = title_div.find("a")["title"]
            url = "https://ln.hako.vn" + title_div.find("a")["href"]
        else:
            continue
        
        # Find background image URL
        bg_div = item.find("div", class_="content img-in-ratio")
        style = bg_div.get("style", "") if bg_div else ""
        bg_url = style.split("url('")[-1].split("')")[0] if "url(" in style else "No image"
        
        stories.append({
            "title": title,
            "url": url,
            "image_url": bg_url
        })
    
    return stories

def main():
    url = "https://ln.hako.vn/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        response.encoding = 'utf-8'  # Set response encoding to UTF-8
        
        print("Popular Stories:", flush=True)
        print("-" * 80, flush=True)
        stories = get_popular_stories(response.text)
        
        for idx, story in enumerate(stories, 1):
            print(f"{idx}. Title: {story['title']}", flush=True)
            print(f"   URL: {story['url']}", flush=True)
            print(f"   Image: {story['image_url']}", flush=True)
            print("-" * 80, flush=True)

    except requests.RequestException as e:
        print(f"Error fetching data: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()