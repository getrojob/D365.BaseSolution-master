/// <reference path="/Commons/js/webapi.js" />

if (typeof (GetJob) == "undefined") { var GetJob = {}; }
if (typeof (GetJob.CRM365) == "undefined") { GetJob.CRM365 = {}; }
if (typeof (GetJob.CRM365.Commons) == "undefined") { GetJob.CRM365.Commons = {}; }

GetJob.CRM365.Commons.Helper = {
    FORM_FACTOR: {
        "Unknown": 0,
        "Desktop": 1,
        "Tablet": 2,
        "Phone": 3
    },
    guidsAreEqual: function (guid1, guid2) {
        if (guid1 == null || guid2 == null)
            return false;

        return (guid1.replace(/[{}]/g, "").toLowerCase() == guid2.replace(/[{}]/g, "").toLowerCase());
    },

    generateGuid: function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    },

    setLookupWithTeam: function (userId, ownerAttribute) {
        if (ownerAttribute == null)
            throw new Error("FieldAttribute required on 'fillOwnerWithTeam'");

        var response = GetJob.CRM365.Commons.Helper.getTeamsAdministeredBy(userId.replace("{", "").replace("}", ""));

        if (response != null && response.length > 0) {
            var lookup = GetJob.CRM365.Commons.Helper.createLookup(response[0].teamid, "team", response[0].name);
            ownerAttribute.setValue(lookup);
        }
    },

    addCustomViewByUserRoleForSystemuserLookup: function (systemuserlookupAttribute, index, userRolesCollection) {
        var filter = "";
        var roles = userRolesCollection.split(";");
        if (roles.length > 1) {
            for (var i = 0; i < roles.length; i++)
                filter += "<condition attribute='name' operator='eq' value='" + roles[i] + "' /> ";

            filter = "<filter type='or'> " + filter + "</filter> ";
        } else
            filter = "<condition attribute='name' operator='eq' value='" + userRolesCollection + "' /> ";

        var viewId = "{00000000-0000-0000-0000-00000000000" + index + "}";
        var entityName = "systemuser";
        var viewDisplayName = "Systemuser Lookup Custom View";

        var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>" +
            "<entity name='systemuser'>" +
            "<attribute name='fullname' />" +
            "<attribute name='businessunitid' />" +
            "<attribute name='internalemailaddress'/>" +
            "<attribute name='systemuserid' />" +
            "<order attribute='fullname' descending='false' />" +
            "<filter type='and'>" +
            "<condition attribute='isdisabled' operator='eq' value='0' />" +
            "</filter>" +
            "<link-entity name='systemuserroles' from='systemuserid' to='systemuserid' visible='false' intersect='true'> " +
            "<link-entity name='role' from='roleid' to='roleid' alias='aa'> " +
            "<filter type='and'> " +

            filter +

            "</filter> " +
            "</link-entity> " +
            "</link-entity> " +
            "</entity>" +
            "</fetch>";

        var layoutXml = "<grid name='resultset' " +

            "object='1' " +
            "jump='name' " +
            "select='1' " +
            "icon='1' " +
            "preview='1'>" +
            "<row name='result' " +
            "id='systemuserid'>" +
            "<cell name='fullname' " +
            "width='200' />" +
            "<cell name='businessunitid' " +
            "width='100' />" +
            "<cell name='internalemailaddress' " +
            "width='200' />" +
            "</row>" +
            "</grid>";

        systemuserlookupAttribute.addCustomView(viewId, entityName, viewDisplayName, fetchXml, layoutXml, true);
        systemuserlookupAttribute.setDefaultView(viewId);
    },

    chkCpf: function (valor) {
        var strcpf = valor;
        var str_aux = "";

        if (Xrm.Page.ui.clearFormNotification) {
            Xrm.Page.ui.clearFormNotification("chkCpfNotification");
        }

        for (i = 0; i <= strcpf.length - 1; i++) {
            if ((strcpf.charAt(i)).match(/\d/))
                str_aux = str_aux + strcpf.charAt(i);
            else if (!(strcpf.charAt(i)).match(/[\.\-]/)) {
                if (Xrm.Page.ui.setFormNotification) {
                    Xrm.Page.ui.setFormNotification("Invalid CPF. Invalid characters.", "ERROR", "chkCpfNotification");
                }
                else {
                    Xrm.Utility.alertDialog("Invalid CPF. Invalid characters.");
                }
                return false;
            }
        }

        if (str_aux.length != 11) {
            if (Xrm.Page.ui.setFormNotification) {
                Xrm.Page.ui.setFormNotification("Invalid CPF. Invalid digits quantity.", "ERROR", "chkCpfNotification");
            }
            else {
                Xrm.Utility.alertDialog("Invalid CPF. Invalid digits quantity.");
            }
            return false;
        }

        soma1 = soma2 = 0;
        for (i = 0; i <= 8; i++) {
            soma1 = soma1 + str_aux.charAt(i) * (10 - i);
            soma2 = soma2 + str_aux.charAt(i) * (11 - i);
        }

        d1 = ((soma1 * 10) % 11) % 10;
        d2 = (((soma2 + (d1 * 2)) * 10) % 11) % 10;
        if ((d1 != str_aux.charAt(9)) || (d2 != str_aux.charAt(10))) {
            if (Xrm.Page.ui.setFormNotification) {
                Xrm.Page.ui.setFormNotification("Invalid CPF.", "ERROR", "chkCpfNotification");
            }
            else {
                Xrm.Utility.alertDialog("Invalid CPF.");
            }
            return false;
        }
        return true;
    },

    chkCnpj: function (valor) {
        if (valor != null) {
            while (valor.indexOf(".") != -1) {
                valor = valor.replace('.', '');
            }
            while (valor.indexOf("-") != -1) {
                valor = valor.replace('-', '');
            }
            while (valor.indexOf("/") != -1) {
                valor = valor.replace('/', '');
            }
            while (valor.indexOf("\\") != -1) {
                valor = valor.replace('\\', '');
            }
        }

        if (Xrm.Page.ui.clearFormNotification) {
            Xrm.Page.ui.clearFormNotification("chkCnpjNotification");
        }

        if (valor.length < 14) {
            if (Xrm.Page.ui.setFormNotification) {
                Xrm.Page.ui.setFormNotification("Invalid CNPJ. Invalid digits quantity.", "ERROR", "chkCnpjNotification");
            }
            else {
                Xrm.Utility.alertDialog("Invalid CNPJ. Invalid digits quantity.");
            }
        }

        try {
            var i;
            var c = valor.substr(0, 12);
            var dv = valor.substr(12, 2);
            var d1 = 0;


            for (i = 0; i < 12; i++) {
                d1 += c.charAt(11 - i) * (2 + (i % 8));
            }

            if (d1 == 0) {
                if (Xrm.Page.ui.setFormNotification) {
                    Xrm.Page.ui.setFormNotification("Invalid CNPJ. Invalid digits quantity.", "ERROR", "chkCnpjNotification");
                }
                else {
                    Xrm.Utility.alertDialog("Invalid CNPJ. Invalid digits quantity.");
                }
                return false;
            }

            d1 = 11 - (d1 % 11);

            if (d1 > 9) d1 = 0;

            if (dv.charAt(0) != d1) {
                if (Xrm.Page.ui.setFormNotification) {
                    Xrm.Page.ui.setFormNotification("Invalid CNPJ.", "ERROR", "chkCnpjNotification");
                }
                else {
                    Xrm.Utility.alertDialog("Invalid CNPJ.");
                }
                return false;
            }

            d1 *= 2;
            for (i = 0; i < 12; i++) {
                d1 += c.charAt(11 - i) * (2 + ((i + 1) % 8));
            }

            d1 = 11 - (d1 % 11);
            if (d1 > 9) d1 = 0;
            if (dv.charAt(1) != d1) {
                if (Xrm.Page.ui.setFormNotification) {
                    Xrm.Page.ui.setFormNotification("Invalid CNPJ.", "ERROR", "chkCnpjNotification");
                }
                else {
                    Xrm.Utility.alertDialog("Invalid CNPJ.");
                }
                return false;
            }
            return true;
        }
        catch (e) {
            if (Xrm.Page.ui.setFormNotification) {
                Xrm.Page.ui.setFormNotification("Invalid CNPJ.", "ERROR", "chkCnpjNotification");
            }
            else {
                Xrm.Utility.alertDialog("Invalid CNPJ.");
            }
            return false;
        }
    },

    createLookup: function (entityId, entityType, name) {
        var lookup = new Array();
        lookup[0] = new Object();
        lookup[0].id = entityId;
        lookup[0].name = name;
        lookup[0].entityType = entityType;

        return lookup;
    },

    returnTeamsByUser: function (userId) {
        return GetJob.CRM365.Commons.WebApi.Retrieve("systemuser", userId, "/teammembership_association");
    },

    getTeamsAdministeredBy: function (userId) {
        if (!userId)
            return null;

        userId = userId.replace("{", "").replace("}", "");

        return GetJob.CRM365.Commons.WebApi.RetrieveMultiple("team", "?$filter=isdefault eq false and _administratorid_value eq " + userId);
    },

    getAsyncTeamsAdministeredBy: function (userId) {

        return new Promise(function (resolve, reject) {
            if (!userId)
                reject("UserId required");

            userId = userId.replace("{", "").replace("}", "");

            try {
                GetJob.CRM365.Commons.WebApi.RetrieveMultipleAsync("team", "?$filter=isdefault eq false and _administratorid_value eq " + userId,
                    function (data) {
                        resolve(data);
                    },
                    function (error) {
                        reject(error);
                    });
            }
            catch (e) {
                reject(e);
            }
        });
    },

    userHasRoleId: function (roleList, roleId) {
        if (roleList == null)
            throw new Error("Role List is required");

        for (var i = 0; i < roleList.length; i++) {
            if (roleList[i].toLowerCase() == roleId.toLowerCase())
                return true;
        }

        return false;
    },

    getLookupUer: function () {
        var lookup = new Array();
        lookup[0] = new Object();
        lookup[0].id = Xrm.Page.context.getUserId();
        lookup[0].name = Xrm.Page.context.getUserName();
        lookup[0].entityType = "systemuser";

        return lookup;
    },

    userHasRoles: function (roles, userId) {
        if (!userId) {
            userId = Xrm.Page.context.getUserId();
        }

        var rolesAssociation = GetJob.CRM365.Commons.WebApi.Retrieve("systemuser", userId, "/systemuserroles_association?$select=name");

        if (typeof roles == "string") {
            for (var i = 0; i < rolesAssociation.length; i++) {
                if (rolesAssociation[i].name == roles)
                    return true;
            }
        }
        else {
            for (var i = 0; i < roles.length; i++) {
                for (var ii = 0; ii < rolesAssociation.length; ii++) {
                    if (rolesAssociation[ii].name == roles[i])
                        return true;
                }
            }
        }

        return false;
    },

    teamHasRole: function (teamId, roleName) {
        var rolesAssociation = GetJob.CRM365.Commons.WebApi.Retrieve("systemuser", teamId, "/teammembership_association?$select=name");

        for (var i = 0; i < rolesAssociation.length; i++) {
            if (rolesAssociation[i].name == roleName)
                return true;
        }

        return false;
    },

    userAndTeamsHasRole: function (userId, roleName) {
        //TODO check if any team related to userId user has the role associated with it
    },

    checkLeadProspectLimit: function (teamId, economicGroupId) {
        var parametro = {};
        parametro.teamid = teamId.replace(/[{}]/g, "");
        parametro.economicgroupid = economicGroupId.replace(/[{}]/g, "");

        try {
            var response = GetJob.CRM365.Commons.WebApi.Action("btg_checkLeadProspectLimit", parametro);

            if (response == null)
                return "CheckLeadProspectLimit error. Response is null.";

            if (response.error != null)
                return response.error.code + "-" + response.error.message;

            if (response.passedlimit)
                return 1;
            else
                return 0;
        }
        catch (e) {
            console.log("checkLeadProspectLimit " + e.message);
        }
    },

    /// Example of usage on Dynamics CRM Parameters : 
    /// false,"regardingobjectid",["contact", "account", "btg_economicgroup", "lead"]
    /// If you don't clear the field, remember to ensure that the field is not setted with some entityType that is being cleared, otherwise will throw exception
    /// If you need some custom function to set a default value on field, like owner field, ensure that the custom function is executed before this
    filterEntitiesInLookup: function (clearField, fieldName, entitiesNameArray) {

        if (!(typeof (clearField) === "boolean"))
            throw new Error("First parameter must be a boolean");

        if (!(typeof (fieldName) === "string"))
            throw new Error("Second parameter must be a string");

        if (!Object.prototype.toString.call(entitiesNameArray) == "[object Array]")
            throw new Error("Third parameter must be an Array");

        if (Xrm.Page.data.entity.attributes.get(fieldName) == null)
            throw new Error("Field : " + fieldName + "doesn't exist");

        if (clearField)
            Xrm.Page.data.entity.attributes.get(fieldName).setValue(null);

        try {
            //returns false if it doesnt work properly
            if (Xrm.Page.data.entity.attributes.get(fieldName).setLookupTypes) {
                if (!Xrm.Page.data.entity.attributes.get(fieldName).setLookupTypes(entitiesNameArray))
                    throw new Error("One of the entities doesn't exist : " + entitiesNameArray);
            }
            else {
                var fieldControl = Xrm.Page.ui.controls.get(fieldName);
                if (fieldControl == null)
                    throw new Error("Field : " + fieldName + "doesn't exist");

                if (fieldControl.setEntityTypes)
                    fieldControl.setEntityTypes(entitiesNameArray);
            }
        }
        catch (e) {
            console.error(e.message);
        }
    },

    setTeamWithTeamUserLoggedInLookup: function (lookupName) {
        if (Xrm.Page.data.entity.getId() == "") {
            GetJob.CRM365.Commons.Helper.setLookupWithTeam(Xrm.Page.context.getUserId(), Xrm.Page.data.entity.attributes.get(lookupName));
        }
    },

    getUserByTeamName: function (name) {
        var oUser = GetJob.CRM365.Commons.WebApi.RetrieveMultiple("systemuser", "?$filter=fullname eq '" + name + "'");
        if (oUser.length > 0)
            return oUser[0];

        return null;
    },

    getConfigurationValueByKey: function (key) {
        var config = GetJob.CRM365.Commons.WebApi.RetrieveMultiple("btg_configuration", "?$filter=btg_name eq '" + key + "'&$select=btg_value");
        if (config.error)
            throw new Error("Error on configuration retrieve : " + config.error.message);

        if (config.length == 0)
            throw new Error("Configuration key : " + key + " not found.");

        if (config.length > 1)
            throw new Error("Duplicated Configuration Key");

        return config[0].btg_value;
    },

    preventTabCollapse: function (event) {
        var tabName = (function () {
            if (event
                && event.getEventSource
                && event.getEventSource().getName) {
                return event.getEventSource().getName();
            }
            else {
                return "";
            }
        })();

        if (Xrm
            && Xrm.Page
            && Xrm.Page.ui
            && Xrm.Page.ui.tabs
            && Xrm.Page.ui.tabs.get
            && Xrm.Page.ui.tabs.get(tabName)
            && Xrm.Page.ui.tabs.get(tabName).getDisplayState
            && Xrm.Page.ui.tabs.get(tabName).getDisplayState() == "expanded"
            && Xrm.Page.ui.tabs.get(tabName).setDisplayState) {
            setTimeout(function () { Xrm.Page.ui.tabs.get(tabName).setDisplayState('expanded'); }, 1);

            return false;
        }
    },

    setFieldsRequiredLevel: function (fields, requiredLevel) {
        var arrFields = fields.split(";");
        for (i = 0; i < arrFields.length; i++) {
            var field = arrFields[i];
            if (Xrm.Page.ui.controls.get(field) != null && Xrm.Page.ui.controls.get(field) != undefined) {
                if (Xrm.Page.ui.controls.get(field).getVisible() == true)
                    Xrm.Page.data.entity.attributes.get(field).setRequiredLevel(requiredLevel);
                else
                    Xrm.Page.data.entity.attributes.get(field).setRequiredLevel("none");
            }
        }
    },

    showProgressIndicator: function (message) {
        if (!message || message == null || typeof message != "string" || message.toString().trim() == "") {
            if (Xrm.Page.context.client.getClient() == "Web") {
                message = "Please wait...";
            }
            else {
                message = "";
            }
        }

        Xrm.Utility.showProgressIndicator(message);
    },

    closeProgressIndicator: function () {
        Xrm.Utility.closeProgressIndicator();
    },

    showHideLoadingFrame: function (action) {
        try {
            if (Xrm.Utility.showProgressIndicator && Xrm.Utility.closeProgressIndicator) {
                if (action == "show") {
                    Xrm.Utility.showProgressIndicator();
                }
                else {
                    Xrm.Utility.closeProgressIndicator();
                }
            }
            else {
                var $loadingFrame = document.querySelector("#containerLoadingProgress") || window.frames.parent.document.querySelector("#containerLoadingProgress");
                var $loadingText = document.querySelector("#loadingtext") || window.frames.parent.document.querySelector("#loadingtext");

                if ($loadingText) {
                    $loadingText.innerHTML = "Please wait...";
                }

                if ($loadingFrame) {
                    $loadingFrame.style.backgroundColor = "rgba(255,255,255,0.8)";

                    if (typeof (action) != undefined) {
                        if (action == "show") {
                            $loadingFrame.style.display = "block";
                        }
                        else if (action == "hide") {
                            $loadingFrame.style.display = "none";
                        }
                    }
                    else {
                        if ($loadingFrame.style.display == "block") {
                            $loadingFrame.style.display = "none";
                        }
                        else {
                            $loadingFrame.style.display = "block";
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error(e);
        }
    },

    adjustOwnerHeader: function () {
        var $headersText = (function () {
            if (document.querySelectorAll("div[id^=header][id$=_c]:not(.processStepLabel)").length) {
                return document.querySelectorAll("div[id^=header][id$=_c]:not(.processStepLabel)");
            }
            else {
                return window.parent.document.querySelectorAll("div[id^=header][id$=_c]:not(.processStepLabel)");
            }
        })();
        var $headersGradient = (function () {
            if (document.querySelectorAll("#HeaderTilesWrapperLayoutElement div[id^=header] .ms-crm-Inline-GradientMask").length) {
                return document.querySelectorAll("#HeaderTilesWrapperLayoutElement div[id^=header] .ms-crm-Inline-GradientMask");
            }
            else {
                return window.parent.document.querySelectorAll("#HeaderTilesWrapperLayoutElement div[id^=header] .ms-crm-Inline-GradientMask");
            }
        })();

        for (var i = 0; i < $headersText.length; i++) {
            $headersText[i].parentElement.style.maxWidth = "500px";
        }

        for (var i = 0; i < $headersGradient.length; i++) {
            $headersGradient[i].style.display = "none";
        }
    },

    setAllFieldsReadOnly: function (exceptions) {
        var controls = Xrm.Page.ui.controls.get();

        if (exceptions && exceptions.length) {
            controls = controls.filter(function (control) {
                for (var i = 0; i < exceptions.length; i++) {
                    if (!control.getName || exceptions[i] == control.getName()) {
                        return false;
                    }
                }

                return true;
            });
        }

        for (var i = 0; i < controls.length; i++) {
            if (controls[i].setDisabled) {
                controls[i].setDisabled(true);
            }
        }
    },

    getClientUrl: function () {
        var url = "";

        if (typeof Xrm != "undefined" && Xrm && Xrm.Page && Xrm.Page.context && Xrm.Page.context.getClientUrl) {
            url = Xrm.Page.context.getClientUrl();
        }
        else if (typeof Xrm != "undefined" && Xrm && Xrm.Utility && Xrm.Utility.getGlobalContext && Xrm.Utility.getGlobalContext().getClientUrl) {
            url = Xrm.Utility.getGlobalContext().getClientUrl();
        }
        else if (window.parent && typeof window.parent.Xrm != "undefined" && window.parent.Xrm && window.parent.Xrm.Utility && window.parent.Xrm.Utility.getGlobalContext && window.parent.Xrm.Utility.getGlobalContext().getClientUrl) {
            url = window.parent.Xrm.Utility.getGlobalContext().getClientUrl();
        }
        else {
            url = window.location.href;
        }

        return url;
    },

    getUserId: function () {
        var id = "";

        if (typeof Xrm != "undefined" && Xrm && Xrm.Utility && Xrm.Utility.getGlobalContext && Xrm.Utility.getGlobalContext().userSettings && Xrm.Utility.getGlobalContext().userSettings.userId) {
            id = Xrm.Utility.getGlobalContext().userSettings.userId;
        }
        else if (window.parent && typeof window.parent.Xrm != "undefined" && window.parent.Xrm && window.parent.Xrm.Utility && window.parent.Xrm.Utility.getGlobalContext().userSettings && window.parent.Xrm.Utility.getGlobalContext().userSettings.userId) {
            id = window.parent.Xrm.Utility.getGlobalContext().userSettings.userId;
        }

        return id;
    },

    getLookupTypes: function (attribute) {
        if (Xrm.Page.context.client.getClient() == "Web") {
            return Xrm.Page.data.entity.attributes.get(attribute).getLookupTypes();
        }
        else {
            return Xrm.Page.data.entity.attributes.get(attribute).controls.getAll()[0].getEntityTypes();
        }
    },

    buildViewUrl: function (entity, viewId, viewType) {
        if (viewType == "undefined" || viewType == null)
            viewType = "1039";

        if (viewType != "1039" && viewType != "4230")
            throw new Error("View type not allowed");

        var baseUrl = GetJob.CRM365.Commons.Helper.getClientUrl();
        return baseUrl + "/main.aspx?etn=" + entity + '&pagetype=entitylist&viewid=' + viewId + '&viewtype=' + viewType;
    },

    setUpOwnerLookup: function (adjustHeader) {
        try {
            if (!GetJob.CRM365.Commons.Helper.recordExists()) {
                setTimeout(function () {
                    var currentUserIsRm = (function () {
                        var teamsAdministered = GetJob.CRM365.Commons.Helper.getTeamsAdministeredBy(Xrm.Page.context.getUserId());

                        if (teamsAdministered && teamsAdministered.length && teamsAdministered.length > 0) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    })();

                    if (Xrm.Page.data.entity.attributes.get("ownerid") != null) {
                        if (currentUserIsRm) {
                            if (adjustHeader) {
                                GetJob.CRM365.Commons.Helper.setLookupWithTeam(Xrm.Page.context.getUserId(), Xrm.Page.getControl("header_ownerid").getAttribute());
                                Xrm.Page.getControl("header_ownerid").setDisabled(false);
                            }
                            else {
                                GetJob.CRM365.Commons.Helper.setLookupWithTeam(Xrm.Page.context.getUserId(), Xrm.Page.getControl("ownerid").getAttribute());
                                Xrm.Page.getControl("ownerid").setDisabled(false);
                            }
                        }
                        else {
                            if (adjustHeader) {
                                Xrm.Page.getControl("header_ownerid").setDisabled(false);
                            }
                            else {
                                Xrm.Page.getControl("ownerid").setDisabled(false);
                            }

                            Xrm.Page.data.entity.attributes.get("ownerid").setValue(null);
                        }
                    }

                    GetJob.CRM365.Commons.Helper.filterEntitiesInLookup(false, "ownerid", ["team"]);
                }, 300);
            }
            else {
                Xrm.Page.getControl("ownerid").setDisabled(false);
                if (adjustHeader) {
                    Xrm.Page.getControl("header_ownerid").setDisabled(false);
                }
            }
        }
        catch (e) {
            console.error(e);
        }
    },

    chkRG: function (valor) {
        var valor = valor.split("");
        tamanho = valor.length;
        vetor = new Array(tamanho);

        if (tamanho >= 1)
            vetor[0] = parseInt(valor[0]) * 2;

        if (tamanho >= 2)
            vetor[1] = parseInt(valor[1]) * 3;

        if (tamanho >= 3)
            vetor[2] = parseInt(valor[2]) * 4;

        if (tamanho >= 4)
            vetor[3] = parseInt(valor[3]) * 5;

        if (tamanho >= 5)
            vetor[4] = parseInt(valor[4]) * 6;

        if (tamanho >= 6)
            vetor[5] = parseInt(valor[5]) * 7;

        if (tamanho >= 7)
            vetor[6] = parseInt(valor[6]) * 8;

        if (tamanho >= 8)
            vetor[7] = parseInt(valor[7]) * 9;

        if (tamanho >= 9)
            vetor[8] = parseInt(valor[8]) * 100;

        total = 0;

        if (tamanho >= 1)
            total += vetor[0];

        if (tamanho >= 2)
            total += vetor[1];

        if (tamanho >= 3)
            total += vetor[2];

        if (tamanho >= 4)
            total += vetor[3];

        if (tamanho >= 5)
            total += vetor[4];

        if (tamanho >= 6)
            total += vetor[5];

        if (tamanho >= 7)
            total += vetor[6];

        if (tamanho >= 8)
            total += vetor[7];

        if (tamanho >= 9)
            total += vetor[8];

        resto = total % 11;
        if (resto != 0) {
            Xrm.Utility.alertDialog("Invalid RG.");
            return false;
        } else
            return true;
    },

    removeItenOptionSet: function (field, position) {
        for (var i = 0; i < position.length; i++) {
            Xrm.Page.ui.controls.get(field).removeOption(position[i]);
        }
    },

    //altera o label do optionset
    //"btg_scope",1,"Clients"
    changeLabelOptionSet: function (field, position, text) {
        var myOption = Xrm.Page.getAttribute(field).getOption(position);
        Xrm.Page.ui.controls.get(field).removeOption(position);
        myOption.text = text;
        Xrm.Page.getControl(field).addOption(myOption, position);
    },

    recordExists: function () {
        var result = false;

        if (Xrm && Xrm != null &&
            Xrm.Page && Xrm.Page != null &&
            Xrm.Page.data && Xrm.Page.data != null &&
            Xrm.Page.data.entity && Xrm.Page.data.entity != null &&
            Xrm.Page.data.entity.getId && Xrm.Page.data.entity.getId != null) {
            if (typeof Xrm.Page.data.entity.getId() != "undefined" &&
                Xrm.Page.data.entity.getId() != null &&
                Xrm.Page.data.entity.getId() != "" &&
                Xrm.Page.data.entity.getId() != "{00000000-0000-0000-0000-000000000000}") {
                result = true;
            }
        }

        return result;
    },

    getLookupCurrentEntityName: function (lookupControl) {
        var result = null;

        if (lookupControl.constructor.getName() == "Array") {
            lookupControl = lookupControl[0] || null;
        }

        if (lookupControl.constructor.getName() == "Mscrm.FormControls.ClientApi.XrmTurboFormControlLookup") {
            lookupControl = lookupControl.getAttribute()[0];
        }

        if (lookupControl.constructor.getName() == "Mscrm.FormControls.ClientApi.XrmTurboFormEntityAttributeLookup") {
            lookupControl = lookupControl.getValue()[0];
        }

        if (lookupControl.typename || lookupControl.entityType) {
            result = lookupControl.typename || lookupControl.entityType;
        }

        return result;
    },

    adjustControlsTabOrderLeftToRight: function () {
        if (Xrm.Page.context.client.getClient() == "Web") {
            for (var i = 0; i < Xrm.Page.ui.controls.getLength(); i++) {
                var control = Xrm.Page.ui.controls.get(i);

                if (control.getName().indexOf("header") == -1 && control.getName().indexOf("footer") == -1) {
                    var element = {}
                    for (var ii = 0; ii < top.frames.length; ii++) {
                        try {
                            if (top.frames[ii].document.getElementById(control.getName())) {
                                element = top.frames[ii].document.getElementById(control.getName());
                                break;
                            }
                        } catch (e) { }
                    }

                    if (!element)
                        return;

                    if (element.tabIndex && element.tabIndex != "0") {
                        if (element.className == 'ms-crm-Hidden-NoBehavior')
                            continue;
                        if (element.tagName == 'A') {
                            if (element.className != 'ms-crm-InlineTabHeaderText')
                                continue;
                        }
                        element.tabIndex = 1000 + (i * 10);
                    }
                }
            }
        }
    },

    officerChangedNotificated: function (entityType) {

        var context = Xrm.Utility.getGlobalContext();
        var teamPromise = GetJob.CRM365.Commons.Helper.getAsyncTeamsAdministeredBy(context.userSettings.userId);

        teamPromise.then(function (data) {
            return new Promise(function (resolve, reject) {
                if (data != null && data.length > 0)
                    resolve(data[0].teamid);
                else
                    resolve(context.userSettings.userId);
            });
        })
            .then(function (userOrTeamId) {
                return GetJob.CRM365.NotificationHub.hasOfficerHistory(Xrm.Page.data.entity.getId().replace('{', '').replace('}', ''), entityType, userOrTeamId);
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    //DEPENDENCY ON libphonenumber
    validatePhoneNumber: function (phoneNumber) {

        //TODO clean up phoneNumber to only digits
        var phoneParsed = null;
        var response = {};
        try {
            if (phoneNumber == null)
                throw new Error("PhoneNumber parameter missing");

            if (phoneNumber.startsWith("+")) {
                phoneParsed = new libphonenumber.parse(phoneNumber);
            } else {
                if (phoneNumber.startsWith("55")) {
                    phoneParsed = new libphonenumber.parse("+" + phoneNumber, "BR");
                }
                else {
                    var ddiList = new Array();
                    ddiList.push({ "initials": "BR" });
                    ddiList.push({ "initials": "NL" });
                    ddiList.push({ "initials": "US" });
                    ddiList.push({ "initials": "CL" });

                    var parsedArray = new Array();

                    for (var i = 0; i < ddiList.length; i++) {
                        var result = new libphonenumber.parse(phoneNumber, ddiList[i].initials);

                        if (result != null && result.phone != null)
                            parsedArray.push(result);
                    }

                    if (parsedArray.length >= 1) {
                        phoneParsed = parsedArray[0];
                    }

                    if (parsedArray.length > 1) {
                        response.duplicated = parsedArray;
                    }
                }
            }

            if (phoneParsed != null && phoneParsed.phone != null) {
                response.valid = true;
                response.parsed = phoneParsed;
            } else {
                response.valid = false;
            }
        }
        catch (e) {
            console.log("Error on validatePhoneNumber :" + e.message);
            response.error = e.message;
        }

        return response;
    },

    //DEPENDENCY ON libphonenumber
    validateAndFormatPhoneNumber: function (phoneNumber) {
        var validation = {};
        try {
            validation = GetJob.CRM365.Commons.Helper.validatePhoneNumber(phoneNumber);

            if (validation != null && validation.valid == true) {
                //TODO if country is from brazil and the phone doesnt start with 11 or any other ddd, add the default 11 ddd
                validation.formated = libphonenumber.format(validation.parsed, "International");

                if (validation.formated == null || validation.formated == "")
                    validation.error = "Error formating phonenumber " + phoneNumber;
            }
        }
        catch (e) {
            validation.error = e.message;
        }

        return validation;
    },

    //DEPENDENCY ON libphonenumber
    validateAndFormatPhoneNumberFromField: function (fieldName) {
        try {
            if (!(typeof (fieldName) === "string"))
                throw new Error("Parameter must be a string");

            if (Xrm.Page.data.entity.attributes.get(fieldName) == null)
                throw new Error("Field : " + fieldName + " not found");

            var phoneNumber = Xrm.Page.data.entity.attributes.get(fieldName).getValue();

            if (phoneNumber == null || phoneNumber == "")
                return;

            var response = GetJob.CRM365.Commons.Helper.validateAndFormatPhoneNumber(phoneNumber);

            if (response.error)
                throw new Error("Error on validateAndFormatPhoneNumber " + response.error);

            if (response.valid == true) {
                Xrm.Page.getControl(fieldName).clearNotification();
                Xrm.Page.data.entity.attributes.get(fieldName).setValue(response.formated);
            } else {
                Xrm.Page.getControl(fieldName).setNotification("The phone " + phoneNumber + " is invalid");
                Xrm.Page.data.entity.attributes.get(fieldName).setValue("");
            }
        }
        catch (e) {
            console.log(e.message);
        }
    },

    changeStyleRequiredFields: function () {
        var alert = top.frames[0].document.getElementById("titlefooter_statuscontrol");

        if (alert) {
            alert.style.color = "black";
            alert.style.backgroundColor = "rgb(245,131,136)";
            alert.style.fontWeight = "bold";
        }
    },

    fixAnnotationTabs: function () {
        for (var i = 0; i < top.frames.length; i++) {
            try {
                if (top.frames[i].document.querySelectorAll("#header_notescontrol")) {
                    for (var ii = 0; ii < top.frames[i].document.querySelectorAll("#header_notescontrol").length; ii++) {
                        top.frames[i].document.querySelectorAll("#header_notescontrol")[ii].style.display = "none";
                    }
                    break;
                }
            } catch (e) { }
        }
    },

    maskCpf: function (cpf) {
        if (cpf && cpf.length == 11) {
            var init = cpf.substr(0, 3);
            var mid = cpf.substr(3, 3);
            var fim = cpf.substr(6, 3);
            var dig = cpf.substr(9, 2);
        }

        var formatedCpf = init + "." + mid + "." + fim + "-" + dig;
        return formatedCpf;

    },

    maskCnpj: function (cnpj) {
        if (cnpj && cnpj.length == 14) {
            var init = cnpj.substr(0, 2);
            var part1 = cnpj.substr(2, 3);
            var part2 = cnpj.substr(5, 3);
            var part3 = cnpj.substr(8, 4);
            var dig = cnpj.substr(12, 2);
        }

        var formatedCnpj = init + "." + part1 + "." + part2 + "/" + part3 + "-" + dig;
        return formatedCnpj;
    }
}

//# sourceURL=helper.js


function ValidateCertification() {

    if (Xrm.Page.data.entity.attributes.get("ctm_certification").getValue() != null) {
        var nome = Xrm.Page.getAttribute("ctm_certification").getText().join();
        Xrm.Page.getAttribute("ctm_getcertifications").setValue(nome);
    } else {
        Xrm.Page.getAttribute("ctm_getcertifications").setValue(null);
    }

}


function FirstName() {
    var value1 = Xrm.Page.getAttribute("ctm_name").getValue();


    if (value1 != null) {
        const value = value1.split(" ");
        Xrm.Page.getAttribute("ctm_firstname").setValue(value[0].charAt(0).toUpperCase() + value[0].slice(1).toLowerCase());


    } else {
        Xrm.Page.getAttribute("ctm_firstname").setValue(null);
    }

}

function ValidateType() {

    if (Xrm.Page.data.entity.attributes.get("ctm_type").getValue() != null) {
        var nome = Xrm.Page.getAttribute("ctm_type").getText().join();
        Xrm.Page.getAttribute("ctm_gettype").setValue(nome);
    } else {
        Xrm.Page.getAttribute("ctm_gettype").setValue(null);
    }

}