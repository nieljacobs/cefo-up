"use strict";

function _instanceof(left, right) { if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) { return right[Symbol.hasInstance](left); } else { return left instanceof right; } }

function _classCallCheck(instance, Constructor) { if (!_instanceof(instance, Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var DeviceInfo =
/*#__PURE__*/
function () {
  function DeviceInfo() {
    _classCallCheck(this, DeviceInfo);

    this.dataObject = {};
  }

  _createClass(DeviceInfo, [{
    key: "buildDataObject",
    value: function buildDataObject() {
      var _this = this;

      // it'll faster to check this way if the async tasks has been completed
      // rather than checking if the propery has been initialized in the tmpObj
      var asyncTasksCompleted = 0; // reaching value 2 will result a return. getting public and local IP

      var tmpObj = {
        "Timezone": this.getTomeZone(),
        "Browser-JS-User-Agent": window.navigator.userAgent || "",
        "Do-Not-Track": this.checkDoNotTrack(),
        "OS-Info": {
          "os": this.getOS(),
          "version": this.getOSVersion()
        },
        "Device-Info": {
          "brand": this.getDeviceMenufacturer(),
          "model": ""
        },
        "Screen": {
          "width": window.screen.width || "",
          "height": window.screen.height || ""
        },
        "Window": {
          "width": window.outerWidth || "",
          "height": window.outerHeight || ""
        },
        "Scaling-Factor": window.devicePixelRatio || "",
        "Color-Depth": window.screen.colorDepth || "",
        "Plugins": this.getPluginNames()
      };
      this.getPublicIP().then(function (obj) {
        tmpObj["Public-IP"] = obj['ip'];
        asyncTasksCompleted++;
      }).catch(function (err) {
        tmpObj["Public-IP"] = "";
        console.log(err);
        asyncTasksCompleted++;
      });

      try {
        this.getLocalIP().then(function (ip) {
          tmpObj["Local-IP"] = ip;
          asyncTasksCompleted++;
        });
      } catch (error) {
        asyncTasksCompleted++;
        tmpObj["Local-IP"] = "";
      }

      return new Promise(function (resolve, reject) {
        var intervalRef = setInterval(function () {
          if (asyncTasksCompleted >= 2) {
            _this.dataObject = tmpObj;
            clearInterval(intervalRef);
            resolve(tmpObj);
          }
        }, 50);
      });
    }
  }, {
    key: "package",
    value: function _package() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.buildDataObject().then(function (OBJ) {
          var screenD = OBJ['Screen']; // screen dimentions

          var windowD = OBJ['Window']; // window dimentions

          var osinfo = OBJ['OS-Info'];
          var deviceInfo = OBJ['Device-Info'];
          var encd = encodeURIComponent; // percent encoding os and brand info

          OBJ['User-Agent'] = "".concat(encd(osinfo.os), "/").concat(encd(osinfo.version), " (").concat(encd(deviceInfo.brand), "/").concat(encd(deviceInfo.model), ")");
          OBJ["Window-Size"] = "width=".concat(windowD['width'], "&height=").concat(windowD['height']);
          OBJ["Screens"] = "width=".concat(screenD['width'], "&height=").concat(screenD['height'], "&scaling-factor=").concat(OBJ['Scaling-Factor'], "&color-depth=").concat(OBJ['Color-Depth']);
          OBJ['Plugins'] = encodeURIComponent(OBJ['Plugins']).replace(/\%2C/ig, ",");
          delete OBJ['Screen'];
          delete OBJ["Color-Depth"];
          delete OBJ['Scaling-Factor'];
          delete OBJ['Window'];
          delete OBJ['Device-Info'];
          delete OBJ['OS-Info'];
          resolve(OBJ);
        });
      });
    }
  }, {
    key: "getPublicIP",
    value: function getPublicIP() {
      var xhr = new XMLHttpRequest();
      var obj = {};
      xhr.open("GET", "https://reallyfreegeoip.org/json/");
      xhr.send();
      return new Promise(function (resolve, reject) {
        xhr.onload = function () {
          if (xhr.getResponseHeader("Content-type") == "application/json" && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            obj['ip'] = response['ip'];
            obj['lat'] = response['latitude'];
            obj['long'] = response['longitude'];
            obj['country_code'] = response['country_code'];
            obj['time_zone'] = response['time_zone'];
            resolve(obj);
          }
        };

        xhr.onerror = function (err) {
          reject(err);
        };
      });
    }
  }, {
    key: "getLocalIP",
    value: function getLocalIP() {
      document.body.insertAdjacentHTML("beforeend", "<iframe id=\"dummy-frame\" sandbox=\"allow-same-origin\" style=\"display: none\"></iframe>");

      var emptyFunction = function emptyFunction() {},
          IP = "";

      var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

      if (!RTCPeerConnection) {
        var crrWin = iframe.currentWindow;
        RTCPeerConnection = crrWin.RTCPeerConnection || crrWin.mozRTCPeerConnection || crrWin.webkitRTCPeerConnection;
        if (!RTCPeerConnection) return "";
      } // let servers = { iceServers: [{urls: "stun:stun.services.mozilla.com", sdpSemantics:'plan-b'}] }


      var servers = {
        iceServers: []
      };
      var mediaConstraints = {
        optional: [{
          RtpDataChannels: true
        }]
      };

      try {
        var conn = new RTCPeerConnection(servers, mediaConstraints);
        conn.createOffer(conn.setLocalDescription.bind(conn), emptyFunction, {
          mandatory: {
            OfferToReceiveAudio: true
          }
        });
        conn.createDataChannel("");
      } catch (err) {
        console.error("Couldn't Establish RTCPeerConnection ", err);
        return "";
      }

      return new Promise(function (resolve, reject) {
        conn.onicecandidate = function (ice) {
          if (ice || ice.candidate || ice.candidate.candidate) {
            var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
            IP = ip_regex.exec(ice.candidate.candidate)[1];
            conn.onicecandidate = emptyFunction;
            conn.close();
            resolve(IP);
          } else resolve();
        };
      });
    }
  }, {
    key: "checkDoNotTrack",
    value: function checkDoNotTrack() {
      if (!window.navigator.doNotTrack) return "";
      return window.navigator.doNotTrack ? true : false;
    }
  }, {
    key: "getTomeZone",
    value: function getTomeZone() {
      var offset = new Date().getTimezoneOffset();
      var hour = -Math.round(offset / 60);
      var min = Math.abs(offset % 60);
      return "".concat(hour > 0 ? "+" : "-").concat(hour < 10 ? '0' + Math.abs(hour) : Math.abs(hour), ":").concat(min < 10 ? '0' + min : min);
    }
  }, {
    key: "getDimentions",
    value: function getDimentions() {
      var tmpObj = {
        "screen": {
          'height': window.screen.height || "",
          'width': window.screen.width || ""
        },
        "window": {
          'height': window.outerHeight || "",
          'width': window.innerWidth || ""
        }
      };

      if (ratio = window.devicePixelRatio) {
        tmpObj['screen']['width'] * ratio;
        tmpObj['screen']['height'] * ratio;
      }

      return tmpObj;
    }
  }, {
    key: "getOS",
    value: function getOS() {
      var userAgent = navigator.userAgent; // oscpu will result linux in android devide
      // order matters.

      if (/windows phone/i.test(userAgent)) return "Windows Phone";
      if (/Android/i.test(userAgent)) return "Android";
      if (/Mac/i.test(userAgent)) return "Mac";
      if (/iphone|ipad|ipod/i.test(userAgent) && !window.MSStream) return "IOS";
      if (/Windows/i.test(userAgent)) return "Windows";
      if (/Linux/i.test(userAgent)) return "Linux";
      if (/X11/i.test(userAgent)) return "UNIX";
      if (/OpenBSD/i.test(userAgent)) return "Open BSD";
      return "";
    }
  }, {
    key: "getOSVersion",
    value: function getOSVersion() {
      var userAgent = navigator.userAgent;
      var os = this.getOS();

      function detectDroidVersion() {
        // searching on this expression - Android 0.0.0
        // where second two numbers are optional
        // means it'll also catch Android 0 or Android 0.0
        return userAgent.match(/Android (\d\.?\d?\.?\d?\;?)/i)[1] || "";
      }

      function detectIOSVersion() {
        // checking on some IOS version specific properties
        var IOSClients = [{
          'p': !!window.indexedDB,
          'd': "8+"
        }, {
          'p': !!window.SpeechSynthesisUtterance,
          'd': "7"
        }, {
          'p': !!window.webkitAudioContext,
          'd': "6"
        }, {
          'p': !!window.matchMedia,
          'd': "5"
        }];

        for (var i = 0; i < IOSClients.length; i++) {
          if (IOSClients[i]['p']) return IOSClients[i]['d'];
        }

        return "";
      }

      function detectWindowsVersion() {
        if (/(Windows 10.0)|(Windows NT 10.0)/i.test(userAgent)) return "10";
        if (/(Windows NT 6.2)|(WOW64)/i.test(userAgent)) return "8";
        if (/Windows NT 6.1/i.test(userAgent)) return "7";
        if (/(Windows NT 6)/i.test(userAgent)) return "Vista";
        if (/(Windows NT 5.1)|(Windows XP)/i.test(userAgent)) return "XP";
        return "";
      }

      function detectMacVersion() {
        for (var i = 0; i <= 14; i++) {
          if (new RegExp("OS X 1?0?(_?)" + i + "?", "i").test(userAgent)) return "OS X 10_" + i;
        }

        return /OS X/i.test(userAgent) ? "OS X" : "";
      }

      switch (os) {
        case "Windows":
          return detectWindowsVersion();

        case "Android":
          return detectDroidVersion();

        case "Mac":
          return detectMacVersion();

        case "IOS":
          return detectIOSVersion();

        default:
          return "";
      }
    }
  }, {
    key: "getPluginNames",
    value: function getPluginNames() {
      var plugins = "";
      if (!window.navigator.plugins || window.navigator.plugins.length == 0) return "";
      Array.from(window.navigator.plugins).forEach(function (plug) {
        plugins += plug.name + ",";
      }); // only the spaces should be percent encoded

      return plugins.replace(/,$/, "");
    }
  }, {
    key: "getDeviceMenufacturer",
    value: function getDeviceMenufacturer() {
      var os = this.getOS();
      return os == "IOS" || os == "Mac" ? "Apple" : "";
    }
  }]);

  return DeviceInfo;
}();

var info = new DeviceInfo();
info.buildDataObject().then(function (obj) {
  for (var o in obj) {
    if (o == "Device-Info") continue;
    document.querySelector('.keys').insertAdjacentHTML('beforeend', "<li> ".concat(o, " </li>"));
    document.querySelector('.values').insertAdjacentHTML('beforeend', "<li> ".concat(o == "Screen" || o == "Window" ? obj[o]['width'] + " : " + obj[o]['height'] : o == "OS-Info" ? obj[o]['os'] + " : " + obj[o]['version'] : obj[o], " </li>"));
  }
});