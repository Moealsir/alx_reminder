from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

import os
import time
import random
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from getpass import getpass
from email_validator import validate_email, EmailNotValidError


def user_data():
    global email, password
    email=os.getenv("PROJECT_REMINDER_EMAIL")
    password=os.getenv("PROJECT_REMINDER_PASSWORD")
    print("Please wait...")
    
    if email and password:
        pass
    else:
        while True:
            email_input = input("Enter your email: ")
            try:
                v=validate_email(email_input)
                break
            except EmailNotValidError as e:
                print(f"Error: {str(e)}. Please enter a valid email.")
        
        password_input = getpass.getpass("Enter your password: ")
        
        with open(os.path.expanduser("~/.bashrc"), "a") as bashrc_file:
            bashrc_file.write(f'PROJECT_REMINDER_EMAIL="{email}"\n')
            bashrc_file.write(f'PROJECT_REMINDER_PASSWORD="{password}"\n')
    
    return email, password

def login(email, password):
    global driver
    
    login_url="https://intranet.alxswe.com/auth/sign_in"
    
    chrome_path="/bin/chromedriver"
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    driver = webdriver.Chrome(service=ChromeService(), options=chrome_options)
    
    try:
        driver.get(login_url)
        
        email_feild = driver.find_element(By.CSS_SELECTOR, 'input[name="user[email]"]')
        email_feild.send_keys(email)
        
        password_feild = driver.find_element(By.CSS_SELECTOR, 'input[name="user[password]"]')
        
        password_feild.send_keys(password)
        password_feild.send_keys(Keys.RETURN)
        
        time.sleep(5)
        
        # print("Login in successfully.")
    except:
        print("Can't login in.")

def extract_project_details(driver):
    global projects
    target_url="https://intranet.alxswe.com"
    
    driver.get(target_url)
    content=driver.page_source
    soup = BeautifulSoup(content, 'html.parser')
    panels=soup.find('div', class_="panel panel-default")
    projects=panels.find_all('li')
    return projects

def store_projects_details(projects):
    global project_details_list
    project_details_list=[]
    for project in projects:
        project_details={}

        code = project.find('code').text.strip()
        name = project.find('a').text.strip()
        project_link = f"https://intranet.alxswe.com{project.find("a").get("href")}"
        progress = project.find('div', class_='project_progress_percentage alert alert-info').text.strip()
        optional = 'Optional' if project.find('span', class_='alert alert-info bpi-advanced') else ''

        # Extracting datetime information
        start_time_element = project.find('div', class_='d-inline-block').find('span', class_='datetime')
        start_time = start_time_element.text.strip() if start_time_element else ''

        deadline_type = project.find('strong').text.strip()
        deadline_element = project.find('strong').find_next('div', class_='d-inline-block')

        # Extracting deadline information
        deadline = deadline_element.text.strip()

        # Extracting time left information
        deadline_date = datetime.strptime(deadline, "%b %d, %Y %I:%M %p")
        time_left = f"({(deadline_date - datetime.now()).days} days)"

        # Adding details to the project_details dictionary
        project_details['code'] = f"\033[38;2;219;62;62m{code}\033[0m"
        project_details['name'] = f"\033[38;2;219;62;62m{name}\033[0m"
        project_details['progress'] = f"\033[38;2;152;163;174m{progress}\033[0m"
        project_details['optional'] = f"\033[38;2;152;163;174m{optional}\033[0m"
        project_details['start_time'] = f"\033[1m\033[38;2;52;152;219m{start_time}\033[0m"
        project_details['deadline_type'] = f"\033[1m\033[38;2;52;152;219m{deadline_type}\033[0m"
        project_details['deadline'] = f"\033[1m\033[38;2;52;152;219m{deadline if deadline else ''}\033[0m"
        project_details['time_left'] = f"\033[1m{time_left if time_left else ''}\033[0m"
        project_details["project_link"] = f"\033[1m\033[38;2;52;152;219m{project_link}\033[0m"

        # Appending the project_details dictionary to the list
        project_details_list.append(project_details)

    return project_details_list


def print_projects(details_list):
    for project_details in details_list:
        print(project_details['code'], project_details['name'], project_details['optional'], project_details['progress'])
        print("Start Time:", project_details['start_time'], '     ', "Deadline:", project_details['deadline'])
        print("Time Left:", project_details['time_left'])
        print("Project Link: ", project_details["project_link"])
        print()
    
def main():
    user_data()
    login(email, password)
    
    projects = extract_project_details(driver)
    details_list = store_projects_details(projects)
    
    os.system("clear" if os.name == "posix" else "cls")
    print("Your Current Projects:\n")
    
    print_projects(details_list)

    # # Print details for each project
    # for project_details in details_list:
    #     print(project_details['code'], project_details['name'], project_details['optional'], project_details['progress'])
    #     print("Start Time:", project_details['start_time'], '     ', "Deadline:", project_details['deadline'])

    #     print("Time Left:", project_details['time_left'])
    #     print("Project Link: ", project_details["project_link"])
    
    
    
if __name__ == "__main__":
    main()

    
    
