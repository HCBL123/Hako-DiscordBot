import requests 
from bs4 import BeautifulSoup

def get_chapter_content(url, headers):
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        content_div = soup.find("div", {"id": "chapter-content"})
        
        if content_div:
            # Get chapter content
            chapter_text = []
            for p in content_div.find_all("p"):
                if p.find("img"):
                    # Handle images
                    img = p.find("img")
                    chapter_text.append(f"[Image: {img.get('alt', 'No description')}]\n")
                else:
                    paragraph_text = p.text.strip()
                    if paragraph_text:
                        chapter_text.append(paragraph_text)
            
            return "\n\n".join(chapter_text)
        
        print("Content div not found")
        return None

    except requests.RequestException as e:
        print(f"Network error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None