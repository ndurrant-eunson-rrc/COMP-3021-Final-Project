/**
 * Initializes the Trivia Game when the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("trivia-form");
    const questionContainer = document.getElementById("question-container");
    const newPlayerButton = document.getElementById("new-player");
    
    // Modal variables
    const resultsModal = document.getElementById("results-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const finalScoreDisplay = document.getElementById("final-score");

    // Initializes the game
    checkUsername();
    fetchQuestions();
    displayScores();

    // Modal event listener
    closeModalBtn.addEventListener('click', () => {
        resultsModal.classList.add('hidden');
    });

    /**
     * Fetches trivia questions from the API and displays them.
     */
    function fetchQuestions() {
        showLoading(true); // Show loading state

        fetch("https://opentdb.com/api.php?amount=10&type=multiple")
            .then((response) => response.json())
            .then((data) => {
                displayQuestions(data.results);
                showLoading(false); // Hide loading state
            })
            .catch((error) => {
                console.error("Error fetching questions:", error);
                showLoading(false); // Hide loading state on error
            });
    }

    /**
     * Toggles the display of the loading state and question container.
     * @param {boolean} isLoading - Indicates whether the loading state should be shown.
     */
    function showLoading(isLoading) {
        document.getElementById("loading-container").classList = isLoading
            ? ""
            : "hidden";
        document.getElementById("question-container").classList = isLoading
            ? "hidden"
            : "";
    }

    /**
     * Displays fetched trivia questions.
     * @param {Object[]} questions - Array of trivia questions.
     */
    function displayQuestions(questions) {
        questionContainer.innerHTML = ""; // Clear existing questions
        questions.forEach((question, index) => {
            const questionDiv = document.createElement("div");
            questionDiv.innerHTML = `
                <p>${question.question}</p>
                ${createAnswerOptions(
                    question.correct_answer,
                    question.incorrect_answers,
                    index
                )}
            `;
            questionContainer.appendChild(questionDiv);
        });
    }

    /**
     * Creates HTML for answer options.
     * @param {string} correctAnswer - The correct answer for the question.
     * @param {string[]} incorrectAnswers - Array of incorrect answers.
     * @param {number} questionIndex - The index of the current question.
     * @returns {string} HTML string of answer options.
     */
    function createAnswerOptions(
        correctAnswer,
        incorrectAnswers,
        questionIndex
    ) {
        const allAnswers = [correctAnswer, ...incorrectAnswers].sort(
            () => Math.random() - 0.5
        );
        return allAnswers
            .map(
                (answer) => `
            <label>
                <input type="radio" name="answer${questionIndex}" value="${answer}" ${
                    answer === correctAnswer ? 'data-correct="true"' : ""
                }>
                ${answer}
            </label>
        `
            )
            .join("");
    }

    // Event listeners for form submission and new player button
    form.addEventListener("submit", handleFormSubmit);
    newPlayerButton.addEventListener("click", newPlayer);

    /**
     * Handles the trivia form submission.
     * @param {Event} event - The submit event.
     */
    function handleFormSubmit(event) {
        event.preventDefault();
        
        // Gets the player's username
        const usernameInput = document.getElementById("username");
        const currentUsername = usernameInput.value.trim();

        // Ensures a name is provided
        if (!currentUsername) {
            alert("Please enter a username to submit your score.");
            return; // Stops execution
        }
        
        // Only sets the cookie if it doesn't already exist
        if (!getCookie('username')) {
            setCookie('username', currentUsername, 7);
            
            // Updates the UI to lock the username field for the next round
            checkUsername(); 
            console.log(`New user session created for: ${currentUsername}`);
        } else {
            console.log(`Submitting game as returning user: ${getCookie('username')}`);
        }
        
        const finalScore = calculateScore();
        saveScore(currentUsername, finalScore); // saves the score
        displayResults(finalScore); // gives user feedback for final score

        // For the next game
        fetchQuestions(); // Loads a new set of questions
        form.reset(); // Clears the selected radio buttons
    }

    /**
     * Checks for a username cookie and updates the page.
     * Locks input field and displays the stored username for returning users.
     */
    function checkUsername() {
        const usernameInput = document.getElementById("username");
        const newPlayerButton = document.getElementById("new-player");
        
        // Uses utility function to check for the cookie
        const existingUsername = getCookie("username"); 

        if (existingUsername) {
            // For returning playing
            console.log(`Session found for: ${existingUsername}`);
            usernameInput.value = existingUsername;
            usernameInput.disabled = true; // Locks the input
            newPlayerButton.classList.remove("hidden"); // Shows 'New Player' button

        } else {
            // For new player
            console.log("No existing session found.");
            usernameInput.value = ""; // Ensures it's clear
            usernameInput.disabled = false; // Enables input
            newPlayerButton.classList.add("hidden"); // Hides 'New Player' button
        }
    }

    /**
     * Implements the new player functionality.
     * Resets the game session for a new player by clearing the username cookie.
     */
    function newPlayer() {
        // Deletes the username cookie
        setCookie('username', '', -1); 
        // Resets the UI
        checkUsername(); 
        // Fetches new questions for the game
        fetchQuestions();
        console.log("Player info cleared. Starting a new game.");
    }

    /**
     * Calculates the user's score based on their selections in the trivia form.
     * It checks the data-correct attribute on the selected radio button inputs.
     * @returns {number} The final calculated score.
     */
    function calculateScore() {
        let score = 0;
        
        // Selector for inputs of type radio within the trivia form that are currently checked.
        const checkedAnswers = document.querySelectorAll('#trivia-form input[type="radio"]:checked');

        // Collection of checked answers
        checkedAnswers.forEach((input) => {
            if (input.getAttribute('data-correct') === 'true') {
                score++;
            }
        });

        console.log(`Quiz submitted. Total questions answered correctly: ${score}`);
        
        return score;
    }

    /**
     * Implements the score saving function:
     * Stores the current score and username persistently in localStorage.
     */
    function saveScore(username, score) {
        const storedScores = localStorage.getItem('triviaScores');
        let scores = storedScores ? JSON.parse(storedScores) : [];

        const newScoreEntry = {
            username: username,
            score: score,
            date: new Date().toISOString()
        };

        scores.push(newScoreEntry);
        scores.sort((a, b) => b.score - a.score); // Sorts highest score first

        localStorage.setItem('triviaScores', JSON.stringify(scores));
        
        displayScores(); // Refreshes the table
    }

    /**
     * Implements the score display function:
     * Retrieves scores from localStorage and displays them in the score table.
     */
    function displayScores() {
        const scoreTableBody = document.querySelector('#score-table tbody');
        
        scoreTableBody.innerHTML = ''; // Clears existing content

        const storedScores = localStorage.getItem('triviaScores');
        const scores = storedScores ? JSON.parse(storedScores) : [];
        
        const topScores = scores.slice(0, 10); // Displays top 10

        if (topScores.length === 0) {
            scoreTableBody.innerHTML = '<tr><td colspan="2">No scores recorded yet!</td></tr>';
            return;
        }

        topScores.forEach((entry) => {
            const row = scoreTableBody.insertRow();
            row.insertCell().textContent = entry.username;
            row.insertCell().textContent = entry.score;
        });
    }

    /**
     * Implements modal display function:
     * Shows the results in a modal and updates the score text.
     * @param {number} score - The final calculated score.
     */
    function displayResults(score) {
        finalScoreDisplay.textContent = `${score} / 10`;
        resultsModal.classList.remove('hidden');
    }

});

/**
 * Implements the Cookie Storage Function:
 * Sets a cookie with a given name, value, and optional expiration days.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value to store in the cookie.
 * @param {number} [days=7] - The number of days until the cookie expires.
 */
function setCookie(name, value, days = 7) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // Sets the cookie
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

/**
 * Implements the cookie retrieval function:
 * Reads the cookie.
 * @param {string} name - The name of the cookie to read.
 * @returns {string | undefined} The cookie's value, or undefined if the cookie is not found.
 */
function getCookie(name) {
    // Split all cookies into an array of strings
    return document.cookie
        .split("; ")
        // Finds the string that starts with the desired name
        .find((row) => row.startsWith(`${name}=`))
        // If found, splits it by '=' and take the second element
        ?.split("=")[1];
}