
from playwright.sync_api import sync_playwright
import re
import os
import json
from bs4 import BeautifulSoup


all_user_details = {}
login_url = "https://intranet.alxswe.com/auth/sign_in"


def login(email, password):

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(login_url)
            page.fill('input#user_email', email)
            page.fill('input#user_password', password)
            page.click('input[type=submit]')
            html_ = page.inner_html('main')
            print("Login successful.")
            os.system('clear')

            return html_

    except Exception as e:
        print(f"Can't log in. Error: {str(e)}")

def extract_panels(content, cohort):
    global panels

    try:
        soup = BeautifulSoup(content, 'lxml')
        page = soup.find('div', class_="col-md-6")

        if page:
            # Filter out the unwanted panel
            unwanted_panel = page.find('div', class_="panel panel-default events-card")
            if unwanted_panel:
                unwanted_panel.decompose()

            panels = page.find_all('div', class_="panel panel-default")

            return panels

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return None

def extract_future_projects(panel):
    future_projects = []
    title = panel.find('h3', class_='panel-title').text.strip()

    if 'Future team projects' in title:
        projects = panel.find_all('li', class_='list-group-item')

        for project in projects:
            code = project.find('code').text.strip()
            name = project.find('a').text.strip()
            start_time = project.find('div', class_='d-inline-block').find('span', class_='datetime').text
            link = "https://intranet.alxswe.com" + project.find('a')['href'].strip()

            project_info = {
                'code': code,
                'name': name,
                'start_time': start_time,
                'link': link
            }

            future_projects.append(project_info)

    return future_projects

def extract_current_projects(panel):
    current_projects = []
    title = panel.find('h3', class_='panel-title').text.strip()

    if 'Current projects' in title:
        projects = panel.find_all('li', class_='list-group-item')

        for project in projects:
            deadline_class_type = project.get('class')

            if 'in_second_deadline' in deadline_class_type:
                deadline_type = '2ND'
            else:
                deadline_type = '1ST'

            code = project.find('code').text.strip()
            name = project.find('a').text.strip()
            optional = 'Optional' if project.find('span', class_='alert alert-info bpi-advanced') else ''
            progress_element = project.find('div', class_='project_progress_percentage alert alert-info')
            progress = progress_element.text.strip() if progress_element else "Progress not available"
            start_time_element = project.find('div', class_='d-inline-block').find('span', class_='datetime')
            start_time = start_time_element.text if start_time_element else None

            deadline_element = start_time_element.find_next('div', class_='d-inline-block').find('span', class_='datetime')
            deadline = deadline_element.text if deadline_element else "No deadline"
            time_left_match = re.search(r'\((.*?)\)', project.strong.text if project.strong else '')
            time_left_ = time_left_match.group(1) if time_left_match else ''
            time_left = f'({time_left_})' if time_left_ else ''
            link = "https://intranet.alxswe.com" + project.find('a')['href'].strip()

            project_info = {
                'code': code,
                'name': name,
                'optional': optional,
                'progress': progress,
                'start_time': start_time,
                'deadline': deadline,
                'time_left': time_left,
                'link': link,
                'type': deadline_type
            }

            current_projects.append(project_info)

    return current_projects

def extracting_details(panels):
    all_projects = {'current_projects': [], 'future_projects': []}

    for panel in panels:
        no_project = 'None, enjoy the silence.\n'
        if 'None, enjoy the silence.' in panel.get_text():
            print(no_project)
            break
        future_projects = extract_future_projects(panel)
        current_projects = extract_current_projects(panel)

        if future_projects:
            for project in future_projects:
                all_projects['future_projects'].append(project)

        if current_projects:
            for project in current_projects:
                all_projects['current_projects'].append(project)

    return all_projects

def load_users():
    cohorts = {}
    with open('users.json', 'r') as f:
        cohorts = json.load(f)
    return cohorts

def cohort_data(cohort, email, password):
    try:
        content = login(email, password)
        panels = extract_panels(content, cohort)
        if panels:
            all_projects = extracting_details(panels)
            if all_projects['current_projects'] or all_projects['future_projects']:
                return all_projects
            else:
                print('No project now.')
                return {}
        else:
            print('No panels found.')
            return {}
    except KeyboardInterrupt:
        pass


def main():
    user_data = load_users()
    for cohort, details in user_data.items():
        email = details['email']
        password = details['password']
        projects = cohort_data(cohort, email, password)
        all_user_details[cohort] = projects

    with open('cohorts_data.json', 'w') as json_file:
        json.dump(all_user_details, json_file, indent=2)


if __name__ == "__main__":
    main()
