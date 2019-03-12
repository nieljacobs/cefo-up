class DeviceInfo {
    constructor() {
        this.dataObject = {}
    }

    buildDataObject() {
        // it'll faster to check this way if the async tasks has been completed
        // rather than checking if the propery has been initialized in the tmpObj
        let asyncTasksCompleted = 0 // reaching value 2 will result a return. getting public and local IP
        let tmpObj = {
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
        }
        this.getPublicIP().then(obj => {
            tmpObj["Public-IP"] = obj['ip']
            asyncTasksCompleted++
        }).catch(err => {
            tmpObj["Public-IP"] = ""
            console.log(err)
            asyncTasksCompleted++
        })
        try {
            this.getLocalIP().then(ip => {
                tmpObj["Local-IP"] = ip
                asyncTasksCompleted++
            })
        } catch (error) {
            asyncTasksCompleted++
            tmpObj["Local-IP"] = ""
        }
        return new Promise((resolve, reject) => {
            let intervalRef = setInterval(() => {
                if (asyncTasksCompleted >= 2) {
                    this.dataObject = tmpObj
                    clearInterval(intervalRef)
                    resolve(tmpObj)
                }
            }, 50);
        })
    }

    package() {
        return new Promise((resolve, reject) => {
            this.buildDataObject().then(OBJ => {
                let screenD = OBJ['Screen'] // screen dimentions
                let windowD = OBJ['Window'] // window dimentions
                let osinfo = OBJ['OS-Info']
                let deviceInfo = OBJ['Device-Info']
                let encd = encodeURIComponent
                
                // percent encoding os and brand info
                OBJ['User-Agent'] = `${encd(osinfo.os)}/${encd(osinfo.version)} (${encd(deviceInfo.brand)}/${encd(deviceInfo.model)})`
                OBJ["Window-Size"] = `width=${windowD['width']}&height=${windowD['height']}`
                OBJ["Screens"] = `width=${screenD['width']}&height=${screenD['height']}&scaling-factor=${OBJ['Scaling-Factor']}&color-depth=${OBJ['Color-Depth']}`
                OBJ['Plugins'] = encodeURIComponent(OBJ['Plugins']).replace(/\%2C/ig, ",")

                delete OBJ['Screen']
                delete OBJ["Color-Depth"]
                delete OBJ['Scaling-Factor']
                delete OBJ['Window']
                delete OBJ['Device-Info']
                delete OBJ['OS-Info']

                resolve(OBJ)
            })
        })
    }

    getPublicIP() {
        let xhr = new XMLHttpRequest()
        let obj = {}
        xhr.open("GET", "https://reallyfreegeoip.org/json/")
        xhr.send()

        return new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.getResponseHeader("Content-type") == "application/json" && xhr.status == 200) {
                    let response = JSON.parse(xhr.responseText)

                    obj['ip'] = response['ip']
                    obj['lat'] = response['latitude']
                    obj['long'] = response['longitude']
                    obj['country_code'] = response['country_code']
                    obj['time_zone'] = response['time_zone']

                    resolve(obj)
                }
            }
            xhr.onerror = (err) => {
                reject(err)
            }
        })
    }

    getLocalIP() {
        document.body.insertAdjacentHTML("beforeend", `<iframe id="dummy-frame" sandbox="allow-same-origin" style="display: none"></iframe>`)
        let emptyFunction = () => {},
            IP = ""

        let RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection
        if (!RTCPeerConnection) {
            let crrWin = iframe.currentWindow
            RTCPeerConnection = crrWin.RTCPeerConnection || crrWin.mozRTCPeerConnection || crrWin.webkitRTCPeerConnection
            if (!RTCPeerConnection) return ""
        }
        // let servers = { iceServers: [{urls: "stun:stun.services.mozilla.com", sdpSemantics:'plan-b'}] }
        let servers = {
            iceServers: []
        }
        let mediaConstraints = {
            optional: [{
                RtpDataChannels: true
            }]
        }

        try {
            var conn = new RTCPeerConnection(servers, mediaConstraints)
            conn.createOffer(conn.setLocalDescription.bind(conn), emptyFunction, {
                mandatory: {
                    OfferToReceiveAudio: true
                }
            });
            conn.createDataChannel("")
        } catch (err) {
            console.error("Couldn't Establish RTCPeerConnection ", err)
            return ""
        }

        return new Promise((resolve, reject) => {
            conn.onicecandidate = ice => {
                if (ice || ice.candidate || ice.candidate.candidate) {
                    let ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
                    IP = ip_regex.exec(ice.candidate.candidate)[1]

                    conn.onicecandidate = emptyFunction
                    conn.close()
                    resolve(IP)

                } else resolve()
            }
        })
    }

    checkDoNotTrack() {
        if (!window.navigator.doNotTrack) return ""
        return window.navigator.doNotTrack ? true : false
    }

    getTomeZone() {
        let offset = (new Date()).getTimezoneOffset()
        let hour = -Math.round(offset / 60)
        let min = Math.abs(offset % 60)
        return `${hour > 0 ? "+" : "-"}${hour < 10 ? '0'+Math.abs(hour) : Math.abs(hour)}:${min < 10 ? '0'+min : min}`
    }

    getDimentions() {
        let tmpObj = {
            "screen": {
                'height': window.screen.height || "",
                'width': window.screen.width || ""
            },
            "window": {
                'height': window.outerHeight || "",
                'width': window.innerWidth || ""
            }
        }

        if (ratio = window.devicePixelRatio) {
            tmpObj['screen']['width'] * ratio
            tmpObj['screen']['height'] * ratio
        }

        return tmpObj
    }

    getOS() {
        let userAgent = navigator.userAgent; // oscpu will result linux in android devide
        // order matters.
        if (/windows phone/i.test(userAgent)) return "Windows Phone"
        if (/Android/i.test(userAgent)) return "Android"
        if (/Mac/i.test(userAgent)) return "Mac"
        if (/iphone|ipad|ipod/i.test(userAgent) && !window.MSStream) return "IOS"
        if (/Windows/i.test(userAgent)) return "Windows"
        if (/Linux/i.test(userAgent)) return "Linux"
        if (/X11/i.test(userAgent)) return "UNIX"
        if (/OpenBSD/i.test(userAgent)) return "Open BSD"

        return ""
    }

    getOSVersion() {
        let userAgent = navigator.userAgent
        let os = this.getOS()

        function detectDroidVersion() {
            // searching on this expression - Android 0.0.0
            // where second two numbers are optional
            // means it'll also catch Android 0 or Android 0.0
            return userAgent.match(/Android (\d\.?\d?\.?\d?\;?)/i)[1] || ""
        }

        function detectIOSVersion() {
            // checking on some IOS version specific properties
            let IOSClients = [{
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
            }]

            for (let i = 0; i < IOSClients.length; i++) {
                if (IOSClients[i]['p']) return IOSClients[i]['d']
            }
            return ""
        }

        function detectWindowsVersion() {
            if (/(Windows 10.0)|(Windows NT 10.0)/i.test(userAgent)) return "10"
            if (/(Windows NT 6.2)|(WOW64)/i.test(userAgent)) return "8"
            if (/Windows NT 6.1/i.test(userAgent)) return "7"
            if (/(Windows NT 6)/i.test(userAgent)) return "Vista"
            if (/(Windows NT 5.1)|(Windows XP)/i.test(userAgent)) return "XP"
            return ""
        }

        function detectMacVersion() {
            for (let i = 0; i <= 14; i++) {
                if ((new RegExp("OS X 1?0?(_?)"+ i +"?", "i")).test(userAgent)) return "OS X 10_" + i

            }
            return /OS X/i.test(userAgent) ? "OS X" : ""
        }

        switch (os) {
            case "Windows":
                return detectWindowsVersion()
            case "Android":
                return detectDroidVersion()
            case "Mac":
                return detectMacVersion()
            case "IOS":
                return detectIOSVersion()
            default:
                return ""
        }
    }

    getPluginNames() {
        let plugins = ""
        if (!window.navigator.plugins || window.navigator.plugins.length == 0) return ""
        Array.from(window.navigator.plugins).forEach(plug => {
            plugins += plug.name + ","
        })

        // only the spaces should be percent encoded
        return plugins.replace(/,$/, "")
    }

    getDeviceMenufacturer() {
        let os = this.getOS()
        return (os == "IOS" || os == "Mac") ? "Apple" : ""
        
    }
}

var info = new DeviceInfo()
info.package().then(obj => {
    for (let o in obj) {
        if (o == "Device-Info") continue
        document.querySelector('.keys').insertAdjacentHTML('beforeend', `<li> ${o} </li>`)
        document.querySelector('.values').insertAdjacentHTML('beforeend', `<li> ${
            (o == "Screen" || o == "Window") ? obj[o]['width'] +" : "+ obj[o]['height'] : (o == "OS-Info") ? obj[o]['os'] +" : "+ obj[o]['version'] : obj[o]
        } </li>`)
    }
})