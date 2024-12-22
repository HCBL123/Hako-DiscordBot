import requests
from bs4 import BeautifulSoup
from crawl_data import get_chapter_content

url = "https://ln.hako.vn/truyen/18973-childhood-friend-of-the-zenith"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    print(f"Status Code: {response.status_code}")
    
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Find title
    title_element = soup.find("title")
    if title_element:
        full_title = title_element.text.strip()
        novel_title = full_title.split(" - ")[0].strip()
        print(f"Title: {novel_title}")
    
    # Find author
    author_div = soup.find("div", class_="info-item", string=lambda text: "Tác giả:" in str(text) if text else False)
    if author_div:
        author = author_div.find("a").text.strip()
        print(f"Author: {author}")

    # Find translator
    translator_elem = soup.find("span", class_="series-owner_name")
    if translator_elem:
        translator = translator_elem.find("a").text.strip()
        print(f"Translator: {translator}")

    # Find translation group
    group_elem = soup.find("div", class_="fantrans-value")
    if group_elem:
        group = group_elem.find("a").text.strip()
        print(f"Translation Group: {group}")

    # Find statistics
    stats = soup.find_all("div", class_="statistic-item")
    for stat in stats:
        stat_name = stat.find("div", class_="statistic-name").text.strip()
        stat_value = stat.find("div", class_="statistic-value").text.strip()
        
        if "Số từ" in stat_name:
            print(f"Word count: {stat_value}")
        elif "Đánh giá" in stat_name:
            print(f"Rating: {stat_value}")
        elif "Lượt xem" in stat_name:
            print(f"Views: {stat_value}")
    # Find translation group
    group_elem = soup.find("div", class_="fantrans-value")
    if group_elem:
        group = group_elem.find("a").text.strip()
        print(f"Translation Group: {group}")



except requests.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"Error: {e}")