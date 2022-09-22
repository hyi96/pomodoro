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
    constructor(countdown, display, nextCoundownName, cycleLength=1) {
        this.countdown = countdown; //in seconds
        this.timer = countdown;
        this.interval = null;
        this.display = display;
        this.nextCoundownName = nextCoundownName;
        this.cycleLength = cycleLength;
        this.curCycle = cycleLength;
    }
    start() {
        if (--this.curCycle==0) {
            this.curCycle = this.cycleLength;
            console.log('start function entered');
            this.timer -= 1;
            let that = this;
            this.interval = setInterval(function() {
                that.display.textContent = convertSecondsToMinSecString(that.timer); 
                if (curCountdownName=='pomodoro') {
                    updateTotalTime();
                }
                if (--that.timer < 0) {
                    curAlarm.play();
                    if (isAutoSwitching) {
                        switchCountdown(that.nextCoundownName, false);
                    } else {
                        that.reset();
                    }
                } 
            }, 1000);
        } else {
            if (isAutoSwitching) {
                switchCountdown(this.nextCoundownName, false);
            } else {
                this.reset();
                this.curCycle = this.cycleLength;
            }
        }
    }
    stop() {
        if (this.interval!=null) clearInterval(this.interval);
    }
    reset() { //stop timer and set timer back to full
        this.stop();
        this.timer = this.countdown;
        this.display.textContent = convertSecondsToMinSecString(this.timer); 
        showStart(true);
    }
}

//basic app settings
const pomoOver = new Event('pomoOver');
const shortBreakOver = new Event('shortBreakOver');
const longBreakOver = new Event('longBreakOver');

const timerDisplay = document.getElementById('timer');
const pomoCountdown = new Countdown(1500, timerDisplay, 'short-break');
const shortBreakCountdown = new Countdown(300, timerDisplay, 'long-break');
const longBreakCountdown = new Countdown(900, timerDisplay, 'pomodoro', 4);
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

function switchCountdown(countdownName, isUserInput) {
    radioCountdownMap[curCountdownName].reset();
    curCountdownName = countdownName;
    radioCountdownMap[curCountdownName].reset();
    
    if (isAutoSwitching && !isUserInput) {
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
    const newInterval = document.getElementById('interval');
    if (newInterval.length>0) {
        longBreakCountdown.cycleLength = parseInt(countdownString);
        myLocalStorage.set('interval', longBreakCountdown.cycleLength);
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
let seconds = 0;
let minutes = 59;
let hours = 0;
let days = 0

function updateTotalTime() {
    if (++seconds==60) {
        seconds = 0;
        if (++minutes==60) {
            minutes = 0;
            const hourElem = document.getElementById('hrs');
            hourElem.style.display = "inline";
            if (++hours==24) {
                hours = 0;
                const dayElem = document.getElementById('days');
                dayElem.style.display = "inline";
                if (++days==365) {
                    days = 0;
                }
                dayElem.textContent = days + " days";
            }
            hourElem.textContent = hours + " hours";
        } 
        document.getElementById('mins').textContent = minutes + " minutes";
    }
}



function loadSettings() {
    if (localStorage.getItem('autostart')) {
        isAutoSwitching = myLocalStorage.get('autostart');
        document.getElementById('auto-switching').checked = isAutoSwitching;
    }
    if (localStorage.getItem('pomodoro')) {
        pomoCountdown.countdown = myLocalStorage.get('pomodoro');
        document.getElementById('pomo-time').value = parseInt(pomoCountdown.countdown/60);
    }
    if (localStorage.getItem('shortBreak')) {
        shortBreakCountdown.countdown =  myLocalStorage.get('shortBreak');
        document.getElementById('short-break-time').value = parseInt(shortBreakCountdown.countdown/60);
    }
    if (localStorage.getItem('longBreak')) {
        longBreakCountdown.countdown = myLocalStorage.get('longBreak');
        document.getElementById('long-break-time').value = parseInt(longBreakCountdown.countdown/60);
    }
    if (localStorage.getItem('interval')) {
        longBreakCountdown.cycleLength = document.getElementById('interval').value = myLocalStorage.get('interval');
    } 
    if (localStorage.getItem('volume')) {
        const vol = myLocalStorage.get('volume');
        curAlarm.volume = vol / 100.0;
        document.getElementById('alarm-volume-slider').value = vol;
    } 
    if (localStorage.getItem('alarmString')!='') {
        const soundPath = myLocalStorage.get('alarmString');
        document.getElementById('alarm-sound').value = soundPath.slice(7);
        curAlarm = new Audio(soundPath);
    }
}

loadSettings();
