// Chrome extension: Ukulele Chords for AmdDm.ru
// Author: massalogin@gmail.com
// License: CC0

var divChords        = undefined;  // AmDm-s div: #song_chords (AmDm.ru)
var selectInstrument = undefined;  // combo:      #selectInstrument (our)
var currentInstrument = 0;         // currently selected instrument in combo: Guitar = 0, Ukulele = 1

function addSelectInstrument() {
    selectInstrument = document.createElement('select');
    selectInstrument.id = 'selectInstrument';
    selectInstrument.style.margin = '0px 0px 10px 0px';
    selectInstrument.onchange = function() { onSelectInstrument(); };
    var instruments = ["Гитара", "Укулеле"];
    for (var i = 0; i < instruments.length; i++) {
        var option = document.createElement("option");
        option.value = option.text = instruments[i];
        selectInstrument.appendChild(option);
    }
    divChords.parentElement.insertBefore(selectInstrument, divChords);
}

function onSelectInstrument() {
    var i = selectInstrument.selectedIndex;
    if (currentInstrument != i) {
        currentInstrument = i;
        updateChordImages();
        save_options();
    }
}

function save_options() {
    chrome.storage.sync.set({
        currentInstrument: selectInstrument.selectedIndex
    });
}
function restore_options() {
    chrome.storage.sync.get({
        currentInstrument: 1
    }, function(items) {
        selectInstrument.selectedIndex = items.currentInstrument;
        onSelectInstrument(); // why it's not fired by "onchange"?
    });
}

// extract note from AmDm chord url
// e.g. https://amdm.ru/images/chords/Aw_0.gif -> Aw
function getChordName(chordUrl) {
    return /\/([^\/]+)_/.exec(chordUrl)[1];
}

function updateChordImage(imgChord) {
    //console.log("img chord: ", imgChord);
    if (currentInstrument == 0) { // Guitar
        imgChord.src = imgChord.getAttribute('guitar_src'); // restore saved url
        imgChord.removeAttribute('guitar_src');
    } else { // Ukulele
        var chordName = getChordName(imgChord.src);
        imgChord.setAttribute('guitar_src', imgChord.src); // save original guitar url
        imgChord.src = chrome.runtime.getURL('chords/ukulele_' + chordName + '.png');
        imgChord.alt = chordName; // chord image may be missing - show an alt text
        imgChord.style.width = imgChord.style.height = "initial"; // don't distort images
    }
}

function updateChordImages() {
    var imgs = divChords.getElementsByTagName('img');
    for (var img of imgs) {
        updateChordImage(img);
    }
}

function observeAddedChords() {
    new MutationObserver(function(mutations) {
        //console.log( "Mutations -> ", mutations);
        if (currentInstrument != 0) { // update our chord image (if not guitar selected)
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(n) {
                    if (n.nodeType == 1 && n.nodeName == "IMG")
                        updateChordImage(n);
                });
            })
        }
    }).observe(divChords, { childList: true });
}

function main()
{
    divChords = document.getElementById('song_chords');

    addSelectInstrument();

    restore_options(); // restore previously selected instrument setting

    observeAddedChords(); // AmDm removes/adds chord img elements on chord transposing
}

main();