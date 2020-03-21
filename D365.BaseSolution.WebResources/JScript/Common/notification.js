if (typeof (GetJob) == "undefined") { window.GetJob = {}; }
if (typeof (GetJob.CRM365) == "undefined") { GetJob.CRM365 = {}; }
if (typeof (GetJob.CRM365.Commons) == "undefined") { GetJob.CRM365.Commons = {}; }

GetJob.CRM365.Commons.Notification = (function() {
    var module = {};

    module.showNotification = function(title, body, type) {
        if (!("Notification" in window)) {
            return; //no support for notification
        }

        var setUpNotification = function(title, body, type) {
            var notification = {};
            var options = {
                body: body || "",
                icon: (function (type) {
                    switch (type) {
                        case "INFO":
                            return "https://cdn2.iconfinder.com/data/icons/perfect-flat-icons-2/512/Info_information_user_about_card_button_symbol.png";
                        case "WARNING":
                            return "https://cdn3.iconfinder.com/data/icons/simple-web-navigation/165/alert-512.png";
                        case "ERROR":
                            return "https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678069-sign-error-512.png";
                        default:
                            return null;
                    }
                })(type)
            };

            var notification = new Notification(title, options);

            if (type == "WARNING") {
                notification.onclick = function () {
                    window.open("https://wmdev.crm2.dynamics.com/main.aspx?etc=10030&extraqs=&histKey=631903480&id=%7bF18B605B-BA82-E711-8106-C4346BB53E2C%7d&newWindow=true&pagetype=entityrecord#825211880");
                }
            }
        };

        if (Notification.permission === "granted") {
            setUpNotification(title, body, type);
        }
        else if(Notification.permission !== "denied") {
            Notification.requestPermission(function(permission) {
                if (permission === "granted") {
                    setUpNotification(title, body, type);
                }
            });
        }
    };

    module.show = function() {
        module.showNotification("O cliente Getulio Silva foi migrado para a sua carteira.", null, "INFO");
        module.showNotification("Justificativa de resgate pendente.", null, "WARNING");
        module.showNotification("Você possui clientes sem cadastro de grupo econômico.", null, "ERROR");

        Xrm.Page.ui.setFormNotification('O cliente nao possui pendências.', 'INFO');
        Xrm.Page.ui.setFormNotification('Os dados de contato (e-mail e telefone) ainda não foram revisados.', 'WARNING');
        Xrm.Page.ui.setFormNotification('O cliente possui pendências.', 'ERROR'); 
    };

    return module;
})();