import requests
import json

def get_codeforces_user_data(username):
    user_info_url = f"https://codeforces.com/api/user.info?handles={username}"
    user_status_url = f"https://codeforces.com/api/user.status?handle={username}"
    
    # Fetch user profile
    user_info_response = requests.get(user_info_url)
    user_data = user_info_response.json()
    
    if user_data["status"] != "OK":
        return "Invalid username or API error!"
    
    user_info = user_data["result"][0]
    
    # Fetch user submissions
    user_status_response = requests.get(user_status_url)
    submissions = user_status_response.json()
    
    solved_problems = set()
    unsolved_problems = set()
    
    if submissions["status"] == "OK":
        for submission in submissions["result"]:
            problem_id = f'{submission["problem"]["contestId"]}-{submission["problem"]["index"]}'
            if submission["verdict"] == "OK":
                solved_problems.add(problem_id)
            else:
                unsolved_problems.add(problem_id)
    
    # Remove solved problems from unsolved
    unsolved_problems -= solved_problems
    
    return {
        "username": user_info["handle"],
        "rating": user_info.get("rating", "Unrated"),
        "rank": user_info.get("rank", "Unranked"),
        "solved_problems": list(solved_problems),
        "unsolved_problems": list(unsolved_problems)
    }

if __name__ == "__main__":
    username = input("Enter Codeforces username: ")
    user_data = get_codeforces_user_data(username)
    print(json.dumps(user_data, indent=4))
