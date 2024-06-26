const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { group } = require('console');

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
        saveStudentData(studentsData);
        client.sendMessage(user, `*Data was saved.*`)
    } else if (admins.includes(user) && body === 'scrap') {
        // Execute the scraper immediately
        client.sendMessage(user, `*Scrapping data...*`)
        executeScraper(user);
        client.sendMessage(user, `*Scrapping data...*`)
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

// Define global variable to track if admin is sending a message
let isAdminSendingMessage = false;

// Event listener for messages
client.on('message', async (message) => {
    const user = message.from;
    const body = message.body.trim().toLowerCase();

    // Check if the message is from the specific admin and the body is 'send'
    if (user === '97439900342@c.us' && body === 'send') {
        // Set the flag to true to indicate that the admin is sending a message
        isAdminSendingMessage = true;

        // Send a message to the admin to prompt for the message to forward
        client.sendMessage(user, 'Please enter the message you want to forward to all students:');
    } else if (isAdminSendingMessage && user === '97439900342@c.us') {
        // Check if the admin is in the process of sending a message and the message is from the admin
        // Forward the message to all students
        const students = Object.keys(studentsData);
        let index = 0;

        const sendNextMessage = async () => {
            if (index < students.length) {
                const student = students[index];
                console.log(`send to ${student}`)
                await client.sendMessage(student, message.body);
                index++;

                // Wait for 5 seconds before sending the next message
                setTimeout(sendNextMessage, 2000);
            } else {
                // All messages sent, notify the admin
                client.sendMessage(user, 'Message forwarded to all students successfully.');
                
                // Reset the flag
                isAdminSendingMessage = false;
            }
        };

        // Start sending messages to students
        sendNextMessage();
    }
});



function share(user) {
    client.sendMessage(user, '*Share bot to your cohort group:* 👇');
    client.getContactById('249123163787@c.us')
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
    if (message.body.toLowerCase() === 'info' || message.body.toLowerCase() === 'usage') {
        // const chat = await message.getChat();

        client.sendMessage(message.from, `*Bot commands:*\n\n- To start chat use: \`@\`\n- For current projects use: \`.\`\n- For statistics use: \`stats\`\n- To share bot use: \`share\`\n\n*Features:*\n\n- Get instant remind of current projects.\n- Modify your current cohort.\n\n*Future adds:*\n\n- Set time to get reminder\n\n Only available for cohorts 19,20,22 now!\ncontact me if in another cohort`);
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

        console.log(`New user signed up.`)
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
cron.schedule('1 0,6,12,18 * * *', () => {
    console.log('Saving...')
    saveStudentData(studentsData);
    console.log('Scraping...')
    exec('python3 scraper.py', (error) => {
        console.log('done')
        console.log('Loading students and cohort data...')
        loadStudentsData();
        loadCohortsData();
        console.log('Loaded successfully.')
        Object.keys(studentsData).forEach(user => {
            const userCohort = studentsData[user].cohort;
            if (userCohort) {
                sendProjectsByCohort(user, userCohort);
                console.log(user)
            }
        });
        if (error) {
            console.error(`Error executing Python script: ${error}`);
            return;
        }
    });

});

// Schedule task to send projects to each student every day at 4:27 PM
cron.schedule('5 0,6,12,18 * * *', async () => {
    // Extract students from the dictionary and convert them into a list
    const studentsList = Object.keys(studentsData);

    // Iterate over each student and send projects with a 5-second delay between each message
    for (let i = 0; i < studentsList.length; i++) {
        const student = studentsList[i];
        const userCohort = studentsData[student].cohort;
        if (userCohort) {
            // Using setTimeout to introduce a 5-second delay
            setTimeout(() => {
                sendProjectsByCohort(student, userCohort);
                console.log(`sent to student ${student}`);
            }, i * 3000); // i * 5000 milliseconds = 5 seconds
        }
    }
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
async function sendProjectsByCohort(user, cohort) {
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
            await client.sendMessage(user, currentProjectsMessage);
        } else {
            await client.sendMessage(user, "No current projects available.");
        }

        if (futureProjects.length > 0) {
            let futureProjectsMessage = "*Future Projects:*\n\n";
            futureProjects.forEach(project => {
                futureProjectsMessage += `${project.code} ${project.name}\n`;
                futureProjectsMessage += `Start Time: ${project.start_time}\n`;
                futureProjectsMessage += `Link: ${project.link}\n\n`;
            });
            await client.sendMessage(user, futureProjectsMessage);
        } else {
            await client.sendMessage(user, "No future projects available.");
        }
    } else {
        await client.sendMessage(user, "Invalid cohort number.");
    }
}




// send current project to user
client.on('message_create', message => {
    if (message.body === '.') {
        // Send projects to the user according to their cohort
        const userCohort = studentsData[message.from].cohort;
        if (userCohort) {
            sendProjectsByCohort(message.from, userCohort);
        } else if (!userCohort){
            client.sendMessage(message.from, 'You are new member, Please send `@` to start with bot')
        }
    }
})

// ################## send projects to the user #########################
// ######################################################################





// group test
const groupData = {};
function saveGroupData() {
    console.log('Group data saved:', groupData);
}


client.on('message', async (message) => {
    // Check if the message is from a group
    const chat =    // Gets the chat object where the message was sent
    client.pin(message)

    // const groupAdminsss = chat.getAdmins();  // Retrieves a list of group admins
    // if (message.isGroupMsg) {
    //     console.log('yes')

    //     // Check if the sender's ID is in the list of group admins' IDs
    //     const isSenderAdmin = groupAdminsss.some(admin => admin.id._serialized === message.author);

    //     console.log('Is sender admin:', isSenderAdmin ? 'Yes' : 'No');
    // } else {
    //     console.log('no')
    // }
});

// client.on('message', async (message) => {

//     const groupAdmin = group.owner
//     const user = message.from
//     if (user === groupAdmin) {
//         console.log(groupAdmin)
//         console.log('yes')
//     } else {
//         console.log('no')
//     }
//     // if () {
//         // console.log(client.groupAdmin)
//     // }
// });

// client.on('message', async message => {
//     const groupId = message.from;
//     if (message.isGroupMsg && groupData[groupId] && groupData[groupId].cohort === null) {
//         // Only process messages if cohort is not set and it's from an admin
//         const groupAdmins = await client.getGroupAdmins(groupId);
//         if (groupAdmins.map(admin => admin._serialized).includes(message.author)) {
//             const potentialCohort = parseInt(message.body);
//             if (!isNaN(potentialCohort) && potentialCohort >= 16 && potentialCohort <= 22) {
//                 groupData[groupId].cohort = potentialCohort;
//                 saveGroupData();
//                 client.sendMessage(groupId, `Cohort number set to ${potentialCohort}.`);
//                 console.log(`Cohort saved for ${groupData[groupId].groupName}: ${potentialCohort}`);
//             } else {
//                 client.sendMessage(groupId, 'Invalid cohort number. Please enter a number between 16 and 22.');
//             }
//         }
//     }
//     // Further message handling for other commands
// });


client.initialize().catch(error => {
    console.error('Error initializing client:', error);
    // Save data or take other necessary actions
    // For example:
    saveStudentData(studentsData);
    console.log('Student data saved successfully.');
});