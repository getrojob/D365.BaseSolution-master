var fileEntryURL = "";
var requestFileSystemName = "requestFileSystem.txt";

if (typeof (ctm_Global) == "undefined") { ctm_Global = {}; }

ctm_Global = {
    urlcrmbroker: function () {
        return "http://w00355dapp0:5555/Oli/BTGPactual.CRM.OLI.Service/Broker.svc";
    },

    RibbonPortfolio: function () {
        //alert("ribbon de portfolio");
        window.open("https://clientportaladmin.pactual.net/admin/faces/posicao-do-cliente");
    },

    execAnchorObject: function () {
        var link = document.createElement('a');
        link.href = fileEntryURL;
        link.download = requestFileSystemName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    onInitFs: function (fs, params) {
        fs.root.getFile(requestFileSystemName, { create: true }, function (fileEntry) {

            fileEntryURL = fileEntry.toURL();

            fileEntry.createWriter(function (fileWriter) {

                fileWriter.onwriteend = function (e) {
                    ctm_Global.execAnchorObject();
                };

                fileWriter.onerror = function (e) {
                    var error = e.toString();
                };

                var fileData = [params];
                blobObject = new Blob(fileData);
                fileWriter.write(blobObject);

            }, ctm_Global.errorHandler);

        }, ctm_Global.errorHandler);
    },

    errorHandler: function (e) {
        if (e) alert(e);
    },

    SetCurrentDate: function (field) {
        if (Xrm.Page.ui.getFormType() == 1)
            Xrm.Page.data.entity.attributes.get(field).setValue(new Date());
    }
}