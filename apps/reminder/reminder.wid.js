// to work with load to RAM
var loadToRAM = false;
try {
  if (WIDGETS != undefined) {
    loadToRAM = false;
  }
}
catch (err) {
  {
    WIDGETS = {};
    loadToRAM = true;
  }
}

// register 
const reg_addr = 0x40012508;
const reg_bit_mask = 0xf;

function getAlertsStoredState(bit_idx) {
  if (bit_idx >= 4) {
    return 0;
  }
  const bit_mask = (0x1 << bit_idx);
  var val = peek8(reg_addr) & bit_mask;
  return val != 0;
}

function setAlertsStoredState(bit_val, bit_idx) {
  if (bit_idx >= 4) {
    return;
  }
  const bit_mask = (0x1 << bit_idx);
  var val = peek8(reg_addr);
  if (bit_val) {
    val = val | bit_mask;
  } else {
    val = val ^ bit_mask;
  }
  poke8(reg_addr, val);
  return;
}


(() => {
  // Widget that turns 10 min alerts on or off
  var alertsOn = false;
  const alertIntervalSec = 10 * 60;
  const touch_size = 50;
  const circle_r = 8;
  const width = 2 * circle_r + 1; // width of the widget


  function buzz_me() {
    var t_buzz = 250;
    var t_break = 250;
    var t_delay = 500;
    var strenght = 0.4;
    setTimeout(Bangle.buzz, t_delay, t_buzz, strenght);
    setTimeout(Bangle.buzz, t_delay + t_break + t_buzz, t_buzz, strenght);
    setTimeout(Bangle.buzz, t_delay + 2 * t_break + 2 * t_buzz, t_buzz, strenght);
  }

  alertsOn = getAlertsStoredState(0);

  // We change the widget's functions when the user presses a screen corner
  Bangle.on("touch", function (button, xy) {
    if ((xy["x"] < touch_size) && (175 - xy["y"] < touch_size)) {
      var toggle_disabled = getAlertsStoredState(1);
      if (xy["type"] == 0) {
        if (!toggle_disabled) {
          // Normal functionality
          alertsOn = !alertsOn;
          setAlertsStoredState(alertsOn,0);
          WIDGETS["widreminder"].draw(WIDGETS["widreminder"]);
          buzz_me();
        }
      } else {
        // Block button toggle
        toggle_disabled = !toggle_disabled;
        setAlertsStoredState(toggle_disabled, 1);
        WIDGETS["widreminder"].draw(WIDGETS["widreminder"]);
      }
    }
  });



  function alert() {
    d = new Date();
    dH = d.getHours();
    dM = d.getMinutes();
    // H M tuples
    var silentTimes = [
      [[9, 0], [9, 45,]],
      [[20, 0], [20, 45]],
      [[23, 0], [24, 0]],
      [[0, 0], [8, 0]],
    ];
    var i;
    var override_off = false;
    for (i = 0; i < silentTimes.length; ++i) {
      h1 = silentTimes[i][0][0];
      m1 = silentTimes[i][0][1];
      h2 = silentTimes[i][1][0];
      m2 = silentTimes[i][1][1];
      var after_t1 = ((dH >= h1) && ((dH > h1) || (dM >= m1)));
      var after_t2 = ((dH >= h2) && ((dH > h2) || (dM >= m2)));
      if ((after_t1 == true) && (after_t2 == false)) {
        override_off = true;
      }
    }
    if ((alertsOn == true) && (override_off == false)) {
      buzz_me();
    }
  }

  setTimeout(
    () => {
      alert();
      setInterval(alert, alertIntervalSec * 1000);
    }, (alertIntervalSec - (getTime() % alertIntervalSec)) * 1000.0);


  function draw() {
    // Render inside the box this.x, this.y, this.x + this.width-1, this.y + 23
    g.reset(); // reset the graphics context to defaults (color/font/etc)
    // g.setFontAlign(0,0); // center fonts  
    g.setFontAlign(-1, -1, 0); // left top align  
    if (loadToRAM == true)
      g.drawRect(this.x, this.y, this.x + width - 1, this.y + 23); // check the bounds!
    if (alertsOn)
      g.setColor(0, 1, 0);
    else
      g.setColor(0, 0, 1);
    g.fillCircle(this.x + circle_r, this.y + circle_r, circle_r);
    if( getAlertsStoredState(1) ){
      g.setColor(g.theme.bg);
      var r2 = Math.floor(circle_r/2);
      g.fillCircle(this.x + circle_r, this.y + circle_r, r2);
    }
    g.setColor(g.theme.bg);
  }


  // add your widget
  WIDGETS["widreminder"] = {
    area: "tl", // tl (top left), tr (top right), bl (bottom left), br (bottom right)
    width: width, // how wide is the widget? You can change this and call Bangle.drawWidgets() to re-layout
    draw: draw // called to draw the widget
  };
})();

if (loadToRAM)
  Bangle.drawWidgets(); // for testing only
