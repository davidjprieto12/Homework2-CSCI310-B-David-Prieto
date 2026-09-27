import { FOUR_LETTER_WORDS } from "./fourLetterWords.js"
import { FIVE_LETTER_WORDS } from "./fiveLetterWords.js"
import { SIX_LETTER_WORDS } from "./sixLetterWords.js"

// Initialize global constants and variables
const NUMBER_OF_GUESSES = 6;

// Buttons (used for event listeners -> functions)
const timerButton = document.getElementById("timer-button");
const easyButton = document.getElementById("easy-button");
const normalButton = document.getElementById("normal-button");
const hardButton = document.getElementById("hard-button");

// Timer variables (include in resetTimer())
let timerOn = false;
let timeRemaining = 60;
let timerId = null;

// This code is repeated in the resetBoard() function
// Here, global variables are initialized and set
// In resetBoard(), these variables are reset without being redeclared
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let currentWordList = FIVE_LETTER_WORDS;
let rightGuessString = currentWordList[Math.floor(Math.random() * currentWordList.length)];
console.log(rightGuessString);

// Animation constant
const animateCSS = (element, animation, prefix = 'animate__') =>
    // Create a Promise and return it
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        // const node = document.querySelector(element);
        const node = element
        node.style.setProperty('--animate-duration', '0.3s');

        node.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        node.addEventListener('animationend', handleAnimationEnd, {once: true});
    })

// Key and on-screen keyboard listeners
document.addEventListener("keyup", (e) => {

    if (guessesRemaining === 0) {
        return
    }

    let pressedKey = String(e.key)
    if (pressedKey === "Backspace" && nextLetter != 0) {
        deleteLetter()
        return
    }

    if (pressedKey === "Enter") {
        checkGuess()
        return
    }

    let found = pressedKey.match(/[a-z]/gi)
    if (!found || found.length > 1) {
        return
    } else {
        insertLetter(pressedKey)
    }
})

document.getElementById("keyboard-cont").addEventListener("click", (e) => {
    const target = e.target

    if (!target.classList.contains("keyboard-button")) {
        return
    }
    let key = target.textContent

    if (key === "Del") {
        key = "Backspace"
    }

    document.dispatchEvent(new KeyboardEvent("keyup", {'key': key}))
})

// Timer button event listener
timerButton.addEventListener("click", () => {
    startTimer();
})

// Difficulty button event listeners & method calls (each call resetBoard but pass different lists)
easyButton.addEventListener("click", () => {
    resetBoard(FOUR_LETTER_WORDS);
})
normalButton.addEventListener("click", () => {
    resetBoard(FIVE_LETTER_WORDS);
})
hardButton.addEventListener("click", () => {
    resetBoard(SIX_LETTER_WORDS);
})

// This is to counteract a bug where pressing a button keeps it highlighted, so hitting "enter" would call the button again
document.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("mousedown", (e) => e.preventDefault());
});

function initBoard() {
    let board = document.getElementById("game-board");
    board.replaceChildren();

    for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
        let row = document.createElement("div")
        row.className = "letter-row"

        for (let j = 0; j < currentWordList[0].length; j++) {
            let box = document.createElement("div")
            box.className = "letter-box"
            row.appendChild(box)
        }
        board.appendChild(row)
    }
    
}

// Resets the originally defined variables to reset the game (for difficulty buttons / restart functionality)
function resetBoard(wordList) {
    guessesRemaining = NUMBER_OF_GUESSES;
    currentGuess = [];
    nextLetter = 0;
    currentWordList = wordList;
    rightGuessString = currentWordList[Math.floor(Math.random() * currentWordList.length)];
    console.log(rightGuessString);

    resetKeyboard();
    resetTimer();
    initBoard();
}

function insertLetter (pressedKey) {
    if (nextLetter === currentWordList[0].length) {
        return
    }
    pressedKey = pressedKey.toLowerCase()

    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let box = row.children[nextLetter]
    animateCSS(box, "pulse")
    box.textContent = pressedKey
    box.classList.add("filled-box")
    currentGuess.push(pressedKey)
    nextLetter += 1
}

function deleteLetter () {
    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let box = row.children[nextLetter - 1]
    box.textContent = ""
    box.classList.remove("filled-box")
    currentGuess.pop()
    nextLetter -= 1
}

function checkGuess () {
    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let guessString = ''
    let rightGuess = Array.from(rightGuessString)

    for (const val of currentGuess) {
        guessString += val
    }

    if (guessString.length != currentWordList[0].length) {
        toastr.error("Not enough letters!")
        return
    }

    if (!currentWordList.includes(guessString)) {
        toastr.error("Word not in list!")
        return
    }

    for (let i = 0; i < currentWordList[0].length; i++) {
        let letterColor = ''
        let box = row.children[i]
        let letter = currentGuess[i]

        let letterPosition = rightGuess.indexOf(currentGuess[i])
        // is letter in the correct guess
        if (letterPosition === -1) {
            letterColor = 'grey'
        } else {
            // at this point, letter is definitely in word
            // if letter index && right guess index are same,
            // letter is in the right position
            if (currentGuess[i] === rightGuess[i]) {
                // shade green
                letterColor = 'green'

                if (timerOn) {
                    timeRemaining += 5;
                }
            } else {
                // shade yellow
                letterColor = 'yellow'

                if (timerOn) {
                    timeRemaining += 3;
                }
            }

            rightGuess[letterPosition] = "#"
        }

        let delay = 250 * i
        setTimeout(() => {
            // flip box
            animateCSS(box, 'flipInX')

            // shade box
            box.style.backgroundColor = letterColor
            shadeKeyBoard(letter, letterColor)
        }, delay)
    }

    if (guessString === rightGuessString) {
        toastr.success("You guessed right! Game over!")
        toastr.info("To start a new game, pick a difficulty setting")
        guessesRemaining = 0
        return
    } else {
        guessesRemaining -= 1;
        currentGuess = [];
        nextLetter = 0;

        if (guessesRemaining === 0) {
            toastr.error("You've run out of guesses! Game over!")
            toastr.info(`The right word was: "${rightGuessString}"`)
            toastr.info("To start a new game, pick a difficulty setting")
        }
    }
}

function shadeKeyBoard(letter, color) {
    for (const elem of document.getElementsByClassName("keyboard-button")) {
        if (elem.textContent === letter) {
            let oldColor = elem.style.backgroundColor
            if (oldColor === 'green') {
                return
            }

            if (oldColor === 'yellow' && color !== 'green') {
                return
            }

            elem.style.backgroundColor = color
            break
        }
    }
}

// Resets the keyboard shading upon starting a new game
function resetKeyboard() {
    for (const elem of document.getElementsByClassName("keyboard-button")) {
        elem.style.backgroundColor = ""
    }
}

function startTimer() {
    // Only begin the timer if a timer doesn't exist and if the game is ongoing
    if (!timerOn && guessesRemaining != 0) {

        console.log("Timer started!");
        timerOn = true;

        // Every second:
        timerId = setInterval(() => {
            // If the game has already ended, end the timer
            if (guessesRemaining == 0) {
                timerOn = false;
                clearInterval(timerId);
            }

            // If the game has not ended yet:
            // If there is still time left, display and decrement
            if (timeRemaining > 0) {
                timerButton.textContent = `Time Left: ${timeRemaining} s`;
                timeRemaining--;
            }
            // If time is out, display time is up and end the timer and guesses
            else {
                timerButton.textContent = "Time is Up!";
                toastr.error("Game over! To restart, pick a difficulty setting")
                timerOn = false;
                guessesRemaining = 0;
                clearInterval(timerId); 
            }
        }, 1000);
    }
}

// Resets the timer variables and clears the preexisting timer upon making a new board
function resetTimer() {
    if (timerId) {
        clearInterval(timerId);
    }

    timerOn = false;
    timeRemaining = 60;
    timerButton.textContent = "Timed Mode";
}

initBoard()