using System;
using D365.BaseSolution.Base.Entities;
using Microsoft.Xrm.Sdk;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Text;
using System.Collections.Generic;


namespace D365.BaseSolution.Repository
{
    public class ContactRepository : RepositoryBase
    {

        public ContactRepository() { }
        public ContactRepository(IOrganizationService service) : base(service) { }

    }
}
