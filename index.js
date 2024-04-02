const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');


// Save token location
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'auth_db'
    })
});


client.on('ready', () => {
    console.log('Client is ready!');
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
const admins = ['249904305810@c.us', '94739900342@c.us'];

// Event listener for incoming messages
client.on('message', async message => {
    const user = message.from;
    const body = message.body.trim().toLowerCase();

    // Check if the message is from an admin and the body is 'save'
    if (admins.includes(user) && body === 'save') {
        // Save student data
        console.log(cohortsData);
        saveStudentData(studentsData);
        console.log('Student data saved to students.json');
    }
});

client.on('message', async (message) => {
    if (message.body.toLowerCase() === 'info') {
        // const chat = await message.getChat();
        const num_of_students = Object.keys(studentsData).length;
        const developer = '+97439900342';
        client.sendMessage(message.from, `*Bot commands:*\n\nTo start chat use: \`@\`\nFor current projects use: \`.\`\n`);
        await client.sendMessage(message.from, `*Features:*\n\n- Get instant remind of current projects.\n- Modify your current cohort.\n\n*Future adds:*\n\n- Set time to get reminder\n\nNumber of users: ${num_of_students}`);
        client.sendMessage(message.from, `This bot is developed by: *Moealsir*\n\nTo contact me: ${developer}`);
    }
});


// ######################## Admin commands ##############################
// ######################################################################

// ##############################################################################################################################

// ######################################################################
// ############ schedule save and scrap projects ########################

// Variable to track last save time
let lastSaveTime = new Date();

// Function to check if it's time to save data (6:30 AM)
function shouldSaveData() {
    const now = new Date();
    const targetTime = new Date(now);
    // Set the target time to 6:30 AM
    targetTime.setHours(6, 28, 0, 0);

	console.log(now.getTime)
	console.log(studentsData)
    // Save data if the current time is after or equal to 6:30 AM and it's a new day
    return now >= targetTime && now.getDate() !== lastSaveTime.getDate();
}


// Function to save student data to students.json
function saveStudentData(studentsData) {
    fs.writeFileSync('students.json', JSON.stringify(studentsData, null, 2));
}

// Schedule task to save student data every day at 6:30 AM
cron.schedule('05 6 * * *', () => {
    console.log(studentsData)
    saveStudentData(studentsData);
    console.log('Student data saved to students.json');
});

// Schedule task to execute Python program every day at 6:35 AM
cron.schedule('03 6 * * *', () => {
    console.log('scraping...')
    exec('python scraper.py', (error, stdout, stderr) => {
        console.log('done')
        if (error) {
            console.error(`Error executing Python script: ${error}`);
            return;
        }
        console.log(`Python script output: ${stdout}`);
    });

});

// Schedule task to send reminder projects to all users every 6 hours
cron.schedule('0 1,7,13,19 * * *', () => {
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
        if (!isNaN(cohortNumber) && cohortNumber >= 1 && cohortNumber <= 50) {
            const newUser = { number: user, cohort: cohortNumber };
            studentsData[user] = newUser;
            if (shouldSaveData()) {
                saveStudentData(studentsData);
                lastSaveTime = new Date();
            }
            delete studentsData[user].prompted; // Remove the prompted flag
            client.sendMessage(user, `You entered cohort number: ${cohortNumber}. You will receive daily project reminders.`);
            // Set inside menu flag to true after user entered the cohort number
            is_inside_menu = true;
        } else {
            client.sendMessage(user, 'Invalid cohort number. Please enter a number between 1 and 50.');
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


// initialize client
client.initialize();
