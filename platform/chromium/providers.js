/**
 * Generic Base Provider
 *
 * @class
 */
/* exported BaseProvider */
class BaseProvider
{
    constructor()
    {
        this._key        = "";
        this._pattern    = /.*/;
        this._name       = "";
        this._type       = "";
    }

    /**
     * Get the Provider's key
     *
     * @returns {string}
     */
    get key()
    {
        return this._key;
    }

    /**
     * Get the Provider's type
     *
     * @returns {string}
     */
    get type()
    {
        let types = {
            "analytics":    "Analytics",
            "testing":      "UX Testing",
            "tagmanager":   "Tag Manager"
        };
        return types[this._type] || "Unknown";
    }

    /**
     * Get the Provider's RegExp pattern
     *
     * @returns {RegExp}
     */
    get pattern()
    {
        return this._pattern;
    }

    /**
     * Get the Provider's name
     *
     * @returns {string}
     */
    get name()
    {
        return this._name;
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {};
    }

    /**
     * Check if this provider should parse the given URL
     *
     * @param {string}  rawUrl   A URL to check against
     *
     * @returns {Boolean}
     */
    checkUrl(rawUrl)
    {
        return this.pattern.test(rawUrl);
    }

    /**
     * Parse a given URL into human-readable output
     *
     * @param {string}  rawUrl      A URL to check against
     * @param {string}  postData    POST data, if applicable
     *
     * @return {{provider: {name: string, key: string, type: string}, data: Array}}
     */
    parseUrl(rawUrl, postData = "")
    {
        let url = new URL(rawUrl),
            data = [],
            params = new URLSearchParams(url.search);

        // Handle POST data first, if applicable (treat as query params)
        if(typeof postData === "string" && postData !== "")
        {
            let keyPairs = postData.split("&");
            keyPairs.forEach((keyPair) => {
                let splitPair = keyPair.split("=");
                params.append(splitPair[0], splitPair[1] || "");
            });
        }

        for(let param of params)
        {
            let key = param[0],
                value = param[1],
                result = this.handleQueryParam(key, value);
            if(typeof result === "object") {
                data.push(result);
            }
        }

        let customData = this.handleCustom(url);
        if(typeof customData === "object" && customData !== null)
        {
            if(customData.length) {
                data = data.concat(customData);
            } else {
                data.push(customData);
            }
        }

        return {
            "provider": {
                "name": this.name,
                "key":  this.key,
                "type": this.type
            },
            "data": data
        };
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     * @returns {{}}
     */
    handleQueryParam(name, value)
    {
        let param = this.keys[name] || {};
        return {
            "key":   name,
            "field": param.name || name,
            "value": value,
            "group": param.group || "Other"
        };
    }

    /**
     * Parse custom properties for a given URL
     *
     * @returns {void}
     */
    handleCustom( )
    {

    }
}
/**
 * Omnibug Provider Factory
 *
 * @type {{addProvider, getProviders, checkUrl, getProviderForUrl, parseUrl, defaultPattern}}
 */
/* exported OmnibugProvider */
var OmnibugProvider = (function() {

    var providers = {},
        defaultPattern = [],
        defaultPatternRegex = new RegExp();

    /**
     * Return the provider for a specified url
     *
     * @param url
     *
     * @returns {typeof BaseProvider}
     */
    let getProviderForUrl = (url) => {
        for(let provider in providers) {
            if(!providers.hasOwnProperty(provider)) {
                continue;
            }
            if(providers[provider].checkUrl(url)) {
                return providers[provider];
            }
        }
        return new BaseProvider();
    };

    return {

        /**
         * Add a new provider
         *
         * @param {typeof BaseProvider} provider
         */
        "addProvider": (provider) => {
            providers[provider.key] = provider;
            defaultPattern.push(provider.pattern);
            defaultPatternRegex = new RegExp(defaultPattern.map((el) => {
                return el.source;
            }).join("|"));
        },

        /**
         * Returns a list of all added providers
         *
         * @returns {{}}
         */
        "getProviders": () => {
            return providers;
        },

        /**
         * Checks if a URL should be parsed or not
         *
         * @param {string}  url   URL to check against
         *
         * @returns {boolean}
         */
        "checkUrl": (url) => {
            return defaultPatternRegex.test(url);
        },

        /**
         * Return the provider for a specified url
         *
         * @param url
         *
         * @returns {typeof BaseProvider}
         */
        "getProviderForUrl": getProviderForUrl,

        /**
         * Parse a URL into a JSON object
         *
         * @param {string}  url         URL to be parsed
         * @param {string}  postData    POST data, if applicable
         *
         * @returns {{provider, data}}
         */
        "parseUrl": (url, postData = "") => {
            return getProviderForUrl(url).parseUrl(url, postData);
        },

        /**
         * Return the patterns for all (enabled) providers
         *
         * @param   {void|[]}  enabledProviders    Providers that are enabled
         *
         * @returns {RegExp}
         */
        "getPattern": (enabledProviders) => {
            if(!enabledProviders || !enabledProviders.length) {
                return defaultPatternRegex;
            }

            let patterns = [];
            enabledProviders.forEach((provider) => {
                if(providers[provider]) {
                    patterns.push(providers[provider].pattern.source);
                }
            });
            return new RegExp(patterns.join("|"));
        }
    };
})();
/**
 * Adobe Analytics
 * http://www.adobe.com/data-analytics-cloud/analytics.html
 *
 * @class
 * @extends BaseProvider
 */
class AdobeAnalyticsProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "ADOBEANALYTICS";
        this._pattern    = /\/b\/ss\/|\.2o7\.net\/|\.sc\d?\.omtrdc\.net\//;
        this._name       = "Adobe Analytics";
        this._type       = "analytics";
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "ns": {
                "name": "Visitor namespace",
                "group": "General"
            },
            "ndh": {
                "name": "Image sent from JS?",
                "group": "General"
            },
            "ch": {
                "name": "Channel",
                "group": "General"
            },
            "v0": {
                "name": "Campaign",
                "group": "General"
            },
            "r": {
                "name": "Referrer URL",
                "group": "General"
            },
            "ce": {
                "name": "Character set",
                "group": "General"
            },
            "cl": {
                "name": "Cookie lifetime",
                "group": "General"
            },
            "g": {
                "name": "Current URL",
                "group": "General"
            },
            "j": {
                "name": "JavaScript version",
                "group": "General"
            },
            "bw": {
                "name": "Browser width",
                "group": "General"
            },
            "bh": {
                "name": "Browser height",
                "group": "General"
            },
            "s": {
                "name": "Screen resolution",
                "group": "General"
            },
            "c": {
                "name": "Screen color depth",
                "group": "General"
            },
            "ct": {
                "name": "Connection type",
                "group": "General"
            },
            "p": {
                "name": "Netscape plugins",
                "group": "General"
            },
            "k": {
                "name": "Cookies enabled?",
                "group": "General"
            },
            "hp": {
                "name": "Home page?",
                "group": "General"
            },
            "pid": {
                "name": "Page ID",
                "group": "General"
            },
            "pidt": {
                "name": "Page ID type",
                "group": "General"
            },
            "oid": {
                "name": "Object ID",
                "group": "General"
            },
            "oidt": {
                "name": "Object ID type",
                "group": "General"
            },
            "ot": {
                "name": "Object tag name",
                "group": "General"
            },
            "pe": {
                "name": "Link type",
                "group": "General"
            },
            "pev1": {
                "name": "Link URL",
                "group": "General"
            },
            "pev2": {
                "name": "Link name",
                "group": "General"
            },
            "pev3": {
                "name": "Video milestone",
                "group": "General"
            },
            "cc": {
                "name": "Currency code",
                "group": "General"
            },
            "t": {
                "name": "Browser time",
                "group": "General"
            },
            "v": {
                "name": "Javascript-enabled browser?",
                "group": "General"
            },
            "pccr": {
                "name": "Prevent infinite redirects",
                "group": "General"
            },
            "vid": {
                "name": "Visitor ID",
                "group": "General"
            },
            "vidn": {
                "name": "New visitor ID",
                "group": "General"
            },
            "fid": {
                "name": "Fallback Visitor ID",
                "group": "General"
            },
            "mid": {
                "name": "Marketing Cloud Visitor ID",
                "group": "General"
            },
            "aid": {
                "name": "Legacy Visitor ID",
                "group": "General"
            },
            "cdp": {
                "name": "Cookie domain periods",
                "group": "General"
            },
            "pageName": {
                "name": "Page name",
                "group": "General"
            },
            "pageType": {
                "name": "Page type",
                "group": "General"
            },
            "server": {
                "name": "Server",
                "group": "General"
            },
            "events": {
                "name": "Events",
                "group": "General"
            },
            "products": {
                "name": "Products",
                "group": "General"
            },
            "purchaseID": {
                "name": "Purchase ID",
                "group": "General"
            },
            "state": {
                "name": "Visitor state",
                "group": "General"
            },
            "vmk": {
                "name": "Visitor migration key",
                "group": "General"
            },
            "vvp": {
                "name": "Variable provider",
                "group": "General"
            },
            "xact": {
                "name": "Transaction ID",
                "group": "General"
            },
            "zip": {
                "name": "ZIP/Postal code",
                "group": "General"
            },
            "rsid": {
                "name": "Report Suites",
                "group": "General"
            }
        };
    }

    /**
     * Parse a given URL into human-readable output
     *
     * @param {string}  rawUrl   A URL to check against
     * @param {string}  postData    POST data, if applicable
     *
     * @return {{provider: {name: string, key: string, type: string}, data: Array}}
     */
    parseUrl(rawUrl, postData = "")
    {
        let url = new URL(rawUrl),
            data = [],
            stacked = [],
            params = new URLSearchParams(url.search);

        // Handle POST data first, if applicable (treat as query params)
        if(typeof postData === "string" && postData !== "")
        {
            let keyPairs = postData.split("&");
            keyPairs.forEach((keyPair) => {
                let splitPair = keyPair.split("=");
                params.append(splitPair[0], splitPair[1] || "");
            });
        }

        for(let param of params)
        {
            let key = param[0],
                value = param[1];

            // Stack context data params
            if (/\.$/.test(key)) {
                stacked.push(key);
                continue;
            }
            if (/^\./.test(key)) {
                stacked.pop();
                continue;
            }

            let stackedParam = stacked.join("") + key,
                result = this.handleQueryParam(stackedParam, value);
            if(typeof result === "object") {
                data.push(result);
            }
        }

        let customData = this.handleCustom(url);
        if(typeof customData === "object" && customData !== null)
        {
            if(customData.length) {
                data = data.concat(customData);
            } else {
                data.push(customData);
            }
        }

        return {
            "provider": {
                "name": this.name,
                "key":  this.key,
                "type": this.type
            },
            "data": data
        };
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     *
     * @returns {void|{}}
     */
    handleQueryParam(name, value)
    {
        let result = {};
        if(/^(?:c|prop)(\d+)$/i.test(name)) {
            result = {
                "key":   name,
                "field": "prop" + RegExp.$1,
                "value": value,
                "group": "Custom Traffic Variables (props)"
            };
        } else if(/^(?:v|eVar)(\d+)$/i.test(name) && name !== "v0") {
            result = {
                "key":   name,
                "field": "eVar" + RegExp.$1,
                "value": value,
                "group": "Custom Conversion Variables (eVars)"
            };
        } else if(/^(?:h|hier)(\d+)$/i.test(name)) {
            result = {
                "key":   name,
                "field": "Hierarchy " + RegExp.$1,
                "value": value,
                "group": "Hierarchy Variables"
            };
        } else if(name.indexOf(".a.media.") > 0) {
            result = {
                "key":   name,
                "field": name.split(".").pop(),
                "value": value,
                "group": "Media Module"
            };
        } else if(name.indexOf(".a.activitymap.") > 0) {
            result = {
                "key":   name,
                "field": name.split(".").pop(),
                "value": value,
                "group": "Activity Map"
            };
        } else if(name.indexOf(".") > 0) {
            result = {
                "key":   name,
                "field": name.split(".").pop(),
                "value": value,
                "group": "Context Data"
            };
        } else if(/^(AQB|AQE)$/i.test(name)) {
            // ignore
            return;
        } else {
            result = super.handleQueryParam(name, value);
        }
        return result;
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param {string} url
     *
     * @returns {Array}
     */
    handleCustom(url)
    {
        let results = [],
            rsid = url.pathname.match(/\/b\/ss\/([^\/]+)\//);
        if(rsid) {
            results.push({
                "key":   "rsid",
                "field": this.keys.rsid ? this.keys.rsid.name : "Report Suites",
                "value": rsid[1],
                "group": this.keys.rsid ? this.keys.rsid.group : "General",
            });
        }
        return results;
    }
}
OmnibugProvider.addProvider(new AdobeAnalyticsProvider());
/**
 * Adobe Target
 * http://www.adobe.com/marketing-cloud/target.html
 *
 * @class
 * @extends BaseProvider
 */
class AdobeTargetProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "ADOBETARGET";
        this._pattern    = /\.tt\.omtrdc\.net\//;
        this._name       = "Adobe Target";
        this._type       = "testing";
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "mbox": {
                "name": "Mbox Name",
                "group": "General"
            },
            "mboxType": {
                "name": "Mbox Type"
            },
            "mboxCount": {
                "name": "Mbox Count"
            },
            "mboxId": {
                "name": "Mbox ID"
            },
            "mboxSession": {
                "name": "Mbox Session"
            },
            "mboxPC": {
                "name": "Mbox PC ID"
            },
            "mboxPage": {
                "name": "Mbox Page ID"
            },
            "clientCode": {
                "name": "Client Code"
            },
            "mboxHost": {
                "name": "Page Host"
            },
            "mboxURL": {
                "name": "Page URL"
            },
            "mboxReferrer": {
                "name": "Page Referrer"
            },
            "screenHeight": {
                "name": "Screen Height"
            },
            "screenWidth": {
                "name": "Screen Width"
            },
            "browserWidth": {
                "name": "Browser Width"
            },
            "browserHeight": {
                "name": "Browser Height"
            },
            "browserTimeOffset": {
                "name": "Browser Timezone Offset"
            },
            "colorDepth": {
                "name": "Browser Color Depth"
            },
            "mboxXDomain": {
                "name": "CrossDomain Enabled"
            },
            "mboxTime": {
                "name": "Timestamp"
            },
            "mboxVersion": {
                "name": "Library Version"
            }
        };
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param {string} url
     *
     * @returns {Array}
     */
    handleCustom(url)
    {
        let matches =  url.pathname.match( /\/([^\/]+)\/mbox\/([^\/?]+)/ ),
            results = [];
        if(matches !== null && matches.length === 3) {
            results.push({
                "key":   "clientCode",
                "field": "Client Code",
                "value": matches[1],
                "group": "General"
            });
            results.push({
                "key":   "mboxType",
                "field": "Mbox Type",
                "value": matches[2],
                "group": "General"
            });
        }
        return results;
    }
}
OmnibugProvider.addProvider(new AdobeTargetProvider());