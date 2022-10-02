function convertSecondsToMinSecString(secs) { 
    let minutes = parseInt(secs / 60, 10)
    let seconds = parseInt(secs % 60, 10);
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    return minutes + ":" + seconds;
}

let myLocalStorage = {
    set: function (item, value) {
        localStorage.setItem( item, JSON.stringify(value) );
    },
    get: function (item) {
        return JSON.parse( localStorage.getItem(item) );
    }
};


class Countdown {
    constructor(countdown, display, nextCoundownName) {
        this.countdown = countdown; //in seconds
        this.interval = null;
        this.display = display;
        this.nextCoundownName = nextCoundownName;
        this.startTimestamp; //in ms
        this.elapsed = 0; // in ms
    }
    start() {
        let that = this;
        this.startTimestamp = lastTimestamp = performance.now();

        this.interval = setInterval(function() {
            const pNow = performance.now()

            if (curCountdownName=='pomodoro') {
                const diff = pNow - lastTimestamp;
                if (diff > 60000) {
                    totalTime += diff;
                    lastTimestamp = pNow;
                    updateTotalTimeDisplay();
                }
            }

            const sec = (pNow-that.startTimestamp + that.elapsed)/1000;
            that.display.textContent = document.title = convertSecondsToMinSecString(that.countdown - Math.trunc(sec)); 
            document.title += ' ' + curCountdownName;

            if (sec >= that.countdown) {
                curAlarm.play();
                if (isAutoSwitching) {
                    switchCountdown(that.nextCoundownName, false);
                } else {
                    that.reset();
                }
            } 
        }, 250);
    }
    stop() {
        if (this.interval!=null) {
            clearInterval(this.interval);
            this.elapsed += performance.now() - this.startTimestamp;
        }
    }
    reset() { //stop timer and set timer back to full
        this.stop();
        this.elapsed = 0;
        this.display.textContent = convertSecondsToMinSecString(this.countdown); 
        showStart(true);
    }
}

//basic app settings
const pomoOver = new Event('pomoOver');
const shortBreakOver = new Event('shortBreakOver');
const longBreakOver = new Event('longBreakOver');

const timerDisplay = document.getElementById('timer');
const pomoCountdown = new Countdown(10, timerDisplay, 'short-break');
const shortBreakCountdown = new Countdown(10, timerDisplay, 'pomodoro');
const longBreakCountdown = new Countdown(10, timerDisplay, 'pomodoro');
let curCountdownName = 'pomodoro';
timerDisplay.textContent = convertSecondsToMinSecString(pomoCountdown.countdown);
const radioCountdownMap = {'pomodoro': pomoCountdown, 'short-break': shortBreakCountdown, 'long-break': longBreakCountdown};


function showStart(showing) {
    if (showing) {
        document.getElementById('start-btn').style.display = 'inline';
        document.getElementById('stop-btn').style.display = 'none';
    } else {
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('stop-btn').style.display = 'inline';
    }
}

function startCountdown() {
    radioCountdownMap[curCountdownName].start();
    showStart(false);
}
function stopCountdown() {
    radioCountdownMap[curCountdownName].stop();
    showStart(true);
}

let interval = 4;
let curInterval = interval;
function switchCountdown(countdownName, isUserInput) {
    const auto = isAutoSwitching && !isUserInput;
    if (countdownName=='short-break') {
        if (auto) {
            if (--curInterval==0) {
                countdownName = 'long-break';
                curInterval = interval;
            } 
        } else {
            curInterval = interval;
        }
    }

    radioCountdownMap[curCountdownName].reset();
    curCountdownName = countdownName;
    radioCountdownMap[curCountdownName].reset();
    
    if (auto) {
        document.getElementById(curCountdownName).checked = true;
        startCountdown();
        return;
    }
    showStart(true);
}

//give events to radio buttons
document.getElementsByName('session').forEach(radio => {
        radio.addEventListener('click', () => {
            nextName = radio.id;
            if (curCountdownName!=nextName) {
                if (window.confirm("Are you sure you want to switch to a different session and reset the timer?")) {
                    switchCountdown(nextName, true);
                } else {
                    document.getElementById(curCountdownName).checked = true;
                }
            } 
        });
    }
);

//auto switching and starting
let isAutoSwitching = false;

function autoSwitchingCheck() {
    const checkbox = document.getElementById('auto-switching');
    if (checkbox.checked) {
        isAutoSwitching = true;
        console.log("checked");
    } else {
        isAutoSwitching = false;
    }
    myLocalStorage.set('autostart', isAutoSwitching);
}

function addTask() {
    const taskName = prompt("enter task description");
    if (taskName=='' || !taskName) return;
    const btnName = document.createElement('button');
    btnName.textContent = taskName;
    btnName.classList.add('task-default');
    btnName.onclick = function() {
        if (this.classList.contains('task-default')) {
            this.classList.remove('task-default');
            this.classList.add('task-completed');
        } else {
            this.classList.remove('task-completed');
            this.classList.add('task-default');
        }
    };
    const btnDel = document.createElement('button');
    btnDel.textContent = '╳';
    
    btnDel.onclick = function() {
        this.parentElement.remove();
    }
    const li = document.createElement('li');
    li.appendChild(btnName);
    li.appendChild(btnDel);
    
    document.getElementById('task-list').appendChild(li);
}

function hideOrShowById(id) {
    const elem = document.getElementById(id);
    if (elem.style.display=='none') {
        elem.style.display = 'block';
    } else {
        elem.style.display = 'none';
    }
}


function saveSettings() {
    let countdownString = document.getElementById('pomo-time').value;
    if (countdownString.length>0) {
        pomoCountdown.countdown = parseInt(countdownString)*60;
        myLocalStorage.set('pomodoro', pomoCountdown.countdown);
    }
    countdownString = document.getElementById('short-break-time').value;
    if (countdownString.length>0) {
        shortBreakCountdown.countdown = parseInt(countdownString)*60;
        myLocalStorage.set('shortBreak', shortBreakCountdown.countdown);
    }
    countdownString = document.getElementById('long-break-time').value;
    if (countdownString.length>0) {
        longBreakCountdown.countdown = parseInt(countdownString)*60;
        myLocalStorage.set('longBreak', longBreakCountdown.countdown);
    }
    if (radioCountdownMap[curCountdownName].interval==null) {
        radioCountdownMap[curCountdownName].reset();
    }
    const newInterval = document.getElementById('interval').value;
    if (newInterval.length>0) {
        interval = parseInt(newInterval);
        myLocalStorage.set('interval', interval);
    }
    hideOrShowById('left');
}


function changeAlarmAndPlay(filePath) {
    if (filePath.length>0) {
        curAlarm = new Audio(filePath);
        curAlarm.play();
        myLocalStorage.set("alarmString", filePath);
    }
}

let savedSoundFile = null;
function changeAlarm() { //change alarm from user input
    elem = document.getElementById('alarm-sound');
    curAlarm.pause();
    const val = elem.options[elem.selectedIndex].value;
    if (val!='upload') {
        const path = "assets/" + val;
        changeAlarmAndPlay(path);
    } else {
        hideOrShowById('file-upload');
    }
}



let curAlarm = new Audio('assets/clock.wav');
curAlarm.volume = 0.5;
document.getElementById('alarm-volume-slider').oninput = function() {
    curAlarm.volume = this.value / 100;
    curAlarm.play();
    myLocalStorage.set('volume', parseInt(this.value));
}


//total time tracker
let lastTimestamp;
let totalTime = 0; //in the unit of performance.now()
function updateTotalTimeDisplay() {
    const totalMinutes = Math.trunc(totalTime/60000);
    const minutes = totalMinutes % 60;
    const totalHours = Math.trunc((totalMinutes - minutes)/60);
    const hours = totalHours % 24;
    const days = Math.trunc((totalHours-hours)/24);

    document.getElementById('mins').textContent = minutes + ' minutes ';
    if (totalMinutes >= 60) {
        let t = document.getElementById('hrs');
        t.style.display = 'inline';
        t.textContent = hours + ' hours ';
        if (totalMinutes >= 1440) {
            t = document.getElementById('days');
            t.style.display = 'inline';
            t.textContent = days + ' days ';
        }
    }
    myLocalStorage.set('totalTime', totalTime);
}

function loadSettings() {
    if (localStorage.getItem('autostart')) {
        isAutoSwitching = myLocalStorage.get('autostart');
        document.getElementById('auto-switching').checked = isAutoSwitching;
    }
    // if (localStorage.getItem('pomodoro')) {
    //     pomoCountdown.countdown = myLocalStorage.get('pomodoro');
    //     document.getElementById('pomo-time').value = parseInt(pomoCountdown.countdown/60);
    //     timerDisplay.textContent = convertSecondsToMinSecString(pomoCountdown.countdown);
    // }
    // if (localStorage.getItem('shortBreak')) {
    //     shortBreakCountdown.countdown =  myLocalStorage.get('shortBreak');
    //     document.getElementById('short-break-time').value = parseInt(shortBreakCountdown.countdown/60);
    // }
    // if (localStorage.getItem('longBreak')) {
    //     longBreakCountdown.countdown = myLocalStorage.get('longBreak');
    //     document.getElementById('long-break-time').value = parseInt(longBreakCountdown.countdown/60);
    // }
    if (localStorage.getItem('interval')) {
        interval = document.getElementById('interval').value = myLocalStorage.get('interval');
    } 
    if (localStorage.getItem('volume')) {
        const vol = myLocalStorage.get('volume');
        curAlarm.volume = vol / 100.0;
        document.getElementById('alarm-volume-slider').value = vol;
    } 
    if (localStorage.getItem('totalTime')!='') {
        totalTime = myLocalStorage.get('totalTime');
        updateTotalTimeDisplay();
    }
    if (localStorage.getItem('alarmString')!='') {
        const soundPath = myLocalStorage.get('alarmString');
        if (soundPath!=null) {
            document.getElementById('alarm-sound').value = soundPath.slice(7);
            curAlarm = new Audio(soundPath);
        }
    }
}

loadSettings();

function clearStorage() {
    localStorage.clear();
}

clearStorage();
