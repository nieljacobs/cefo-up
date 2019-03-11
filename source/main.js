class DeviceInfo {
    constructor() {
        // target: max number of async functions. 2
        this.asyncCount = 0
        this.dataObject = {
            "Public-IP": this.getPublicIP(),
            "Local-IP": this.getLocalIP(),
            "Timezone": this.getTomeZone(),
            "JS-User-Agent": this.getUserAgentInfo['user_agent'],
            "Do-Not-Track": this.checkDoNotTrack(),
            "OS-Info": {
                "os": this.getOS(),
                "version": this.getOSVersion()
            },
            "Device-Info": {
                "brand": this.getDevideMenufacturer(),
                "model": ""
            },
            "Screen": {
                "width" : window.screen.width || "",
                "height": window.screen.height || ""
            },
            "Window": {
                "width" : window.outerWidth || "",
                "height": window.outerHeight || ""
            },
            "Scaling-Factor": window.devicePixelRatio || "",
            "Color-Depth": window.screen.colorDepth || "",
            "Plugins": this.getPluginNames() || []
        }
    }

    getDataObject() {
        setTimeout(() => {
            return this.dataObject  
        }, 1000)
    }

    getPublicIP() {
        let xhr = new XMLHttpRequest()
        let obj = {}
        xhr.open("GET", "https://reallyfreegeoip.org/json/")
        xhr.onload = () => {
            if (xhr.getResponseHeader("Content-type") == "application/json" && xhr.status == 200) {
                let response = JSON.parse(xhr.responseText)

                obj['ip'] = response['ip']
                obj['lat'] = response['latitude']
                obj['long'] = response['longitude']
                obj['country_code'] = response['country_code']
                obj['time_zone'] = response['time_zone']

                this.ipInfo = obj
                this.asyncCount++ // checking this oparation has been completed
            }
        }
        xhr.send()
    }

    getLocalIP() {
        document.body.insertAdjacentHTML("beforeend", `<iframe id="dummy-frame" sandbox="allow-same-origin" style="display: none"></iframe>`)
        let emptyFunction = () => {}, IP = ""

        let RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection
        if (!RTCPeerConnection) {
            let crrWin = iframe.currentWindow
            let RTCPeerConnection = crrWin.RTCPeerConnection || crrWin.mozRTCPeerConnection || crrWin.webkitRTCPeerConnection
        }

        // let servers = { iceServers: [{urls: "stun:stun.services.mozilla.com", sdpSemantics:'plan-b'}] }
        let servers = { iceServers: [] }
        let mediaConstraints = { optional: [{RtpDataChannels: true}] }
        let conn = new RTCPeerConnection(servers, mediaConstraints)

        conn.onicecandidate = ice => {
            if (ice || ice.candidate || ice.candidate.candidate) {
                let ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
                let IP = ip_regex.exec(ice.candidate.candidate)[1]
                
                this.localIP = IP || ""
                this.asyncCount++ // checking this oparation has been completed
                conn.close()

                conn.onicecandidate = emptyFunction
            }
        }

        conn.createOffer(conn.setLocalDescription.bind(conn), emptyFunction);
        conn.createDataChannel("")
    }

    checkDoNotTrack() {
        if (!window.navigator.doNotTrack) return ""
        return window.navigator.doNotTrack ? true : false
    }

    getTomeZone() {
        let offset = (new Date()).getTimezoneOffset()
        let hour = -Math.round(offset / 60)
        let min = Math.abs((offset % 60) * 60)
        return `${hour > 0 ? "+" : "-"}${hour < 10 ? '0'+hour : hour}:${min < 10 ? '0'+min : min}`
    }

    getDimentions() {
        return {
            "screen": {
                'height': window.screen.height || "",
                'width': window.screen.width || ""
            },
            "window": {
                'height': window.outerHeight || "",
                'width': window.outerWidth || ""
            }
        }
    }
    getOS() {
        let userAgent = navigator.oscpu || navigator.platform || navigator.userAgent;
        // order matters.
        if (/windows phone/i.test(userAgent)) return "Windows Phone"
        if (/android/i.test(userAgent)) return "Android"
        if (/iphone|ipad|ipod/i.test(userAgent) && !window.MSStream) return "IOS"
        if (/Windows/i.test(userAgent)) return "Windows"
        if (/Mac/i.test(userAgent)) return "Macintosh"
        if (/Linux/i.test(userAgent)) return "Linux"
        if (/X11/i.test(userAgent)) return "UNIX"
        if (/OpenBSD/i.test(userAgent)) return "Open BSD"

        return ""
    }
    getOSVersion() {
        let userAgent = navigator.oscpu || navigator.platform || navigator.userAgent
        let os = this.getOS()
        if (os == "Windows"){
            if (/(Windows 10.0)|(Windows NT 10.0)/i.test(userAgent)) return "10"
            if (/(Windows NT 6.2)|(WOW64)/i.test(userAgent)) return "8"
            if (/Windows NT 6.1/i.test(userAgent)) return "7"
            if (/(Windows NT 6)/i.test(userAgent)) return "Vista"
            if (/(Windows NT 5.1)|(Windows XP)/i.test(userAgent)) return "XP"
        } else if (os == "IOS") {
            if (!!window.indexedDB) { return 'iOS 8 and up'; }
            if (!!window.SpeechSynthesisUtterance) { return 'iOS 7'; }
            if (!!window.webkitAudioContext) { return 'iOS 6'; }
            if (!!window.matchMedia) { return 'iOS 5'; }
        }
    }

    getPluginNames() {
        let plugins = []
        Array.from(window.navigator.plugins).forEach(plug => {
            plugins.push(plug.name)
        })
        return plugins
    }

    getDevideMenufacturer() {
        let os = this.getOS()
        if (os == ("IOS" || "Macintosh")) return "Apple"
        return ""
    }
    getUserAgentInfo() {
        return {
            "user_agent": navigator.userAgent || "",
            "os": getOS(),
            "os_version": getOSVersion(),
            "device_brand": getDevideMenufacturer(),
            "device_model": ""
        }
    }
}

// display JSON
let instance = new DeviceInfo()
fetch("/test.php",{
    method: "POST",
    body: JSON.stringify(instance.getDataObject())
})