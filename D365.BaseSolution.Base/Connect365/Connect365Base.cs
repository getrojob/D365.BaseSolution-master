using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Configuration;
using Microsoft.Xrm.Client.Services;
using Microsoft.Xrm.Client;

namespace D365.BaseSolution.Connect365
{
    public class Connect365Base
    {
        public OrganizationService service = null;
        private string stringConnection = Cript.Decrypt(ConfigurationManager.ConnectionStrings["CRM"].ToString());

        public Connect365Base()
        {
            if (service == null)
            {
                CrmConnection connection = CrmConnection.Parse(stringConnection);
                service = new OrganizationService(connection);
            }
        }
    }
}