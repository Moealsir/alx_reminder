const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Set the time zone to Qatar (Asia/Qatar)
process.env.TZ = 'Asia/Qatar'; // Change time zone if needed

// Save token locally
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'auth_db'
    })
});


client.on('ready', () => {
    console.log('Client is ready!');
    client.sendMessage('97439900342@c.us', '*Server No:* `2`\n\nClient is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('error', async (error) => {
    console.error('An error occurred:', error);

    // Save data here
    try {
        await saveStudentData(studentsData);
        console.log('Student data saved successfully.');
    } catch (saveError) {
        console.error('Error saving student data:', saveError);
    }

    // Handle the error further, such as logging or sending a message to notify the user
    client.sendMessage('An error occurred: ' + error.message);
});



// #####################################################################

// ALX Reminder Bot

// This bot is to send daily project's reminder to alx student

// #####################################################################

// ######################################################################
// ######################## Admin commands ##############################

// Event listener for incoming messages
const admins = ['249904305810@c.us', '97439900342@c.us'];

// Event listener for incoming messages
client.on('message', async message => {
    const user = message.from;
    const body = message.body.trim().toLowerCase();

    // Check if the message is from an admin and the body is 'save'
    if (admins.includes(user) && body === 'save') {
        // Save student data
		client.sendMessage(user, `*Saving data...*`)
        console.log(cohortsData);
        saveStudentData(studentsData);
		client.sendMessage(user, `*Scrapping data...*`)
        // Execute the scraper after saving student data
        executeScraper(user);
		console.log('Loading students and cohort data...')
		loadStudentsData();
		loadCohortsData();
		console.log('Loaded successfully.')
    } else if (admins.includes(user) && body === 'scrap') {
        // Execute the scraper immediately
		client.sendMessage(user, `*Scrapping data...*`)
        executeScraper(user);
    } else if (admins.includes(user) && body === 'load') {
		// Execute the load functions
		console.log('Saving students data...')
		saveStudentData(studentsData);
		console.log('Loading students and cohort data...')
		loadStudentsData();
		loadCohortsData();
		console.log('Loaded successfully.')
		client.sendMessage(user, `*Data was loaded successfully.*`)
	} else if (admins.includes(user) && body === 'students') {
		// Construct a formatted string representing the student data
		let formattedData = "*Data of Students:* \n\n";
		Object.keys(studentsData).forEach(key => {
			// Check if studentsData[key] and studentsData[key].number are defined
			if (studentsData[key] && studentsData[key].number) {
				// Remove '@c.us' and add '+' at the beginning of the number
				const formattedNumber = `+${studentsData[key].number.replace('@c.us', '')}`;
				formattedData += `Number: ${formattedNumber}, Cohort: ${studentsData[key].cohort}\n`;
			} else {
				// Handle the case where studentsData[key] or studentsData[key].number is undefined
				formattedData += `Error: Missing data for student with key ${key}\n`;
			}
		});
	
		// Send the formatted data to the user only if it's not empty
		if (formattedData.trim() !== "") {
			client.sendMessage(user, formattedData);
		} else {
			client.sendMessage(user, formattedData);
		}
	} else if (body === 'stats') {
		// Calculate the number of all students
		const totalStudents = Object.keys(studentsData).length;

		// Calculate the number of students in each cohort
		const cohortCounts = {};
		Object.values(studentsData).forEach(student => {
			const cohort = student.cohort;
			cohortCounts[cohort] = (cohortCounts[cohort] || 0) + 1;
		});

		// Construct a formatted string representing the statistics
		let statsMessage = `*Statistics*\n\n`;
		statsMessage += `Total number of students: ${totalStudents}\n\n`;
		statsMessage += `*For each cohort:*\n\n`;
		Object.keys(cohortCounts).forEach(cohort => {
			statsMessage += `- Cohort ${cohort}: ${cohortCounts[cohort]}\n`;
		});

		// Send the statistics to the user
		client.sendMessage(user, statsMessage);
	} else if (body === 'share') {
		console.log('Sharing Bot number');
		share(user);
	}
});

function share(user) {
    client.sendMessage(user, '*Share bot to your cohort group:* 👇');
    client.getContactById('249965251782@c.us')
        .then(bot => {
            client.sendMessage(user, bot);
        })
        .catch(error => {
            console.error('Error sharing bot:', error);
        });
}

function contact_me(user) {
    client.sendMessage(user, '*To contact me:* 👇');
    client.getContactById('97439900342@c.us')
        .then(bot => {
            client.sendMessage(user, bot);
        })
        .catch(error => {
            console.error('Error sharing bot:', error);
        });
}


client.on('message', async (message) => {
    if (message.body.toLowerCase() === 'info') {
        // const chat = await message.getChat();
        const num_of_students = Object.keys(studentsData).length;
        const contact = client.getContactById('249965251782@c.us');

        client.sendMessage(message.from, `*Bot commands:*\n
		- To start chat use: \`@\`
		- For current projects use: \`.\`
		- For statistics use: \`stats\`
		- To share bot use: \`share\`\n
		*Features:*\n
		- Get instant remind of current projects.
		- Modify your current cohort.\n
		*Future adds:*\n
		- Set time to get reminder`);
        contact_me(message.from);
    }
});


// ######################## Admin commands ##############################
// ######################################################################

// ##############################################################################################################################

// ######################################################################
// ############ schedule save and scrap projects ########################

// Variable to track last save time
let lastSaveTime = new Date();
let me = '97439900342@c.us'

// Function to check if it's time to save data (6:30 AM)
function shouldSaveData() {
    const now = new Date();
    const targetTime = new Date(now);
    // Set the target time to 6:30 AM
    targetTime.setHours(16, 7, 0, 0);

        console.log(now.getTime)
        console.log(studentsData)
    // Save data if the current time is after or equal to 6:30 AM and it's a new day
    return now >= targetTime && now.getDate() !== lastSaveTime.getDate();
}


async function saveStudentData(studentsData) {
    try {
        // Write studentsData to students.json
        fs.writeFileSync('students.json', JSON.stringify(studentsData, null, 2));

        console.log('Student data saved to students.json');
    } catch (error) {
        console.error('Error saving student data:', error);
    }
}

function executeScraper(user) {
    try {
        // Execute the scraper
        console.log('Executing scraper...');
        exec('python3 scraper.py', (error) => {
            if (error) {
                console.error(`Error executing Python script: ${error}`);
                return;
            }
			client.sendMessage(user, `*Scrapping was done successfully.*`)
            console.log(`Scraper was done.`);
        });
    } catch (error) {
        console.error('Error executing scraper:', error);
    }
}



// Schedule task to save student data every hour
cron.schedule('0 * * * *', () => {
    saveStudentData(studentsData);
});

// Schedule task to saving and execute Python program every day at 6:35 AM
cron.schedule('2 0,6,12,18 * * *', () => {
	console.log('Saving...')
    // console.log(studentsData)
    saveStudentData(studentsData);
    console.log('Scraping...')
    exec('python3 scraper.py', (error) => {
        console.log('done')
        console.log('Loading students and cohort data...')
		loadStudentsData();
		loadCohortsData();
		console.log('Loaded successfully.')
        if (error) {
            console.error(`Error executing Python script: ${error}`);
            return;
        }
    });

});

// Schedule task to send reminder projects to all users every 6 hours
cron.schedule('5 0,6,12,18 * * *', () => {
    // Iterate over each user and send reminder projects
    Object.keys(studentsData).forEach(user => {
        const userCohort = studentsData[user].cohort;
        if (userCohort) {
            sendProjectsByCohort(user, userCohort);
        }
    });
});


// ############ schedule save and scrap projects ########################
// ######################################################################



// ##############################################################################################################################


// ######################################################################
// ###################### Students and cohort data file ############################

let studentsData = {};

// Load existing students data or initialize with an empty object
function loadStudentsData() {
    try {
        if (fs.existsSync('students.json')) {
            const fileContent = fs.readFileSync('students.json', 'utf8');
            if (fileContent.trim() !== '') {
                studentsData = JSON.parse(fileContent);
            }
        } else {
            console.log('students.json does not exist. Initializing with an empty student list.');
        }
    } catch (err) {
        console.error('Error reading students data:', err);
    }
}
loadStudentsData();

// Load cohort data from cohorts_data.json
let cohortsData = {};
function loadCohortsData() {
    try {
        if (fs.existsSync('cohorts_data.json')) {
            const fileContent = fs.readFileSync('cohorts_data.json', 'utf8');
            if (fileContent.trim() !== '') {
                cohortsData = JSON.parse(fileContent);
            } else {
                console.log('cohorts_data.json is empty.');
            }
        } else {
            console.log('cohorts_data.json does not exist.');
        }
    } catch (err) {
        console.error('Error reading cohorts data:', err);
    }
}
loadCohortsData();

// Check if the file is not empty
if (Object.keys(studentsData).length === 0) {
}

// ###################### Students and cohort data file ############################
// ######################################################################


// ##############################################################################################################################


    // ######################################################################
    // ################## send projects to the user #########################

    // Function to send projects to the user according to their cohort
    function sendProjectsByCohort(user, cohort) {
        const cohortData = cohortsData[cohort];

        if (cohortData) {
            const currentProjects = cohortData.current_projects || [];
            const futureProjects = cohortData.future_projects || [];

        if (currentProjects.length > 0) {
            let currentProjectsMessage = "*Current Projects:*\n\n";
            currentProjects.forEach(project => {
                currentProjectsMessage += `${project.code} ${project.name} ${project.type}\n`;
                currentProjectsMessage += `Start Time: ${project.start_time}\tDeadline: ${project.deadline}\n`;
                currentProjectsMessage += `Time Left: ${project.time_left}\n`;
                currentProjectsMessage += `Link: ${project.link}\n\n`;
            });
            client.sendMessage(user, currentProjectsMessage);
        } else {
            client.sendMessage(user, "No current projects available.");
        }

        if (futureProjects.length > 0) {
            let futureProjectsMessage = "*Future Projects:*\n\n";
            futureProjects.forEach(project => {
                futureProjectsMessage += `${project.code} ${project.name}\n`;
                futureProjectsMessage += `Start Time: ${project.start_time}\n`;
                futureProjectsMessage += `Link: ${project.link}\n\n`;
            });
            client.sendMessage(user, futureProjectsMessage);
        } else {
            client.sendMessage(user, "No future projects available.");
        }
    } else {
        client.sendMessage(user, "Invalid cohort number.");
    }
}


// send current project to user
client.on('message_create', message => {
    if (message.body === '.') {
        // Send projects to the user according to their cohort
        const userCohort = studentsData[message.from].cohort;
        if (userCohort) {
            sendProjectsByCohort(message.from, userCohort);
        } else {
            client.sendMessage('No Avaiable projects')
        }
    }
})

// ################## send projects to the user #########################
// ######################################################################


// ##############################################################################################################################


// ######################################################################
// ################## main @ and bot function ###########################

// Define a variable to track if the user is inside the menu
let is_inside_menu = true;

// Event listener for incoming messages
client.on('message', async message => {
    const user = message.from;


    if (message.body === '@' || message.body.toLowerCase() === 'bot') {
        if (!studentsData[user]) {
            // Set a flag to indicate that the user has been prompted to enter a cohort number
            studentsData[user] = { prompted: true };
            client.sendMessage(user, 'Welcome to ALX! Please enter your cohort number:');
        } else {
            // User is already registered, prompt for choices
            client.sendMessage(user, 'Welcome back to ALX! Please choose from the following options:\n1. Check which cohort you are in.\n2. Change cohort number.\n3. Cancel the service.');
        }
        // Reset the inside menu flag when user interacts with '@'
        is_inside_menu = false;
    } else if (studentsData[user] && studentsData[user].prompted) {
        // Check if the user has been prompted to enter a cohort number
        const cohortNumber = parseInt(message.body);
        if (!isNaN(cohortNumber) && cohortNumber >= 1 && cohortNumber <= 22) {
            const newUser = { number: user, cohort: cohortNumber };
            studentsData[user] = newUser;
            if (shouldSaveData()) {
                saveStudentData(studentsData);
                lastSaveTime = new Date();
            }
            delete studentsData[user].prompted; // Remove the prompted flag
            await share(user);
            client.sendMessage(user, `You entered cohort number: ${cohortNumber}. You will receive daily project reminders.`);
            // Set inside menu flag to true after user entered the cohort number
            is_inside_menu = true;
        } else {
            client.sendMessage(user, 'Invalid cohort number. Please enter a number between 1 and 22.');
        }
    } else {
        // User is already registered, process the choice if not inside the menu
        if (!is_inside_menu) {
            const choice = parseInt(message.body);
            switch (choice) {
                case 1:
                    // Check which cohort the user is in
                    const userCohort = studentsData[user].cohort;
                    client.sendMessage(user, `You are in cohort number: ${userCohort}`);
                    is_inside_menu = true;
                    break;
                    case 2:
                        // Change cohort number
                        studentsData[user].prompted = true;
                        client.sendMessage(user, 'Please enter your new cohort number:');
                        break;
                        case 3:
                            // Cancel the service
                            delete studentsData[user];
                    if (shouldSaveData()) {
                        saveStudentData(studentsData);
                        lastSaveTime = new Date();
                    }
                    client.sendMessage(user, 'You have successfully canceled the service.');
                    is_inside_menu = true;
                    break;
                    default:
                        // No action for other messages
                        break;
                    }
                    // Send "Invalid choice" message only if the choice is invalid
                    if (![1, 2, 3].includes(choice)) {
                        client.sendMessage(user, 'Invalid choice. Please choose a number between 1 and 3.');
                    }
                }
            }
        });

// ################## main @ and bot function ###########################
// ######################################################################


client.initialize().catch(error => {
    console.error('Error initializing client:', error);
    // Save data or take other necessary actions
    // For example:
    saveStudentData(studentsData);
    console.log('Student data saved successfully.');
});