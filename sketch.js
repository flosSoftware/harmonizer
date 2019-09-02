/*  
    Copyright (C) 2019 Alberto Fiore

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/** DOM stuff */

let progrWin, activeProgrEl = null, lastActiveProgrEl = null, lastActiveProgrIdx = -1;

// responsive stuff

let isXSm = false, isSm = false, isMd = false, isLg = false, isXLg = false, isXXLg = false;

if (window.innerWidth >= 1450)
  isXXLg = true; // 5 octave keyboard
else if (window.innerWidth >= 1200)
  isXLg = true; // 4 octave keyboard
else if (window.innerWidth >= 992)
  isLg = true; // 3 octave keyboard
else if (window.innerWidth >= 768)
  isMd = true; // 2 octave keyboard
else if (window.innerWidth >= 576)
  isSm = true; // 1 octave keyboard
else
  isXSm = true; // 1 octave keyboard

let playedKeyEl = null, playedKeyEl2 = null, playedKeyEl3 = null, playedKeyEl4 = null;

let noteTxt = document.getElementById("note");
let keyTxt = document.getElementById("key");

/** CONFIGS */

let attackLevel = 0.25;
let releaseLevel = 0;

let attackTime = 0.001;
let decayTime = 0.5;
var susPercent = 0.;
let releaseTime = 0.;

let env, env2, env3, env4, envF;
let osc, osc2, osc3, osc4;
let freq = 220, freq2 = 220, freq3 = 220, freq4 = 220;

let filter, filterFreq = parseInt(document.getElementById("filterFreq").value, 10), filterRes = 2;

let synthOn = document.getElementById("synthOn").checked, drumsOn = document.getElementById("drumsOn").checked, seventhOn = document.getElementById("seventhOn").checked, beatOn = document.getElementById("beatOn").checked, inversionOn = document.getElementById("inversionOn").checked;


/* DRUM STUFF **/
let beatSound, bdSound, hhSound, hh2Sound, snrSound;
let bdPat, hhPat, hh2Pat, snrPat;
let bdIdx, hhIdx, hh2Idx, snrIdx;
let patSize;
let mult3, mult7, mult6, mult5, mult4;

/* 
CIRCLE OF FIFTHS
In the maj/min CoF, you can use the dominant V chord as pivot, because it is the I chord of the next key
To modulate from maj key to its relative minor, this program uses ii - iv correspondence or iii - i correspondence
To modulate form min key to its relative major, this program uses I - vi correspondence or VI - I correspondence
*/
let majCircle = [60, 67, 62, 69, 64, 71, 66, 61, 68, 63, 70, 65]; // start from C4
let minCircle = [69, 64, 71, 66, 61, 68, 63, 70, 65, 60, 67, 62];  // start from A4

let minInterval = [2, 1, 2, 2, 1, 2, 2]; // intervals to build a scale, don't touch!
let majInterval = [2, 2, 1, 2, 2, 2, 1]; // intervals to build a scale, don't touch!

// shifts corresponds to kind of chords
let shiftMaj = [0, 4, 7, 11];
let shiftMin = [0, 3, 7, 10];
let shiftDim = [0, 3, 6, 9];
let shiftDom = [0, 4, 7, 10];
let shiftSharpDim = [1, 4, 7, 10];
// altered chords
let shiftMinFlat5 = [0, 3, 6, 10];

// shift array is used to build chords
let shift = [shiftMaj, shiftMin, shiftDim, shiftDom, shiftSharpDim, shiftMinFlat5];

// activeKey/minKey/majKey contain indexes of shift array (to build chords)

let minKey = [1, 2, 0, 1, 0, 0, 2]; // 0 -> maj, 1 -> min, 2 -> dim, 3 -> dom chord -> i ii° III iv V VI vii°
let majKey = [0, 1, 1, 0, 0, 1, 2]; // 0 -> maj, 1 -> min, 2 -> dim, 3 -> dom chord -> I ii iii IV V vi vii°

let activeKey, activeProgr, activeShift;

// Some common chord progression:
// - progr property: references indexes of activeKey (which refers to either minKey or majKey)
// - varMaj/varMin are overrides of the progr property: they refer to indexes of shift array:
//    - varMaj is used only in major keys
//    - varMin is used only in minor keys
let progr = [
  // JAZZ
  { progr: [1, 4, 0, 0], varMaj: [1, 3, 0, 0], varMin: [5, 3, 1, 1], enabled: true },
  { progr: [0, 0, 1, 1, 2, 5], varMaj: [0, 4, 1, 4, 1, 3], enabled: true },
  { progr: [0, 5, 1, 4, 2, 5, 1, 4], varMaj: [0, 1, 1, 3, 1, 3, 1, 3], enabled: true },
  { progr: [0, 1, 4, 3], varMaj: [0, 1, 3, 0], enabled: true },
  { progr: [0, 0, 3, 3, 2, 5, 1, 4, 0, 0], varMaj: [0, 3, 0, 1, 1, 3, 1, 3, 0, 0], enabled: true },
  { progr: [0, 0, 1, 4], varMaj: [0, 0, 1, 3], enabled: true },
  { progr: [0, 0, 1, 1, 1, 4, 0, 0], varMaj: [0, 0, 3, 3, 1, 3, 0, 0], enabled: true },
  { progr: [2, 5, 1, 4], varMaj: [3, 3, 3, 3], enabled: true },

  // OTHER (no varMaj/varMin means to use shifts of the active key)
  { progr: [0, 3, 5], enabled: true },
  { progr: [0, 4, 5, 3], enabled: true },
  { progr: [0, 3, 0, 4, 0], enabled: true },
  { progr: [2, 5, 1, 4], enabled: true },
  { progr: [0, 3, 6, 2, 5, 1, 4, 0], enabled: true },
  { progr: [0, 3, 4, 0], enabled: true }
];

let progrIdx = 0;

let enabledProgr = [];
let progr0 = []; // Indexes of progr that start with 0 (I/i chord)
let progr3 = []; // Indexes of progr that have 3 (IV/iv chord) as second chord
let progr5 = []; // Indexes of progr that have 5 (vi/VI chord) as second chord

/** 
 
 TIME SIGNATURE:
 
 - bottom number: beat -> what note is a beat (1 ... 1/16)
 - top number: measure/bar (= + beat) -> how many beats are in a bar
 
 **/

let tsT = parseInt(document.getElementById("ts-top").value, 10), tsB = parseInt(document.getElementById("ts-bottom").value, 10);

let bpm = parseInt(document.getElementById("bpm").value, 10);

let minuteMs = 60000;

let beatMs, barMs, sixteenthMs;

/** SEQUENCER STUFF */

let tds; // elements of sequencer
let seqIdx; // index of active sequencer element

let sixteenthWidth; // width of a square representing a 1/16 note in the sequencer
let tonic = stringToMidi("A3");

// midi notes of the current scale
let midiSequence = [];

// how many notes are in a scale
let numNotes = 7;

let noteIdx = 0, noteIdx2 = 0, progrNoteIdx = 0;

let midiNote;  // current playing note

let durL2 = []; // duration of notes generated in a bar

// this random number generator creates numbers according to the probabilities given,
// it is used to choose a note index that corresponds to a chord inversion
let drngInv;
const NO_INV = 1, INV = 0;
let probNoInv = 1, probInv = 0;

let drngInv2;
const NO_INV2 = 1, INV2 = 0;
let probNoInv2 = 1, probInv2 = 0;


/** MODULATION MODES */
let MOD_MODE_MIN_NO_MOD = 0, MOD_MODE_MAJ_NO_MOD = 1, MOD_MODE_ONLY_MIN = 2, MOD_MODE_ONLY_MAJ = 3, MOD_MODE_MAJ_MIN = 4, MOD_MODE_MAJ_MIN_HARD = 5;
let modMode = MOD_MODE_MAJ_MIN;

// this random number gen creates number according to the probabilities associated to 3 events: 
// - no modulation, 
// - modulation to the relative min/maj key
// - modulation to the next key in the same circle (min/maj), 
let drngMod;
const NO_MOD = 0, MOD_REL = 1, MOD_NEXT = 2;
// predefined set of probs: 
// index correspond to one of the modulation modes in the order they're defined
let modProbs = [{
  probNoMod: 1, probModRel: 0, probModNext: 1
},
{
  probNoMod: 1, probModRel: 0, probModNext: 1
},
{
  probNoMod: 1 / 2., probModRel: 0, probModNext: 1 / 2.
},
{
  probNoMod: 1 / 2., probModRel: 0, probModNext: 1 / 2.
},
{
  probNoMod: 1 / 2., probModRel: 1 / 6., probModNext: 2 / 6.
},
{
  probNoMod: 1 / 3., probModRel: 1 / 3., probModNext: 1 / 3.
}
];

// this random number generator creates numbers according to the probabilities associated to 3 events: 
// - no progression change, 
// - change progression 
let drngChgProg;
const NO_CHG_PROG = 1, CHG_PROG = 0;
let probNoChgProg = 1, probChgProg = 0;

let cancel = false, cancel2 = false, cancel3 = false, cancel4 = false, cancel5 = false, cancel6 = false, cancel7 = false, cancel8 = false; // vars to stop timers
let isPlaying = false;
/* 
REGARDING TIMERS IN JS:
*usually*, in this application consecutive timer calls are delayed more than 4ms, so there should be no problem here
ref. https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Reasons_for_delays_longer_than_specified 
*/
let timerDelayCompensationMs = 20, timerDelayCompensationMs2 = 2;

// minToMaj/majToMin => arrays to associate: 
// - scale index of pivot chord in the starting key
// - array from where to get a new progression
// - index of next chord in the new progression
// - progr5 is where are stored progression with chord nr. 5 (which is vi/VI) as the second chord (index 1) of the progression
// - progr3 is where are stored progression with chord nr. 3 (which is IV/iv) as the second chord (index 1) of the progression
let minToMaj = [
  { "startKeyIdx": 0, "progrArr": progr5, "nuProgrNoteIdx": 1 },
  { "startKeyIdx": 5, "progrArr": progr0, "nuProgrNoteIdx": 0 }];
let majToMin = [
  { "startKeyIdx": 1, "progrArr": progr3, "nuProgrNoteIdx": 1 },
  { "startKeyIdx": 2, "progrArr": progr0, "nuProgrNoteIdx": 0 }];


/* PERFORMANCE MONITORING (for debugging) */
let monitoring = false;


function openProgWindow() {
  progrWin = window.open("progressions.html", "_blank", 'toolbar=0,location=0,menubar=0');

  progrWin.onload = function () {
    updateProgressionList();
  };

}

function preload() {
  soundFormats('wav');
  beatSound = loadSound('assets/beat.wav');
  bdSound = loadSound('assets/bd.wav');
  hhSound = loadSound('assets/hh.wav');
  hh2Sound = loadSound('assets/hh2.wav');
  snrSound = loadSound('assets/snr.wav');
}

function setup() {

  document.getElementById("cursor-holder").style.display = "none";
  cnv = createCanvas(100, 20);
  cnv.parent('cursor-holder');

  createKeyboard();

  document.addEventListener('keypress', function (e) {
    if (e.code === "Space") {
      e.preventDefault();
      if (isPlaying) {
        cancel = true, cancel2 = true, cancel3 = true, cancel4 = true, cancel5 = true, cancel6 = true, cancel7 = true, cancel8 = true;
        isPlaying = false;
      } else {
        play();
      }
    }

  });


  $('#synthOn').on('change', function (e) {
    synthOn = e.target.checked;
  });

  $('#drumsOn').on('change', function (e) {
    drumsOn = e.target.checked;
  });

  $('#beatOn').on('change', function (e) {
    beatOn = e.target.checked;
  });

  $('#inversionOn').on('change', function (e) {
    inversionOn = e.target.checked;
  });

  $('#seventhOn').on('change', function (e) {
    seventhOn = e.target.checked;
  });

  $('#filterFreq').on('change', function (e) {
    filterFreq = parseInt(document.getElementById("filterFreq").value, 10);
    envF.setRange(filterFreq, 10);
  });

  env = new p5.Envelope();
  env.setADSR(attackTime, decayTime, susPercent, releaseTime);
  env.setRange(attackLevel, releaseLevel);

  env2 = new p5.Envelope();
  env2.setADSR(attackTime, decayTime, susPercent, releaseTime);
  env2.setRange(attackLevel, releaseLevel);

  env3 = new p5.Envelope();
  env3.setADSR(attackTime, decayTime, susPercent, releaseTime);
  env3.setRange(attackLevel, releaseLevel);

  env4 = new p5.Envelope();
  env4.setADSR(attackTime, decayTime, susPercent, releaseTime);
  env4.setRange(attackLevel, releaseLevel);

  osc = new p5.SawOsc();
  osc.amp(env);
  osc.start();
  osc.freq(freq);

  osc2 = new p5.SawOsc();
  osc2.amp(env2);
  osc2.start();
  osc2.freq(freq2);

  osc3 = new p5.SawOsc();
  osc3.amp(env3);
  osc3.start();
  osc3.freq(freq3);

  osc4 = new p5.SawOsc();
  osc4.amp(env4);
  osc4.start();
  osc4.freq(freq4);

  envF = new p5.Envelope();
  envF.setADSR(0.05, 0.75, 0.2, 0);
  envF.setRange(filterFreq, 10);

  filter = new p5.LowPass();
  filter.freq(envF);
  filter.res(filterRes);

  // Disconnect env from master output.
  // Then, connect it to the filter, so that we only hear the filtered sound
  osc.disconnect();
  osc.connect(filter);

  osc2.disconnect();
  osc2.connect(filter);

  osc3.disconnect();
  osc3.connect(filter);

  osc4.disconnect();
  osc4.connect(filter);

  reverb = new p5.Reverb();

  // connect soundFile to reverb, process w/
  // 4 second reverbTime, decayRate of 18%
  reverb.process(filter, 4, 18);

  // setup chord progr
  setupChordProgr();
}

function setupChordProgr() {
  enabledProgr = [], progr0 = [], progr3 = [], progr5 = [];
  for (let i = 0; i < progr.length; i++) {
    if (!progr[i].enabled)
      continue;
    enabledProgr.push(i);
    if (progr[i]["progr"][0] == 0) {
      progr0.push(i);
    }
    if (progr[i]["progr"][1] == 3) {
      progr3.push(i);
    }
    if (progr[i]["progr"][1] == 5) {
      progr5.push(i);
    }
  }
}

function switchProgr(index) {
  let wasEnabled = progr[index].enabled;
  progr[index].enabled = !progr[index].enabled;
  // setup chord progr
  setupChordProgr();
  let el = progrWin.document.getElementById("progList");
  let nuClass = wasEnabled ? "btn-danger" : "btn-success";
  let b = el.children[index].getElementsByTagName("button")[0];
  if (wasEnabled)
    b.classList.remove("btn-success");
  else
    b.classList.remove("btn-danger");
  b.classList.add(nuClass);
}

function updateProgressionList() {
  lastActiveProgrEl = null;
  activeProgrEl = null;
  lastActiveProgrIdx = -1;
  let el = progrWin.document.getElementById("progList");
  while (el.firstChild) el.removeChild(el.firstChild);
  let progrCnt = 0;
  for (let p of progr) {
    let table = '<table class="table table-sm table-borderless">' +
      '<tr class="table-success">';
    for (let noteIdx of p.progr) {
      table += '<td class="text-center">' + toRomanIndex(noteIdx) + "</td>";
    }
    table += '<td class="text-center"><button class="btn btn-' + (p.enabled ? "success" : "danger") + '" onclick="opener.switchProgr(' + progrCnt + ')">On/Off</button></td>';
    table += '</tr>' +
      '</table>';
    el.insertAdjacentHTML("beforeend", '<tr><td>' + table + "</td></tr>");
    progrCnt++;
  }
}

function updateProgressionViz() {
  lastActiveProgrEl = activeProgrEl;
  let el = progrWin.document.getElementById("progList");
  activeProgrEl = el.getElementsByTagName("table")[progrIdx];
  //console.log(activeProgrEl);
  if (lastActiveProgrEl === null)
    lastActiveProgrEl = activeProgrEl;
}

function showActiveProgrIdx(idx) {
  if (activeProgrEl !== null) {
    let el = activeProgrEl.getElementsByTagName("tr")[0];
    //console.log(el.children[idx])
    if (lastActiveProgrIdx >= 0)
      if (lastActiveProgrEl.getElementsByClassName("activeProgr").length > 0)
        lastActiveProgrEl.getElementsByTagName("tr")[0].children[lastActiveProgrIdx].classList.remove("activeProgr");
      else
        el.children[lastActiveProgrIdx].classList.remove("activeProgr");
    el.children[idx].classList.add("activeProgr");
    lastActiveProgrIdx = idx;
  }
}

function play() {
  // console.log(cancel);
  // console.log(cancel2);
  // console.log(cancel3);
  // console.log(isPlaying);

  if (isPlaying)
    cancel = true, cancel2 = true, cancel3 = true, cancel4 = true, cancel5 = true, cancel6 = true, cancel7 = true, cancel8 = true;
  else
    isPlaying = true;

  beatMs = minuteMs / bpm;

  progrIdx = enabledProgr[parseInt(random() * enabledProgr.length, 10)];

  // console.log(progrIdx);

  activeProgr = progr[progrIdx]['progr'];

  modMode = parseInt(document.getElementById("modMode").value, 10);
  // console.log(modMode);

  let minOn = (modMode == MOD_MODE_ONLY_MIN || modMode == MOD_MODE_MIN_NO_MOD);

  activeKey = minOn ? minKey : majKey;

  if (typeof progrWin != "undefined") {
    updateProgressionList();
    updateProgressionViz();
  }

  if (typeof this.id !== "undefined") tonic = parseInt(this.id.substring(1), 10);

  keyTxt.textContent = "Key: " + midiToString(tonic, false) + " " + (activeKey == minKey ? "min" : "maj");

  midiSequence = [];

  //console.log(beatMs);
  //console.log(tonic);

  let note = tonic;
  for (let i = 0; i < numNotes; i++) {
    midiSequence.push(note);
    note += minOn ? minInterval[i] : majInterval[i];
  }

  /**
   
   Create a list with possible note durations
   
   Ex. time signature 3/2 -> 1 half note = 1 beat, 3 beat/bar, 1 full note = 2 beat
   Algorithm: 
   -  start with duration indicated by time signature denominator -> ex. 3/2 -> start duration = ½, which corresponds to 1 beat
   -  if beat/bar > 1 (ex. 3/2) -> multiply duration and number of beats by 2 while they're < time signature beat/bar and duration < 1 (ex. ½ * 2 = 1 -> 2 beat)
   -  divide start duration and number of beats by 2 while they're > 1/16
   
   **/
  tsT = parseInt(document.getElementById("ts-top").value, 10);
  tsB = parseInt(document.getElementById("ts-bottom").value, 10);
  bpm = parseInt(document.getElementById("bpm").value, 10);

  let dur = 1. / tsB;
  let beatN = 1;

  let durL = [];

  while (beatN < tsT && dur < 1) {
    durL.push(Math.round(beatMs));
    dur *= 2;
    beatMs *= 2;
    beatN *= 2;
  }

  beatMs = minuteMs / bpm;
  dur = 1. / tsB;
  beatN = 1;
  // 0.0625 = 1/16
  while (dur > 0.0625) {
    dur /= 2;
    beatMs /= 2;
    beatN /= 2;
    durL.unshift(Math.round(beatMs));
  }

  //console.log(durL);

  beatMs = Math.round(minuteMs / bpm);

  if (monitoring)
    console.log("beatMs " + beatMs);

  barMs = Math.round(beatMs * tsT);

  // randomly choose between durations to fill a bar

  let r = 0;

  let totDur = 0;

  durL2 = [];

  while (totDur < barMs) {
    r = parseInt(random(durL.length), 10);
    totDur += durL[r];
    durL2.push(durL[r]);
  }

  if (totDur > barMs) {
    totDur -= durL[r];
    durL2.splice(durL2.length - 1, 1);
  }

  if (monitoring)
    console.log("durL2 " + durL2);

  /** SEQUENCER */

  patSize = (16 / tsB) * tsT;

  if (monitoring)
    console.log("patSize " + patSize);

  sixteenthMs = Math.round(barMs / patSize);

  if (monitoring) {
    console.log("barMs " + barMs);
    console.log("sixteenthMs " + sixteenthMs);
  }

  let seq = document.getElementById("sequencer");

  while (seq.firstChild) {
    seq.removeChild(seq.firstChild);
  }

  for (let i = 0; i < patSize; i++) {
    seq.insertAdjacentHTML("beforeend", "<td></td>");
  }

  tds = seq.getElementsByTagName('td');
  let k = 0;
  for (let i = 0; i < durL2.length; i++) {
    let numOfSixteenths = Math.round(durL2[i] / sixteenthMs);
    // console.log(durL2[i] + " " + numOfSixteenths)
    let r = Math.round(random(255));
    let g = Math.round(random(255));
    let b = Math.round(random(255));
    for (let j = 0; j < numOfSixteenths; j++) {
      tds[k++].setAttribute("style", "background-color:rgb(" + r + "," + g + "," + b + ")");
    }
  }

  resizeCanvas(seq.getBoundingClientRect().width, 20);

  document.getElementById("cursor-holder").style.display = "block";

  sixteenthWidth = Math.round(tds[0].getBoundingClientRect().width);

  drngInv = new DistributedRandomNumberGenerator();
  // the probability is directly proportional to the length of the note 
  // (it is used to decide if a chord should be inverted or not)
  /*
  for (let i = 0; i < durL2.length; i++) {
    let prob = durL2[i] / totDur;
    //console.log(prob);
    drngInv.addNumber(i, prob);
  }
*/
  drngInv.addNumber(NO_INV, probNoInv);
  drngInv.addNumber(INV, probInv);

  drngInv2 = new DistributedRandomNumberGenerator();
  drngInv2.addNumber(NO_INV2, probNoInv2);
  drngInv2.addNumber(INV2, probInv2);


  drngMod = new DistributedRandomNumberGenerator();
  drngMod.addNumber(NO_MOD, modProbs[modMode].probNoMod);
  drngMod.addNumber(MOD_REL, modProbs[modMode].probModRel);
  drngMod.addNumber(MOD_NEXT, modProbs[modMode].probModNext);

  drngChgProg = new DistributedRandomNumberGenerator();
  drngChgProg.addNumber(CHG_PROG, probChgProg);
  drngChgProg.addNumber(NO_CHG_PROG, probNoChgProg);

  progrNoteIdx = 0;


  /** DRUM BEAT programming */
  let groups = [];
  let cnt = patSize / 2;
  while (true) {
    //console.log(cnt)
    if (cnt == 2 || cnt == 1) {
      groups.push(2);
      cnt -= 2;
      break;
    } else if (cnt == 0) {
      break;
    }
    let increment = random() > 0.5 ? 2 : 3;
    groups.push(increment);
    cnt -= increment;
  }

  let groupLength = groups.length;
  if (cnt == -1) {
    // palindrome pattern
    for (let i = groupLength - 2; i >= 0; i--) {
      groups.push(groups[i]);
    }
  } else {
    // repeat pattern
    for (let i = 0; i < groupLength; i++) {
      groups.push(groups[i]);
    }
  }

  let groupStart = [0];
  let start = 0;
  for (let i = 1; i < groups.length; i++) {
    start += groups[i - 1];
    groupStart.push(start);
  }

  // console.log(groups);
  // console.log(groupStart);

  let hhCombo2 = ["00",
    //"01", 
    //"10", 
    "11"];
  let hhCombo3 = [
    "000",
    //"001", 
    "010",
    //"011", 
    //"100", 
    "101",
    //"110", 
    "111"];

  let hh2Combo2 = [
    //"01", 
    //"10", 
    "11"];
  let hh2Combo3 = [
    //"001", 
    "010",
    //"011", 
    //"100", 
    "101",
    //"110", 
    "111"];

  bdPat = [];
  snrPat = [];
  hhPat = [];
  hh2Pat = [];

  for (let i = 0; i < patSize; i++) {
    let startIdx = groupStart.indexOf(i);
    if (i == 0 || (startIdx > -1 && groups[startIdx] == 3 && startIdx % 2 == 0)) {
      bdPat.push(1);
    } else {
      bdPat.push(0);
    }
    if (startIdx > -1 && groups[startIdx] == 2 && startIdx % 2 != 0) {
      snrPat.push(1);
    } else {
      snrPat.push(0);
    }
    if (startIdx > -1 && groups[startIdx] == 2) {
      let hhCombo = hhCombo2[parseInt(random(hhCombo2.length), 10)];
      hhPat.push(parseInt(hhCombo.charAt(0), 10));
      hhPat.push(parseInt(hhCombo.charAt(1), 10));
      if (hhCombo === "00") {
        let hh2Combo = hh2Combo2[parseInt(random(hh2Combo2.length), 10)];
        hh2Pat.push(parseInt(hh2Combo.charAt(0), 10));
        hh2Pat.push(parseInt(hh2Combo.charAt(1), 10));
      } else {
        hh2Pat.push(0);
        hh2Pat.push(0);
      }
    } else if (startIdx > -1 && groups[startIdx] == 3) {
      let hhCombo = hhCombo3[parseInt(random(hhCombo3.length), 10)];
      hhPat.push(parseInt(hhCombo.charAt(0), 10));
      hhPat.push(parseInt(hhCombo.charAt(1), 10));
      hhPat.push(parseInt(hhCombo.charAt(2), 10));
      if (hhCombo === "000") {
        let hh2Combo = hh2Combo3[parseInt(random(hh2Combo3.length), 10)];
        hh2Pat.push(parseInt(hh2Combo.charAt(0), 10));
        hh2Pat.push(parseInt(hh2Combo.charAt(1), 10));
        hh2Pat.push(parseInt(hh2Combo.charAt(2), 10));
      } else {
        hh2Pat.push(0);
        hh2Pat.push(0);
        hh2Pat.push(0);
      }
    }
  }

  // console.log(bdPat);
  // console.log(snrPat);
  // console.log(hhPat);
  // console.log(hh2Pat);

  bdIdx = 0;
  snrIdx = 0;
  hhIdx = 0;
  hh2Idx = 0;
  seqIdx = 0;

  /** performance monitoring */
  perf = []
  perf8 = []
  perf2 = []
  perf3 = []
  perf4 = []

  timer();

  // beat (metronome)
  timer2();

  // drum timers 

  timer4();
  timer5();
  timer6();
  timer7();

}

function draw() {
  background(0, 100, 200);
  rect(seqIdx * sixteenthWidth, 0, sixteenthWidth, 20);
}

function timer() {

  let t0 = Date.now();

  if (monitoring)
    perf.push(t0);

  if (cancel) {
    cancel = false;

    if (monitoring) {
      if (perf.length % 2 != 0)
        perf.pop();

      let sum = 0
      for (let i = perf.length - 1; i > 0; i--) {
        let delta = perf[i] - perf[i - 1];
        sum += delta;
      }

      //console.log(perf);
      console.log("perf " + (sum / (perf.length - 1)));
    }

    return;
  }

  if (synthOn) {

    activeProgr = progr[progrIdx]['progr'];

    let restart = false;

    if (progrNoteIdx >= activeProgr.length) {
      progrNoteIdx = 0;
      restart = true;

      // console.log("restart " + restart);

      // change probabilities
      probChgProg = probChgProg > 0 ? probChgProg * 2 : 0.2;
      if (probChgProg > 1)
        probChgProg = 1;
      probNoChgProg = 1 - probChgProg;
      drngChgProg.addNumber(CHG_PROG, probChgProg);
      drngChgProg.addNumber(NO_CHG_PROG, probNoChgProg);

    }

    let randMod = drngMod.getDistributedRandomNumber();
    // console.log("PROB ---> don't change progr = " + probNoChgProg + " change progr = " + probChgProg);

    let randChgProg = drngChgProg.getDistributedRandomNumber();

    if (randMod == MOD_NEXT &&
      (restart || (randChgProg == CHG_PROG && activeProgr[progrNoteIdx] == 4))) {
      // is this a new iteration ...
      // ... or are we playing the V chord in a progression? Modulate to a new key!
      // console.log("activeKey is maj: " + (activeKey == majKey) + "... modulation to the next key in the circle....");

      // recalculate the scale
      let activeCircle;
      let shiftNext = 0; // how much transposition to apply to get to the next key in the circle
      if (activeKey == majKey)
        activeCircle = majCircle;
      else
        activeCircle = minCircle;

      for (let i = 0; i < activeCircle.length; i++) {
        let diff = activeCircle[i] - tonic;
        if (diff < 0) diff *= -1;
        if (diff % 12 == 0) {
          // found position in the circle
          // .. change the key!
          shiftNext = activeCircle[(i + 1) % activeCircle.length] - activeCircle[i];
          break;
        }
      }

      tonic += shiftNext; // shift the scale

      // console.log("new tonic " + midiToString(tonic));

      keyTxt.textContent = "Key: " + midiToString(tonic, false) + " " + (activeKey == minKey ? "min" : "maj");

      let activeInterval = activeKey == minKey ? minInterval : majInterval;

      let note = tonic;

      for (let i = 0; i < numNotes; i++) {
        midiSequence[i] = note;
        note += activeInterval[i];
      }

      if (randChgProg == CHG_PROG) { // change progr type
        // reset probabilities
        probChgProg = 0;
        probNoChgProg = 1 - probChgProg;
        drngChgProg.addNumber(CHG_PROG, probChgProg);
        drngChgProg.addNumber(NO_CHG_PROG, probNoChgProg);

        if (restart)
          progrIdx = enabledProgr[parseInt(random() * enabledProgr.length, 10)];

        else
          progrIdx = progr0[parseInt(random() * progr0.length, 10)];

        progrNoteIdx = 0; // progr0 -> reset to I chord

        if (typeof progr[progrIdx] === 'undefined')
          progrIdx = enabledProgr[parseInt(random() * enabledProgr.length, 10)];

        activeProgr = progr[progrIdx]['progr'];

        if (typeof progrWin != "undefined")
          updateProgressionViz();

        // console.log("new progr " + progrIdx);
      }

    } else if (randMod == MOD_REL &&
      (restart ||
        (randChgProg == CHG_PROG && activeKey == majKey && (activeProgr[progrNoteIdx] == majToMin[0]["startKeyIdx"] || activeProgr[progrNoteIdx] == majToMin[1]["startKeyIdx"])) ||
        (randChgProg == CHG_PROG && activeKey == minKey && (activeProgr[progrNoteIdx] == minToMaj[0]["startKeyIdx"] || activeProgr[progrNoteIdx] == minToMaj[1]["startKeyIdx"])))
    ) {
      // is this a new iteration ...
      // ... or are we in a major/minor key and are we playing the ii/I chord in a progression? 
      // Modulate to the relative minor/major key!

      // let's move to the relative minor/major key
      // isRelShifted: boolean that indicates if we have to move to the shifted relative min/maj
      // (example, move from Cmaj to Emin or from Emin to Cmaj)
      let isMajToMin, circle, nuCircle, interval, modulation, isRelShifted;
      if (activeKey == majKey)
        isMajToMin = true;
      else
        isMajToMin = false;

      //console.log("modulation to relative minor/major key ... isMajToMin: " + isMajToMin);

      activeKey = isMajToMin ? minKey : majKey;

      if (typeof progrWin !== "undefined")
        updateProgressionList();

      circle = isMajToMin ? majCircle : minCircle;
      nuCircle = isMajToMin ? minCircle : majCircle;
      interval = isMajToMin ? minInterval : majInterval;

      if (isMajToMin)
        if (activeProgr[progrNoteIdx] == majToMin[0]["startKeyIdx"]) {
          modulation = majToMin[0];
          isRelShifted = false;
        } else {
          modulation = majToMin[1];
          isRelShifted = true;
        }

      else {
        if (activeProgr[progrNoteIdx] == minToMaj[0]["startKeyIdx"]) {
          modulation = minToMaj[0];
          isRelShifted = false;
        } else {
          modulation = minToMaj[1];
          isRelShifted = true;
        }

      }


      for (let i = 0; i < circle.length; i++) {
        let diff = circle[i] - tonic;
        if (diff < 0) diff *= -1;
        if (diff % 12 == 0) {
          // found position in the circle
          // .. change the key!
          tonic = !isRelShifted ? nuCircle[i] - diff : isMajToMin ? nuCircle[(i + 1) % nuCircle.length] - diff : nuCircle[(i - 1 < 0 ? nuCircle.length - 1 : i - 1)] - diff;
          break;
        }
      }

      // console.log("new tonic " + midiToString(tonic));

      keyTxt.textContent = "Key: " + midiToString(tonic, false) + " " + (isMajToMin ? "min" : "maj");

      // recalculate the scale

      let note = tonic;

      for (let i = 0; i < numNotes; i++) {
        midiSequence[i] = note;
        note += interval[i];
      }

      if (randChgProg == CHG_PROG) { // change progr type
        // reset probabilities
        probChgProg = 0;
        probNoChgProg = 1 - probChgProg;
        drngChgProg.addNumber(CHG_PROG, probChgProg);
        drngChgProg.addNumber(NO_CHG_PROG, probNoChgProg);

        let progrArr = modulation["progrArr"];

        if (progrArr.length == 0 || restart)
          progrIdx = enabledProgr[parseInt(random() * enabledProgr.length, 10)];
        else
          progrIdx = progrArr[parseInt(random() * progrArr.length, 10)];

        progrNoteIdx = modulation["nuProgrNoteIdx"]; // set start point of the progression
        activeProgr = progr[progrIdx]['progr'];
        // console.log("new progr " + progrIdx);
      }

      if (typeof progrWin != "undefined")
        updateProgressionViz();

    } else if (restart && randChgProg == CHG_PROG) {
      // no pivot chord found, so choose another progression (no modulation)
      // console.log("no modulation....");
      // reset probabilities
      probChgProg = 0;
      probNoChgProg = 1 - probChgProg;
      drngChgProg.addNumber(CHG_PROG, probChgProg);
      drngChgProg.addNumber(NO_CHG_PROG, probNoChgProg);

      progrIdx = enabledProgr[parseInt(random() * enabledProgr.length, 10)];

      activeProgr = progr[progrIdx]['progr'];

      if (typeof progrWin != "undefined")
        updateProgressionViz();
      // console.log("new progr " + progrIdx);
    }

    if (progrNoteIdx >= activeProgr.length) {
      cancel2 = true;
      cancel3 = true;
      isPlaying = false;
      return;

    } else {

      // console.log("progrNoteIdx " + progrNoteIdx);

      if (typeof progrWin != "undefined")
        showActiveProgrIdx(progrNoteIdx);

      noteIdx = activeProgr[progrNoteIdx];
      activeShift = shift[activeKey[noteIdx]];
      if (activeKey == majKey && progr[progrIdx].hasOwnProperty("varMaj")) {
        activeShift = shift[progr[progrIdx]["varMaj"][progrNoteIdx]];
      } else if (activeKey == minKey && progr[progrIdx].hasOwnProperty("varMin")) {
        activeShift = shift[progr[progrIdx]["varMin"][progrNoteIdx]];
      }

      // console.log(activeKey)
      // console.log(activeShift)

      midiNote = midiSequence[noteIdx];  // current playing note

      // show notes in the gui

      if (playedKeyEl != null)
        playedKeyEl.classList.remove("pressed");
      if (playedKeyEl2 != null)
        playedKeyEl2.classList.remove("pressed");
      if (playedKeyEl3 != null)
        playedKeyEl3.classList.remove("pressed");
      if (playedKeyEl4 != null)
        playedKeyEl4.classList.remove("pressed");

      playedKeyEl3 = document.getElementById("k" + (midiNote + activeShift[2]));
      if (playedKeyEl3 != null) playedKeyEl3.classList.add("pressed");

      noteTxt.textContent = midiToString(midiNote + activeShift[2]) + " " + midiToString(midiNote + activeShift[3]);

      if (seventhOn) {
        playedKeyEl4 = document.getElementById("k" + (midiNote + activeShift[3]));
        if (playedKeyEl4 != null) playedKeyEl4.classList.add("pressed");
      }

      freq = midiToFreq(midiNote + activeShift[0]);

      freq2 = midiToFreq(midiNote + activeShift[1]);

      if (inversionOn && INV == drngInv.getDistributedRandomNumber()) {

        //console.log("inversion");

        freq = midiToFreq(midiNote + activeShift[0] + 12); // first inversion

        playedKeyEl = document.getElementById("k" + (midiNote + activeShift[0] + 12));
        if (playedKeyEl != null) playedKeyEl.classList.add("pressed");

        noteTxt.textContent += " " + midiToString(midiNote + activeShift[0] + 12);

        if (INV2 == drngInv2.getDistributedRandomNumber()) {

          // console.log("inversion 2");

          freq2 = midiToFreq(midiNote + activeShift[1] + 12); // second inversion
          playedKeyEl2 = document.getElementById("k" + (midiNote + activeShift[1] + 12));
          if (playedKeyEl2 != null) playedKeyEl2.classList.add("pressed");

          noteTxt.textContent += " " + midiToString(midiNote + activeShift[1] + 12);

          // reset probabilities
          probInv2 = 0;
          probNoInv2 = 1 - probInv2;
          drngInv2.addNumber(INV2, probInv2);
          drngInv2.addNumber(NO_INV2, probNoInv2);
        }

        // reset probabilities
        probInv = 0;
        probNoInv = 1 - probInv;
        drngInv.addNumber(INV, probInv);
        drngInv.addNumber(NO_INV, probNoInv);

      } else {

        playedKeyEl = document.getElementById("k" + (midiNote + activeShift[0]));
        if (playedKeyEl != null) playedKeyEl.classList.add("pressed");

        playedKeyEl2 = document.getElementById("k" + (midiNote + activeShift[1]));
        if (playedKeyEl2 != null) playedKeyEl2.classList.add("pressed");

        noteTxt.textContent = midiToString(midiNote + activeShift[0]) + " "
          + midiToString(midiNote + activeShift[1]) + " " + noteTxt.textContent;

        probInv = probInv > 0 ? probInv * 2 : 0.1;
        if (probInv > 1)
          probInv = 1;
        probNoInv = 1 - probInv;
        //console.log("probInv " + probInv + " probNoInv " + probNoInv);
        drngInv.addNumber(INV, probInv);
        drngInv.addNumber(NO_INV, probNoInv);

        probInv2 = probInv2 > 0 ? probInv2 * 2 : 0.1;
        if (probInv2 > 1)
          probInv2 = 1;
        probNoInv2 = 1 - probInv2;
        //console.log("probInv2 " + probInv2 + " probNoInv2 " + probNoInv2);
        drngInv2.addNumber(INV2, probInv2);
        drngInv2.addNumber(NO_INV2, probNoInv2);
      }

      osc.freq(freq);
      osc2.freq(freq2);

      freq3 = midiToFreq(midiNote + activeShift[2]);
      osc3.freq(freq3);

      //if (seventhOn) {
      freq4 = midiToFreq(midiNote + activeShift[3]);
      osc4.freq(freq4);
      // }

      // console.log(activeShift);
      // console.log("note playing " + midiNote + "--->" + (midiNote + activeShift[0]) + "--->" + midiToString(midiNote + activeShift[0]));
      // console.log("seventhOn " + seventhOn);

      noteIdx2 = 0;

      timer3();

      progrNoteIdx++;
    }

  }

  // console.log((Date.now() - t0));

  setTimeout(timer,
    barMs
    - timerDelayCompensationMs2
    - (Date.now() - t0)
  );

}

function timer3() {

  let t0 = Date.now();

  if (cancel3) {
    cancel3 = false;
    //console.log("CANCEL");

    if (monitoring) {
      if (perf3.length % 2 != 0)
        perf3.pop();

      let sum = 0
      for (let i = perf3.length - 1; i > 0; i--) {
        let delta = perf3[i] - perf3[i - 1];
        sum += delta;
      }

      //console.log(perf3);
      console.log("perf3 " + (sum / (perf3.length - 1)));
    }


    return;
  }

  if (monitoring && noteIdx2 == 0) {
    perf3.push(t0);
  }

  if (noteIdx2 == durL2.length) {
    //console.log("STOP " + noteIdx2);
    return;
  }

  //console.log(noteIdx2);

  let sumD = 0;
  for (let i = 0; i < noteIdx2; i++) {
    sumD += durL2[i];
  }

  // sequencer
  seqIdx = sumD / sixteenthMs; // how many 1/16 have passed

  decayTime = (parseInt(durL2[noteIdx2] - attackTime * 1000, 10)
    - timerDelayCompensationMs
  ) / 1000;

  //console.log(decayTime + " " + freq + " " + freq2 + " " + freq3 + " " + freq4);

  env.setADSR(attackTime, decayTime, susPercent, releaseTime);
  env2.setADSR(attackTime, decayTime, susPercent, releaseTime);
  env3.setADSR(attackTime, decayTime, susPercent, releaseTime);
  env4.setADSR(attackTime, decayTime, susPercent, releaseTime);

  /** RANDOMIZE VOLUME */

  if (random() > .5)
    mult3 = 1;
  else
    mult3 = -1;

  attackLevel = Math.round((0.225 + mult3 * random(0.025)) * 100) / 100;

  // console.log("attackLevel " + attackLevel);

  env.setRange(attackLevel, releaseLevel);
  env2.setRange(attackLevel, releaseLevel);
  env3.setRange(attackLevel, releaseLevel);
  env4.setRange(attackLevel, releaseLevel);


  if (synthOn) {

    if (!seventhOn) {
      env.play();
      env2.play();
      env3.play();
    }

    else {

      env.play();
      env2.play();
      env3.play();
      env4.play();
    }

    envF.play();

  }

  noteIdx2++;

  // console.log((Date.now() - t0));
  setTimeout(timer3,
    durL2[noteIdx2 - 1]
    - timerDelayCompensationMs2
    - (Date.now() - t0));

}

function timer2() {

  let t0 = Date.now();
  if (monitoring) {
    perf2.push(t0);
  }

  if (cancel2) {
    cancel2 = false;
    if (monitoring) {
      if (perf2.length % 2 != 0)
        perf2.pop();

      let sum = 0
      for (let i = perf2.length - 1; i > 0; i--) {
        let delta = perf2[i] - perf2[i - 1];
        sum += delta;
      }

      //console.log(perf2);
      console.log("perf2 " + (sum / (perf2.length - 1)));
    }
    return;
  }

  if (beatOn)
    beatSound.play();

  setTimeout(timer2,
    beatMs
    - timerDelayCompensationMs2
  );
}

function timer7() {

  let t0 = Date.now();

  if (cancel7) {
    cancel7 = false;
    return;
  }

  if (random() > .5)
    mult7 = 1;
  else
    mult7 = -1;

  hh2Sound.setVolume(0.75 + mult7 * random(0.25));

  if (hh2Pat[hh2Idx++] > 0 && drumsOn)
    hh2Sound.play();

  if (hh2Idx == patSize)
    hh2Idx = 0;

  setTimeout(timer7,
    sixteenthMs
    - timerDelayCompensationMs2
    - (Date.now() - t0));
}

function timer6() {
  let t0 = Date.now();
  if (cancel6) {
    cancel6 = false;
    return;
  }

  if (random() > .5)
    mult6 = 1;
  else
    mult6 = -1;

  hhSound.setVolume(0.75 + mult6 * random(0.25));

  if (hhPat[hhIdx++] > 0 && drumsOn)
    hhSound.play();

  if (hhIdx == patSize)
    hhIdx = 0;

  setTimeout(timer6,
    sixteenthMs
    - timerDelayCompensationMs2
    - (Date.now() - t0));
}

function timer5() {
  let t0 = Date.now();
  if (cancel5) {
    cancel5 = false;
    return;
  }

  if (random() > .5)
    mult5 = 1;
  else
    mult5 = -1;

  snrSound.setVolume(0.75 + mult5 * random(0.25));

  if (snrPat[snrIdx++] > 0 && drumsOn)
    snrSound.play();

  if (snrIdx == patSize)
    snrIdx = 0;

  setTimeout(timer5,
    sixteenthMs
    - timerDelayCompensationMs2
    - (Date.now() - t0));
}

function timer4() {
  let t0 = Date.now();

  if (monitoring)
    perf4.push(t0)

  if (cancel4) {
    cancel4 = false;

    if (monitoring) {
      if (perf4.length % 2 != 0)
        perf4.pop();

      let sum = 0
      for (let i = perf4.length - 1; i > 0; i--) {
        let delta = perf4[i] - perf4[i - 1];
        sum += delta;
      }

      //console.log(perf4);
      console.log("perf4 " + (sum / (perf4.length - 1)));

    }

    return;
  }

  if (random() > .5)
    mult4 = 1;
  else
    mult4 = -1;

  bdSound.setVolume(0.75 + mult4 * random(0.25));

  if (bdPat[bdIdx++] > 0 && drumsOn)
    bdSound.play();

  if (bdIdx == patSize)
    bdIdx = 0;

  setTimeout(timer4,
    sixteenthMs
    - timerDelayCompensationMs2
    - (Date.now() - t0));
}



function correctNote(note) {
  let lastChar = note.substring(note.length - 1);
  if ("3456".indexOf(lastChar) < 0) { // KO

    if (note.indexOf("#") >= 0) { // HAS #
      note = note.substring(0, 2) + "4";
    } else {
      note = note.substring(0, 1) + "4";
    }
  }
  return note;
}

function toRomanIndex(idx) {
  let ret = "";

  //println(idx);
  if (idx == 0)
    ret = activeKey == majKey ? "I" : "i";
  else if (idx == 1)
    ret = activeKey == majKey ? "ii" : "ii°";
  else if (idx == 2)
    ret = activeKey == majKey ? "iii" : "III";
  else if (idx == 3)
    ret = activeKey == majKey ? "IV" : "iv";
  else if (idx == 4)
    ret = activeKey == majKey ? "V" : "V";
  else if (idx == 5)
    ret = activeKey == majKey ? "vi" : "VI";
  else if (idx == 6)
    ret = activeKey == majKey ? "vii°" : "vii°";

  //println(ret);
  return ret;
}

function stringToMidi(note) {
  let octave = parseInt(note.substring(note.length - 1), 10);
  let tone = note.substring(0, note.length - 1);
  let base = 12 * (octave + 1);
  switch (tone.toUpperCase()) {
    case "C":
      return base;
    case "C#":
      return base + 1;
    case "D":
      return base + 2;
    case "D#":
      return base + 3;
    case "E":
      return base + 4;
    case "F":
      return base + 5;
    case "F#":
      return base + 6;
    case "G":
      return base + 7;
    case "G#":
      return base + 8;
    case "A":
      return base + 9;
    case "A#":
      return base + 10;
    case "B":
      return base + 11;
    default:
      return 60;
  }
}


function midiToString(note, showOctave = true) {
  let octave = "";
  if (showOctave)
    octave = parseInt(note / 12, 10) - 1;
  let tone = note % 12;
  switch (tone) {
    case 0:
      return "C" + octave;
    case 1:
      return "C#" + octave;
    case 2:
      return "D" + octave;
    case 3:
      return "D#" + octave;
    case 4:
      return "E" + octave;
    case 5:
      return "F" + octave;
    case 6:
      return "F#" + octave;
    case 7:
      return "G" + octave;
    case 8:
      return "G#" + octave;
    case 9:
      return "A" + octave;
    case 10:
      return "A#" + octave;
    case 11:
      return "B" + octave;

    default:
      return "C4";
  }
}

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}


function createKeyboard() {

  let domArr = ['<li class="white b"></li>',
    '<li class="black as"></li>',
    '<li class="white a"></li>',
    '<li class="black gs"></li>',
    '<li class="white g"></li>',
    '<li class="black fs"></li>',
    '<li class="white f"></li>',
    '<li class="white e"></li>',
    '<li class="black ds"></li>',
    '<li class="white d"></li>',
    '<li class="black cs"></li>',
    '<li class="white c"></li>'];

  let numOct = 5;
  let midiKey = 36;

  if (isXLg) {
    numOct = 4;
    midiKey = 48;
  } else if (isLg) {
    numOct = 3;
    midiKey = 48;
  } else if (isMd) {
    numOct = 2;
    midiKey = 48;
  } else if (isSm || isXSm) {
    numOct = 1;
    midiKey = 48;
  }

  let kb = document.getElementById("kb");

  for (let i = 0; i < numOct; i++) {
    let ul = document.createElement("ul");
    for (let j = 0; j < domArr.length; j++) {
      let key = htmlToElement(domArr[j]);
      key.setAttribute("id", "k" + midiKey);
      ul.insertAdjacentElement('beforeend', key);
      if (midiKey < 72) {
        key.addEventListener("click", play, false);
        key.classList.add("pressable");
      }
      midiKey++;
    }
    kb.insertAdjacentElement('beforeend', ul);
  }

  let w = 0;
  let uls = kb.getElementsByTagName("ul");
  uls = [...uls]
  uls.forEach(function (el, index) {
    let rect = el.getBoundingClientRect();
    // console.log(el);
    w += rect.width;
  });
  let kbW = kb.getBoundingClientRect().width;
  //console.log(kbW)
  let padding = Math.floor((kbW - w) / 2.);
  kb.setAttribute("style", "padding:0 " + padding + "px;");
}


class DistributedRandomNumberGenerator {

  constructor() {
    this.distribution = {};
  }

  addNumber(value, probability) {
    this.distribution[value] = probability;
  }

  getDistributedRandomNumber() {
    let rand = random();
    let tempDist = 0;
    for (let value in this.distribution) {
      tempDist += this.distribution[value];
      if (rand <= tempDist) {
        return value;
      }
    }
    return 0;
  }

}