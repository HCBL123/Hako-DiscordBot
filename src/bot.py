import sys
import requests
from bs4 import BeautifulSoup
from crawl_data import get_chapter_content

def get_novel_info(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Find title
        title_element = soup.find("title")
        title = title_element.text.strip().split(" - ")[0].strip() if title_element else "Unknown"
        print(f"Title: {title}")
        
        # Find author
        author_div = soup.find("div", class_="info-item")
        if author_div and author_div.find("span", class_="info-name", string=lambda x: "Tác giả:" in str(x)):
            author_link = author_div.find("span", class_="info-value").find("a")
            if author_link:
                author = author_link.text.strip()
                print(f"Author: {author}")
            else:
                print("Author: Unknown - No author link found")
        else:
            print("Author: Unknown - No author div found")

        # Find translator
        translator_elem = soup.find("span", class_="series-owner_name")
        translator = translator_elem.find("a").text.strip() if translator_elem and translator_elem.find("a") else "Unknown"
        print(f"Translator: {translator}")

        # Find translation group
        group_elem = soup.find("div", class_="fantrans-value")
        group = group_elem.find("a").text.strip() if group_elem and group_elem.find("a") else "Unknown"
        print(f"Translation Group: {group}")

        # Find statistics
        stats = soup.find_all("div", class_="statistic-item")
        word_count = rating = views = "Unknown"
        
        for stat in stats:
            stat_name = stat.find("div", class_="statistic-name").text.strip()
            stat_value = stat.find("div", class_="statistic-value").text.strip()
            
            if "Số từ" in stat_name:
                word_count = stat_value
            elif "Đánh giá" in stat_name:
                rating = stat_value
            elif "Lượt xem" in stat_name:
                views = stat_value

        print(f"Word count: {word_count}")
        print(f"Rating: {rating}")
        print(f"Views: {views}")

    except Exception as e:
        print(f"Error occurred: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: URL argument is required", file=sys.stderr)
        sys.exit(1)
        
    url = sys.argv[1]
    get_novel_info(url)