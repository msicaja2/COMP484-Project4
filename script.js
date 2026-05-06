// Default elements from template
const testWrapper = document.querySelector(".test-wrapper");
const testArea = document.querySelector("#test-area");
const originText = document.querySelector("#origin-text p");
const resetButton = document.querySelector("#reset");
const theTimer = document.querySelector(".timer");
// NEW: pause button timer
const pauseButton = document.querySelector("#pause");
// NEW: Highest score displats
const firstPlace = document.querySelector(".first-place p");
const secondPlace = document.querySelector(".second-place p");
const thirdPlace = document.querySelector(".third-place p");
// NEW: mistake counter display
const mistakeDisplay = document.querySelector(".mistakes p");
// NEW: words per minute display
const wpmDisplay = document.querySelector(".wpm p");
// New audio element
const celebrateAudio = new Audio('assets/celebrate.mp3');

// Testing purposes: clear the local storage
//localStorage.clear();


// Array of sample texts to test
var sampleTexts = ["Larry walked down the ball room and decided to slap his own friend in the face. Actually his name is not Larry, it is Harry Osborn and he decided to slap his own friend Peter Parker because of reasons I forgot because it's been a while since I've seen the movie Spiderman 2.",
                   "I am sitting in my room typing this paragraph and I have not eaten since 11:30pm last night. Right now it is 3:30 pm and I am starving, but I cannot eat until tomorrow. I feel awful and could go for Dave's Hot Chicken right now.",
                   "One time when I was just a wee little lad, about 5 years old, I had this dog named Spike and a pet rabbit whose name I forgot. Spike and the rabbit had a stand off and actually started fighting eachother, it was crazy. The fight was too fast for my pathetic 5 year old eyes to keep up with but I do know the rabbit won for sure.",
                   "For some reason when I installed Minecraft on my new laptop the icon doesn't appear for it. It is like the icon never existed. I have Minecraft pinned on my taskbar but it is literally invisible, if you look at my taskbar there is a literal gap in between some of the icons, that gap is Minecraft.",
                   "Did you know that the way sharks reproduce varies from species to species? Some lay eggs that are called 'mermaid purses' and they look really cool because you can see the little shark growing inside. Other species give birth. One specific species called the Sandtiger shark will actually have the babies already born inside the mother and they will eat eachother until there is a last man standing!"];


////////// Elements added /////////
// Time elements
var minute = 0;
var second = 0;
var centisecond = 0;

// time object constructor
function Time(minutes, seconds, centiseconds) {
    this.minutes = minutes;
    this.seconds = seconds;
    this.centiseconds = centiseconds;
}

// Others
var idx = Math.floor(Math.random() * sampleTexts.length); // Paragraph idx for current playthrough
let intervalID = null;
var paused = false;
var restarted = false;
var started = false;
var mistakeCount = 0;
var backSpacePressed = false;
var wpm = 0;


// Initialize everything
resetEverything();
displayTop3();

/////////// Functionality ///////////

// Update the display for the top 3
function displayTop3() {
    // Get the top 3 as variables
    const top1 = localStorage.getItem('top1');
    const top2 = localStorage.getItem('top2');
    const top3 = localStorage.getItem('top3');

    // Make top 3 usable
    const top1Use = JSON.parse(top1);
    const top2Use = JSON.parse(top2);
    const top3Use = JSON.parse(top3);

    if (top1 !== null) {
        firstPlace.textContent = formatTop3(top1Use);
    }
    if (top2 !== null) {
        secondPlace.textContent = formatTop3(top2Use);
    }
    if (top3 !== null) {
        thirdPlace.textContent = formatTop3(top3Use);
    }
}

function formatTop3(displayVal) {
    return fixTimeFormat(displayVal.minutes) + ":" + fixTimeFormat(displayVal.seconds) + ":" 
            + fixTimeFormat(displayVal.centiseconds);
}


// Add leading zero to numbers 9 or below (purely for aesthetics):
function fixTimeFormat(time) {
    if (time < 10) {
        return "0" + time;
    }
    else {
        return time;
    }
}

// Run a standard minute/second/hundredths timer:
function updateTimer() {
    // Increment centisecond
    ++centisecond;

    // Update seconds/minute and do a reset if needed
    if (centisecond == 99) {
        ++second;
        centisecond = 0;
    }
    if (second == 60) {
        ++minute;
        second = 0;
    }

    theTimer.textContent = fixTimeFormat(minute) 
                            + ":" + fixTimeFormat(second) 
                            + ":" + fixTimeFormat(centisecond);
}


// Match the text entered with the provided text on the page:
function compareText(e) {
    // Current input text
    let currText = e.target.value;

    // If completed typing the text and matches test paragraph
    if (currText == sampleTexts[idx]) {
        testWrapper.style.borderColor = "green"; // Change border color to indicate success

        // Stop timer
        clearInterval(intervalID);
        intervalID = null;

        testArea.readOnly = true; // Prevent typing

        /// Fastest scores
        let time = new Time(minute, second, centisecond);
        updateTopThree(time);
        displayTop3();

        // Stop the rest of the code in the function from running
        return;
    }

    // Update wpm value and the display for it
    updateWPM(currText);

    // Compare input with the test paragraph
    if (sampleTexts[idx].startsWith(currText)) { // If current input is correct
        testWrapper.style.borderColor = "blue";
    }
    else { // If current input is incorrect
        testWrapper.style.borderColor = "red";
        if (e.inputType !== "deleteContentBackward") { // Only increment counter if backspace isn't pressed
            updatemistakeCounter();
        }
    }
}

// Update mistakes function
function updatemistakeCounter() {
    ++mistakeCount;
    mistakeDisplay.textContent = mistakeCount;
}

// Update WPM
function updateWPM(currText) {
    if (second == 0) {
        wpm = 0;
    }
    else {
        let totalSeconds = second + (minute * 60);
        wpm = (currText.length / 5) / (totalSeconds / 60);
    }

    let wpmFixed = wpm.toFixed(2);

    wpmDisplay.textContent = wpmFixed;
}

// Update top 3 (if applicable)
function updateTopThree(time) {
    // Get the top 3 as variables
    const top1 = localStorage.getItem('top1');
    const top2 = localStorage.getItem('top2');
    const top3 = localStorage.getItem('top3');

    // Convert time to centiseconds
    const timeCentiSeconds = time.centiseconds + (100 * time.seconds) + (6000 * time.minutes);
    // Make top 3 usable
    const top1Use = JSON.parse(top1);
    const top2Use = JSON.parse(top2);
    const top3Use = JSON.parse(top3);

    // If any of the top 3 are not initialized, set current time as one of the top 3
    if (top1 === null) {
        localStorage.setItem('top1', JSON.stringify(time));
        triggerCelebration();
        return;
    }
    else if (top2 === null) {
        if (isFaster(timeCentiSeconds, top1Use)) { // If time is faster than top 1
            localStorage.setItem('top2', JSON.stringify(top1Use)); // Set top 2 as old top 1
            localStorage.setItem('top1', JSON.stringify(time)); // Finally, set top 1 to new time
        }
        else { // Set time as new top 2
            localStorage.setItem('top2', JSON.stringify(time));
        }
        triggerCelebration();
        return;
    }
    else if (top3 === null) {
        if (isFaster(timeCentiSeconds, top1Use)) {
            localStorage.setItem('top3', JSON.stringify(top2Use)); // Set top 2 as old top 1
            localStorage.setItem('top2', JSON.stringify(top1Use)); // Set top 2 as old top 1
            localStorage.setItem('top1', JSON.stringify(time)); // Finally, set top 1 to new time
        }
        else if (isFaster(timeCentiSeconds, top2Use)) {
            localStorage.setItem('top3', JSON.stringify(top2Use)); // Set top 2 as old top 1
            localStorage.setItem('top2', JSON.stringify(time)); // Finally, set top 2 to new time
        }
        else {
            localStorage.setItem('top3', JSON.stringify(time));
        }
        triggerCelebration();
        return;
    }

    // Only if all top 3 spots are populated
    if (isFaster(timeCentiSeconds, top1Use)) {
        localStorage.setItem('top3', JSON.stringify(top2Use)); // Set time 3 to old time 2
        localStorage.setItem('top2', JSON.stringify(top1Use)); // Set time 2 to old time 1
        localStorage.setItem('top1', JSON.stringify(time)); // Finally, set time 1 to new time
        triggerCelebration();
    }
    else if (isFaster(timeCentiSeconds, top2Use)) {
        localStorage.setItem('top3', JSON.stringify(top2Use)); // Set time 3 to old time 2
        localStorage.setItem('top2', JSON.stringify(time)); // Finally set time 2 to new time
        triggerCelebration();
    }
    else if (isFaster(timeCentiSeconds, top3Use)) {
        localStorage.setItem('top3', JSON.stringify(time)); // Set time 3 to new time
        triggerCelebration();
    }
}

// Helper function for comparing top 3
function isFaster(timeCentiSeconds, topCompare) {
    const topCentiseconds = topCompare.centiseconds + (100 * topCompare.seconds) + (6000 * topCompare.minutes);

    if (timeCentiSeconds < topCentiseconds) { // Compare to see which is faster, if faster return true
        return true;
    }

    return false; // Not faster so return false
}

// function for triggering celebration
function triggerCelebration() {
    // Play audio
    celebrateAudio.play();

    // Trigger confetti effect
    confetti({
        particleCount: 1000,
        spread: 200,
        origin: { y: 0.6 },
    });
}


// Restart the timer:
function restartApp() {
    if (started) {
        // Save index from array so it can be used to compare text later
        idx = Math.floor(Math.random() * sampleTexts.length);

        // Reload mistake counter
        mistakeCount = 0;
        mistakeDisplay.textContent = mistakeCount;

        // Reload wpm counter
        wpm = 0;
        wpmDisplay.textContent = "N/A";

        testWrapper.style.borderColor = "grey"; // Reset color back to original

        testArea.focus(); // Make testArea automatically allow typing immediately upon restart
    
        resetEverything();
        
        intervalID = setInterval(updateTimer, 10);
    }
}

// Reset everything:
function resetEverything() {
    paused = false; // Set paused as false
    testArea.value = ""; // Clear text area

    minute = 0;
    second = 0;
    centisecond = 0;

    // Change test text
    originText.textContent = sampleTexts[idx];

    // Clear and null intervalID so timer doesn't go faster in case of pause misuse
    clearInterval(intervalID);
    intervalID = null;

    // If successfully typed out previously, make sure text area can be typed into
    testArea.readOnly = false;
}


// Pause button functionality
function pauseTimer() { // Only triggers once the pause button is pressed
    if (started) {
        if (!paused) { // If paused, stop timer and prevent typing
            pauseButton.textContent = "Resume";
            clearInterval(intervalID);
            testArea.readOnly = true;
            intervalID = null;
            paused = true;
        }
        else {
            pauseButton.textContent = "Pause";
            testArea.focus(); // Make testArea automatically allow typing immediately upon unpause
            testArea.readOnly = false;
            intervalID = setInterval(updateTimer, 10);
            paused = false;
        }
    }
}

// Event listeners for keyboard input and the reset button:
resetButton.addEventListener("click", restartApp);
pauseButton.addEventListener("click", pauseTimer);
testArea.addEventListener('input', (e) => {
    if (e.target.value.length > 0 && !started) {
        compareText(e);
        started = true;
        intervalID = setInterval(updateTimer, 10); // Start timer
    }
    else if (e.target.value.length > 0 && started) { // If started but not restarted
        compareText(e);
    }
});
// Event listeners to prevent pasting into the testArea
testArea.addEventListener("paste", (e) => e.preventDefault());
testArea.addEventListener("drop", (e) => e.preventDefault());