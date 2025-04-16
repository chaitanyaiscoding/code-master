import requests
import json
from bs4 import BeautifulSoup

def get_codechef_user_data(username):
    url = f"https://www.codechef.com/users/{username}"
    response = requests.get(url)
    
    if response.status_code != 200:
        return {"error": "Invalid username or API error!"}
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extracting rating and rank
    rating_tag = soup.find("div", class_="rating-number")
    rating = rating_tag.text.strip() if rating_tag else "Unrated"
    
    rank_tag = soup.find("div", class_="rating-ranks")
    global_rank = "Unranked"
    if rank_tag:
        rank_links = rank_tag.find_all("a")
        if rank_links:
            global_rank = rank_links[0].text.strip()
    
    # Extracting solved problems
    solved_problems = []
    problems_section = soup.find_all("div", class_="content")  # Updated to match correct div structure
    
    for problem_div in problems_section:
        problem_names = problem_div.find_all("span", style="font-size: 12px")
        for problem in problem_names:
            solved_problems.append(problem.text.strip())
    
    return {
        "username": username,
        "rating": rating,
        "global_rank": global_rank,
        "solved_problems": solved_problems
    }

if __name__ == "__main__":
    username = input("Enter CodeChef username: ")
    user_data = get_codechef_user_data(username)
    print(json.dumps(user_data, indent=4))
