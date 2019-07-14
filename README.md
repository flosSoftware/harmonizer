# Instructions
- Open index.html
- Click on the piano keyboard (or press SPACE) to start playing
- Please note that you can click only the light blue buttons on the keyboard
- To stop, press SPACE
- Adjust the parameters as you like, toggles/sliders work while playing, while the others take effect on the first restart
# How does this work
- Plays chords according to predefined progressions, in various keys taken from the Circle of fifths
- It always starts from the key you pressed; if you use SPACE, it starts from A3 note (so the first key is A major or A minor)
- At times, shifts to a new key (using pivot chords) according to the rules chosen in the select field
- To modulate from a major key to its relative minor, it makes use of *ii - iv* correspondence or *iii - i* correspondence (in the latter case it doesn't switch to the strict relative key, but to its neighbouring key)
- To modulate form a minor key to its relative major, it makes use of *I - vi* correspondence or *VI - I* correspondence (in the latter case it doesn't switch to the strict relative key, but to its neighbouring key)
- At times, shifts to a new progression
- At times, makes a chord inversion (if Inv parameter is toggled on)
# Thanks to ...
- p5.js, p5.sound
- bootstrap
- https://codepen.io/zastrow/pen/oDBki for the nice piano keyboard.
- https://soundpacks.com/free-sound-packs/jazz-drum-kit/ for the drum kit sounds.