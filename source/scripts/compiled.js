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

    // target: max number of async functions. 2
    // this.asyncCount = 0
    this.dataObject = {};
  }

  _createClass(DeviceInfo, [{
    key: "buildDataObject",
    value: function buildDataObject() {
      var _this = this;

      var asyncTasksCompleted = 0;
      var tmpObj = {
        "Timezone": this.getTomeZone(),
        "JS-User-Agent": this.getUserAgentInfo()['user_agent'],
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
        "Plugins": this.getPluginNames() || []
      };
      this.getPublicIP().then(function (obj) {
        tmpObj["Public-IP"] = obj['ip'];
        asyncTasksCompleted++;
      });
      this.getLocalIP().then(function (ip) {
        tmpObj["Local-IP"] = ip;
        asyncTasksCompleted++;
      });
      return new Promise(function (resolve, reject) {
        var intervalRef = setInterval(function () {
          if (asyncTasksCompleted >= 2) {
            _this.dataObject = tmpObj;
            clearInterval(intervalRef);
            resolve(tmpObj);
          }
        }, 70);
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
        // let intervalRef = setInterval(() => {
        xhr.onload = function () {
          if (xhr.getResponseHeader("Content-type") == "application/json" && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            obj['ip'] = response['ip'];
            obj['lat'] = response['latitude'];
            obj['long'] = response['longitude'];
            obj['country_code'] = response['country_code'];
            obj['time_zone'] = response['time_zone'];
            resolve(obj); // this.asyncCount++ // checking this oparation has been completed
          }
        };
      });
    }
  }, {
    key: "getLocalIP",
    value: function getLocalIP() {
      var _this2 = this;

      document.body.insertAdjacentHTML("beforeend", "<iframe id=\"dummy-frame\" sandbox=\"allow-same-origin\" style=\"display: none\"></iframe>");

      var emptyFunction = function emptyFunction() {},
          IP = "";

      var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

      if (!RTCPeerConnection) {
        var crrWin = iframe.currentWindow;

        var _RTCPeerConnection = crrWin.RTCPeerConnection || crrWin.mozRTCPeerConnection || crrWin.webkitRTCPeerConnection;
      } // let servers = { iceServers: [{urls: "stun:stun.services.mozilla.com", sdpSemantics:'plan-b'}] }


      var servers = {
        iceServers: []
      };
      var mediaConstraints = {
        optional: [{
          RtpDataChannels: true
        }]
      };
      var conn = new RTCPeerConnection(servers, mediaConstraints);

      conn.onicecandidate = function (ice) {
        if (ice || ice.candidate || ice.candidate.candidate) {
          var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
          IP = ip_regex.exec(ice.candidate.candidate)[1];
          _this2.asyncCount++; // checking this oparation has been completed

          conn.close();
          conn.onicecandidate = emptyFunction;
        }
      };

      conn.createOffer(conn.setLocalDescription.bind(conn), emptyFunction);
      conn.createDataChannel("");
      return new Promise(function (resolve, reject) {
        var intervalRef = setInterval(function () {
          if (IP && IP.length > 10) {
            clearInterval(intervalRef);
            resolve(IP);
          }
        }, 75);
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
      var min = Math.abs(offset % 60 * 60);
      return "".concat(hour > 0 ? "+" : "-").concat(hour < 10 ? '0' + hour : hour, ":").concat(min < 10 ? '0' + min : min);
    }
  }, {
    key: "getDimentions",
    value: function getDimentions() {
      return {
        "screen": {
          'height': window.screen.height || "",
          'width': window.screen.width || ""
        },
        "window": {
          'height': window.outerHeight || "",
          'width': window.outerWidth || ""
        }
      };
    }
  }, {
    key: "getOS",
    value: function getOS() {
      var userAgent = navigator.oscpu || navigator.platform || navigator.userAgent; // order matters.

      if (/windows phone/i.test(userAgent)) return "Windows Phone";
      if (/android/i.test(userAgent)) return "Android";
      if (/iphone|ipad|ipod/i.test(userAgent) && !window.MSStream) return "IOS";
      if (/Windows/i.test(userAgent)) return "Windows";
      if (/Mac/i.test(userAgent)) return "Macintosh";
      if (/Linux/i.test(userAgent)) return "Linux";
      if (/X11/i.test(userAgent)) return "UNIX";
      if (/OpenBSD/i.test(userAgent)) return "Open BSD";
      return "";
    }
  }, {
    key: "getOSVersion",
    value: function getOSVersion() {
      var userAgent = navigator.oscpu || navigator.platform || navigator.userAgent;
      var os = this.getOS();

      if (os == "Windows") {
        if (/(Windows 10.0)|(Windows NT 10.0)/i.test(userAgent)) return "10";
        if (/(Windows NT 6.2)|(WOW64)/i.test(userAgent)) return "8";
        if (/Windows NT 6.1/i.test(userAgent)) return "7";
        if (/(Windows NT 6)/i.test(userAgent)) return "Vista";
        if (/(Windows NT 5.1)|(Windows XP)/i.test(userAgent)) return "XP";
      } else if (os == "IOS") {
        if (!!window.indexedDB) {
          return 'iOS 8 and up';
        }

        if (!!window.SpeechSynthesisUtterance) {
          return 'iOS 7';
        }

        if (!!window.webkitAudioContext) {
          return 'iOS 6';
        }

        if (!!window.matchMedia) {
          return 'iOS 5';
        }
      }
    }
  }, {
    key: "getPluginNames",
    value: function getPluginNames() {
      var plugins = [];
      Array.from(window.navigator.plugins).forEach(function (plug) {
        plugins.push(plug.name);
      });
      return plugins;
    }
  }, {
    key: "getDeviceMenufacturer",
    value: function getDeviceMenufacturer() {
      var os = this.getOS();
      if (os == ("IOS" || "Macintosh")) return "Apple";
      return "";
    }
  }, {
    key: "getUserAgentInfo",
    value: function getUserAgentInfo() {
      return {
        "user_agent": navigator.userAgent || "",
        "os": this.getOS(),
        "os_version": this.getOSVersion(),
        "device_brand": this.getDeviceMenufacturer(),
        "device_model": ""
      };
    }
  }]);

  return DeviceInfo;
}();

var info = new DeviceInfo();
info.buildDataObject().then(function (obj) {
  for (var o in obj) {
    if (o == "Device-Info") continue;
    document.querySelector('.keys').insertAdjacentHTML('beforeend', "<li> ".concat(o, " </li>"));
    document.querySelector('.values').insertAdjacentHTML('beforeend', "<li> ".concat(o == "Screen" || o == "Window" ? obj[o]['width'] + " : " + obj[o]['height'] : o == "OS-Info" ? obj[o]['os'] & obj[o]['version'] : obj[o].toString(), " </li>"));
  }
});