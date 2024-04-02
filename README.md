# ALX Reminder Bot

ALX Reminder Bot is a WhatsApp bot designed to send daily project reminders to ALX students. It also allows administrators to manage student data and provides users with options to interact with the bot.<br>
## Features

Daily Project Reminders: Receive daily reminders of current projects.

### User Interaction:
1. Users can start a chat.
2. Modify their cohort number.
3. Cancel the service.
4. Check today's projects.
5. Check info using: info.

### Future adds:
1. Cancel default reminder.
2. Set cutom time reminders.



## Install dependencies:

bash

	pip install -r requirements.txt

## Installation:

bash

    Clone the repository:

    git clone https://github.com/Moealsir/alx_reminder.git

	cd alx_reminder

	npm init
	npm i nodemon
	npm i fs-extra
	npm install whatsapp-web.js
	npm install qrcode-terminal
	npm install node-cron

## Set up authentication:

    A directory with name auth_db will be created to save token.

## Users:

	user.json most be created with the emails and passwords inside it.

## Run the bot:

bash

    npm start

Usage

    Starting a Chat:
        Send @ or bot to start a chat with the bot.

    Getting Project Reminders:
        Send . to receive current project reminders.

    Modifying Cohort Number:
        If prompted, enter your new cohort number to modify it.

    Cancelling the Service:
        Enter 3 to cancel the service.

Dependencies

    node-cron: For scheduling tasks.
    whatsapp-web.js: WhatsApp Web API library.
    qrcode-terminal: For displaying QR codes.
    fs: For file system operations.
    child_process: For executing Python scripts.

Contributing

Contributions are welcome! Please follow the contribution guidelines.
License

This project is licensed under the MIT License.
Author

    Moealsir

Acknowledgements

Special thanks to ALX for the inspiration behind this project.