if (typeof (GetJob) == "undefined") { GetJob = {}; }
if (typeof (GetJob.CRM365) == "undefined") { GetJob.CRM365 = {}; }
if (typeof (GetJob.CRM365.Commons) == "undefined") { GetJob.CRM365.Commons = {}; }

GetJob.CRM365.Commons.WebApi = {
    _version: "9.1",

    _encodedApiUrl: function (entity, filter) {
        return encodeURI(GetJob.CRM365.Commons.WebApi._apiUrl(entity, filter));
    },

    _apiUrl: function(entity, filter) {
        return [
            GetJob.CRM365.Commons.Helper.getClientUrl()
            , "/api/data/v"
            , GetJob.CRM365.Commons.WebApi._version 
            , "/"
            , entity
            , (filter == null || filter == "" ? "" : filter)
        ]
        .join("");
    },

    _request: function (entity, filter, JSONBody, method, extraHeaders, sucessCallback, errorCallback) {
        var returnValue = null;

        var async = (typeof sucessCallback === "function" || typeof errorCallback === "function");

        var req = new XMLHttpRequest();
        req.open(method, GetJob.CRM365.Commons.WebApi._encodedApiUrl(entity, filter), async);
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        //req.setRequestHeader("Content-Type", "application/json; odata.metadata=minimal");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Prefer", 'odata.include-annotations="*"');
        //req.setRequestHeader("Prefer", 'return=representation');
        req.setRequestHeader("Cache-Control", "no-cache");

        if (extraHeaders) {
            for (var property in extraHeaders) {
                if (extraHeaders.hasOwnProperty(property)) {
                    req.setRequestHeader(property, extraHeaders[property]);
                }
            }
        }

        req.onreadystatechange = function () {
            if (req.readyState == req.DONE) {
                switch (this.status) {
                    case 204:
                        if (this.getResponseHeader("OData-EntityId") != null) {
                            if ((GetJob.CRM365.Commons.WebApi._apiUrl(entity)).length + 38 == this.getResponseHeader("OData-EntityId").length)
                                returnValue = this.getResponseHeader("OData-EntityId").replace(GetJob.CRM365.Commons.WebApi._apiUrl(entity) + "(", "").replace(")", "");
                            else
                                returnValue = this.getResponseHeader("OData-EntityId");
                        }
                        if (async && sucessCallback)
                            sucessCallback(returnValue);
                        break;
                    case 200:
                        var res = JSON.parse(this.response);
                        if (res.value)
                            returnValue = GetJob.CRM365.Commons.WebApi._remountJSON(res.value);
                        else
                            returnValue = GetJob.CRM365.Commons.WebApi._remountJSON(res);

                        var pagingCookie = GetJob.CRM365.Commons.WebApi._getPagingCookie(res);
                        if (pagingCookie != "")
                            returnValue.PagingCookie = pagingCookie;

                        if (async && sucessCallback)
                            sucessCallback(returnValue);
                        break;
                    case 0: break;
                    default:
                        var error = JSON.parse(this.response).error;
                        returnValue = { "error": error };

                        if (async && errorCallback)
                            errorCallback(returnValue);
                        break;
                }
            }
        };

        if (JSONBody != null && JSONBody != "")
            req.send(JSONBody);
        else
            req.send();

        if (!async)
            return returnValue;
    },

    _requestEntity: function (entityName, filter, JSONBody, method, extraHeaders, sucessCallback, errorCallback) {
        if (entityName != "")
            switch (entityName.toLowerCase().slice(-1)) {
                case "y":
                    entityName = entityName.toLowerCase().slice(0, -1) + "ies";
                    break;
                case "s":
                    entityName = entityName.toLowerCase() + "es";
                    break;
                default:
                    entityName = entityName.toLowerCase() + "s";
                    break;
            }

        return GetJob.CRM365.Commons.WebApi._request(entityName.toLowerCase(), filter, JSONBody, method, extraHeaders, sucessCallback, errorCallback);
    },

    _remountJSON: function (parsedJSON) {
        var cleanJSON = function (parsedJSON) {
            var cleanedJSON = {};

            // LOOKUP
            for (var j = 0; j < Object.keys(parsedJSON).length; j++) {
                if ((Object.keys(parsedJSON)[j].indexOf("_value@") > -1 && Object.keys(parsedJSON)[j].indexOf("lookuplogicalname") > -1) || Object.keys(parsedJSON)[j].indexOf("@Microsoft.Dynamics.CRM.lookuplogicalname") > -1) {
                    var fieldName = Object.keys(parsedJSON)[j];
                    fieldName = fieldName.indexOf("_value@") > -1 ? fieldName.substring(1, fieldName.indexOf("_value@")) : fieldName.substring(0, fieldName.indexOf("@"));

                    if (cleanedJSON[fieldName] == undefined && fieldName.charAt(0) != "_")
                        if (Object.keys(parsedJSON)[j].indexOf("_value") > -1) {
                            cleanedJSON[fieldName] = {};
                            cleanedJSON[fieldName].id = parsedJSON["_" + fieldName + "_value"];
                            cleanedJSON[fieldName].name = parsedJSON["_" + fieldName + "_value@OData.Community.Display.V1.FormattedValue"];
                            cleanedJSON[fieldName].logicalName = parsedJSON["_" + fieldName + "_value@Microsoft.Dynamics.CRM.lookuplogicalname"];
                        } else {
                            cleanedJSON[fieldName] = {};
                            cleanedJSON[fieldName].id = parsedJSON[fieldName];
                            cleanedJSON[fieldName].name = parsedJSON[fieldName + "@OData.Community.Display.V1.FormattedValue"];
                            cleanedJSON[fieldName].logicalName = parsedJSON[fieldName + "@Microsoft.Dynamics.CRM.lookuplogicalname"];
                        }
                }
            }

            // DATETIME
            // OPTIONSET
            for (var j = 0; j < Object.keys(parsedJSON).length; j++) {
                if (Object.keys(parsedJSON)[j].indexOf("@") > -1 && Object.keys(parsedJSON)[j].indexOf("@OData.Community.Display.V1.FormattedValue") > -1) {
                    var fieldName = Object.keys(parsedJSON)[j];
                    fieldName = fieldName.substring(0, fieldName.indexOf("@"));

                    if (cleanedJSON[fieldName] == undefined && fieldName.charAt(0) != "_") {
                        if (parsedJSON[fieldName].toString() == "true" || parsedJSON[fieldName].toString() == "false") {
                            cleanedJSON[fieldName] = {};
                            cleanedJSON[fieldName].name = parsedJSON[fieldName + "@OData.Community.Display.V1.FormattedValue"];
                            cleanedJSON[fieldName].value = parsedJSON[fieldName];
                        } else if (parsedJSON[fieldName] === parseInt(parsedJSON[fieldName], 10)) {
                            cleanedJSON[fieldName] = {};
                            cleanedJSON[fieldName].name = parsedJSON[fieldName + "@OData.Community.Display.V1.FormattedValue"];
                            cleanedJSON[fieldName].value = parsedJSON[fieldName];
                        }
                        else
                            cleanedJSON[fieldName] = new Date(parsedJSON[fieldName]);
                    }
                }
            }

            // OTHERS
            for (var j = 0; j < Object.keys(parsedJSON).length; j++) {
                var fieldName = Object.keys(parsedJSON)[j];

                if (Object.keys(parsedJSON)[j].indexOf("@") > -1) {
                    if (cleanedJSON[fieldName] == undefined && fieldName.charAt(0) != "_" && parsedJSON[fieldName] != null)
                        cleanedJSON[fieldName] = parsedJSON[fieldName];
                } else if (!(fieldName in cleanedJSON) && fieldName.charAt(0) != "_")
                    cleanedJSON[fieldName] = parsedJSON[fieldName];
            }

            return cleanedJSON;
        };

        if (parsedJSON.constructor === Array) {
            var remountedJSON = [];
            for (var i = 0; i < parsedJSON.length; i++) remountedJSON.push(cleanJSON(parsedJSON[i]));
            return remountedJSON;
        }

        return cleanJSON(parsedJSON);
    },

    _getPagingCookie: function (data) {
        var pagingCookie = "";
        var pagingInfo = {};
        var pageNumber = null;

        if (data["@Microsoft.Dynamics.CRM.fetchxmlpagingcookie"] != null) {
            try {
                var pageCookies = unescape(unescape(data["@Microsoft.Dynamics.CRM.fetchxmlpagingcookie"]));
                pageNumber = parseInt(pageCookies.substring(pageCookies.indexOf("=") + 1, pageCookies.indexOf("pagingcookie")).replace(/\"/g, '').trim());
                pageCookies = pageCookies.substring(pageCookies.indexOf("pagingcookie"), (pageCookies.indexOf("/>") + 12));
                pageCookies = pageCookies.substring(pageCookies.indexOf("=") + 1, pageCookies.length);
                pageCookies = pageCookies.substring(1, pageCookies.length - 1);
                pageCookies = pageCookies.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '\'').replace(/\'/g, '&' + 'quot;');
                pageCookies = "paging-cookie ='" + pageCookies + "'";
                pagingInfo.pageCookies = pageCookies;
                pagingInfo.pageNumber = pageNumber;

                pagingCookie = pagingInfo;
            } catch (e) {
                throw new Error(e);
            }
        }

        return pagingCookie;
    },

    Create: function (entityName, object) {
        return GetJob.CRM365.Commons.WebApi._requestEntity(entityName, "", JSON.stringify(object), "POST", null);
    },

    Update: function (entityName, entityGuid, object, async) {
        async = (typeof async !== 'undefined') ? async : false;
        entityGuid = entityGuid.replace('{', '').replace('}', '');

        return GetJob.CRM365.Commons.WebApi._requestEntity(entityName, "(" + entityGuid + ")", JSON.stringify(object), "PATCH", null, async);
    },

    UpdateAsync: function (entityName, entityGuid, object, successCallback, errorCallback) {
        entityGuid = entityGuid.replace('{', '').replace('}', '');

        return GetJob.CRM365.Commons.WebApi._requestEntity(entityName, "(" + entityGuid + ")", JSON.stringify(object), "PATCH", null, successCallback, errorCallback);
    },

    UpdateWithReturnedData: function (entityName, entityGuid, object) {
        var aditionalHeaders = { Prefer: "return=representation" };
        entityGuid = entityGuid.replace('{', '').replace('}', '');
        return GetJob.CRM365.Commons.WebApi._requestEntity(entityName, "(" + entityGuid + ")", JSON.stringify(object), "PATCH", aditionalHeaders)
    },

    RetrieveMultiple: function (entityName, filter, async) {
        async = (typeof async !== 'undefined') ? async : false;
        return GetJob.CRM365.Commons.WebApi._requestEntity(entityName, filter, "", "GET", null, null, null);
    },

    RetrieveMultipleAsync: function (entityName, filter, sucessCallback, errorCallback) {
        return GetJob.CRM365.Commons.WebApi._requestEntity(entityName, filter, "", "GET", null, sucessCallback, errorCallback);
    },

    Retrieve: function (entityName, entityGuid, filter) {
        entityGuid = entityGuid.replace('{', '').replace('}', '');
        return GetJob.CRM365.Commons.WebApi._requestEntity(entityName, "(" + entityGuid + ")" + (filter != undefined ? filter : ""), "", "GET", false);
    },

    RetrieveAsync: function (entityName, entityGuid, filter, sucessCallback, errorCallback) {
        entityGuid = entityGuid.replace('{', '').replace('}', '');
        return GetJob.CRM365.Commons.WebApi._requestEntity(entityName, "(" + entityGuid + ")" + (filter != undefined ? filter : ""), "", "GET", false, sucessCallback, errorCallback);
    },

    Action: function (actionName, object) {
        return GetJob.CRM365.Commons.WebApi._request(actionName, "", JSON.stringify(object), "POST", null, false);
    },

    ActionAsync: function (actionName, object, successCallback, errorCallback) {
        return GetJob.CRM365.Commons.WebApi._request(actionName, "", JSON.stringify(object), "POST", null, successCallback, errorCallback);
    },

    ExecWorkFlow: function (workflowid, entityid) {
        var query = "workflows(" + workflowid + ")/Microsoft.Dynamics.CRM.ExecuteWorkflow";
        var data = { "EntityId": entityid };

        return GetJob.CRM365.Commons.WebApi._request(query, "", JSON.stringify(data), "POST", null, false);
    },

    ExecuteCRM: function (entityName, entityGuid, object, execName, async) {
        async = (typeof async !== 'undefined') ? async : false;
        entityGuid = entityGuid.replace('{', '').replace('}', '');

        return GetJob.CRM365.Commons.WebApi._requestEntity(entityName, "(" + entityGuid + ")/" + execName, JSON.stringify(object), "POST", null, async);
    },

    ExecuteCRMDirect: function (object, execName, async) {
        async = (typeof async !== 'undefined') ? async : false;
        return GetJob.CRM365.Commons.WebApi._requestEntity("", execName, JSON.stringify(object), "POST", null, async);
    },

    Delete: function (entityName, entityGuid) {
        entityGuid = entityGuid.replace('{', '').replace('}', '');
        return GetJob.CRM365.Commons.WebApi._requestEntity(entityName, "(" + entityGuid + ")", null, "Delete", null, null, null);
    },

    GetGlobalOptionSetDefinitions: function (optionSet) {
        var url = GetJob.CRM365.Commons.WebApi._apiUrl("GlobalOptionSetDefinitions") + "(Name=" + "\'" + optionSet + "\'" + ")";
        var returnValue = null;
        var req = new XMLHttpRequest();
        req.open("GET", encodeURI(url), false);
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Prefer", 'odata.include-annotations="*"');
        req.setRequestHeader("Cache-Control", "no-cache");

        req.onreadystatechange = function () {
            if (req.readyState == req.DONE) {
                switch (this.status) {
                    case 204:
                        if ((GetJob.CRM365.Commons.WebApi._apiUrl(entity)).length + 38 == getResponseHeader("OData-EntityId").length)
                            returnValue = getResponseHeader("OData-EntityId").replace(GetJob.CRM365.Commons.WebApi._apiUrl(entity) + "(", "").replace(")", "");
                        else
                            returnValue = getResponseHeader("OData-EntityId");
                        break;
                    case 200:
                        var res = JSON.parse(this.response);
                        if (res.value)
                            returnValue = GetJob.CRM365.Commons.WebApi._remountJSON(res.value);
                        else
                            returnValue = GetJob.CRM365.Commons.WebApi._remountJSON(res);

                        var pagingCookie = GetJob.CRM365.Commons.WebApi._getPagingCookie(res);
                        if (pagingCookie != "")
                            returnValue.PagingCookie = pagingCookie;
                        break;
                    case 0: break;
                    default:
                        var error = JSON.parse(this.response).error;
                        returnValue = { "error": error };
                        break;
                }
            }
        };
        req.send();
        return returnValue;
    }
}