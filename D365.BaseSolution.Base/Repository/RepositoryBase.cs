using System;
using System.Linq;
using System.Text;
using Microsoft.Xrm.Sdk;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using System.Xml;
using System.Text;
using System.IO;
using Microsoft.Xrm.Sdk.Messages;


namespace D365.BaseSolution.Repository
{
    public class RepositoryBase
    {
        public IOrganizationService service { get; set; }

        public RepositoryBase(IOrganizationService organizationService)
        {
            this.service = organizationService;
        }

        public RepositoryBase()
        {
            var connector = new Connect365();
            this.service = connector.Service;
        }

        public Guid Create(Entity entity)
        {
            return this.service.Create(entity);
        }
        public void Update(Entity entity)
        {
            this.service.Update(entity);
        }
        public void Delete(Guid entity)
        {
            this.service.Delete(null, entity);
        }
        public void Delete(Entity entity)
        {
            this.service.Delete(entity.LogicalName, entity.Id);
        }
        public Entity Retrieve(Entity entity)
        {
            return this.service.Retrieve(entity.LogicalName, entity.Id, new Microsoft.Xrm.Sdk.Query.ColumnSet(true));
        }
        public Entity Retrieve(Entity entity, ColumnSet columnSet)
        {
            return this.service.Retrieve(entity.LogicalName, entity.Id, columnSet);
        }
        public Entity Retrieve(string entityName, Guid entityId, ColumnSet columnSet)
        {
            return this.service.Retrieve(entityName, entityId, columnSet);
        }
        public EntityCollection RetrieveMultiple(QueryBase query)
        {
            return this.service.RetrieveMultiple(query);
        }

        public OrganizationResponse Execute(OrganizationRequest request)
        {
            return this.service.Execute(request);
        }
        public EntityCollection RetrieveMultipleWithPagination(QueryExpression query)
        {
            if (query.PageInfo.PageNumber >= 1)
                return this.RetrieveMultiple(query);

            int pageNumber = 1;
            string pagingCookie = "";
            EntityCollection collection = new EntityCollection();

            while (true)
            {
                query.PageInfo = new PagingInfo() { PageNumber = pageNumber, PagingCookie = pagingCookie, Count = 1000 };

                var resultado = this.service.RetrieveMultiple(query);
                collection.Entities.AddRange(resultado.Entities);

                if (resultado.MoreRecords)
                {
                    pageNumber++;
                    pagingCookie = resultado.PagingCookie;
                }
                else break;
            }

            return collection;
        }

        public EntityCollection RetrieveMultipleWithPagination(QueryExpression query, string pagingCookie = "", int pageNumber = 1)
        {
            query.PageInfo = new PagingInfo() { PageNumber = pageNumber, PagingCookie = pagingCookie, Count = 1000 };

            return this.service.RetrieveMultiple(query);
        }

        public EntityCollection RetrieveMultipleWithPagination(FetchExpression fetchXml)
        {
            bool moreRecords = true;
            int fetchCount = 5000;
            int pageNumber = 1;
            string pagingCookie = null;
            EntityCollection entityCollection = new EntityCollection();

            while (moreRecords)
            {
                fetchXml = new FetchExpression(CreateXml(fetchXml.Query.ToString(), pagingCookie, pageNumber, fetchCount));

                var result = this.RetrieveMultiple(fetchXml);

                entityCollection.Entities.AddRange(result.Entities);

                moreRecords = result.MoreRecords;
                if (moreRecords)
                {
                    pageNumber++;
                    pagingCookie = result.PagingCookie;
                }
            }

            if (entityCollection.Entities.Count > 0)
                return entityCollection;
            else
                return new EntityCollection();
        }

        public void GrantAccess(EntityReference userOrTeam, EntityReference target, AccessRights acessRight)
        {
            GrantAccessRequest grantAccessRequest = new GrantAccessRequest
            {
                PrincipalAccess = new PrincipalAccess
                {
                    AccessMask = acessRight,
                    Principal = userOrTeam
                },
                Target = target
            };

            service.Execute(grantAccessRequest);
        }

        public void ModifyAccess(EntityReference userOrTeam, EntityReference target, AccessRights acessRight)
        {
            ModifyAccessRequest modifyAccessRequest = new ModifyAccessRequest
            {
                PrincipalAccess = new PrincipalAccess
                {
                    AccessMask = acessRight,
                    Principal = userOrTeam
                },
                Target = target
            };

            service.Execute(modifyAccessRequest);
        }

        public void RevokeAccess(EntityReference userOrTeam, EntityReference target)
        {
            RevokeAccessRequest revokeAccessRequest = new RevokeAccessRequest
            {
                Revokee = userOrTeam,
                Target = target
            };

            service.Execute(revokeAccessRequest);
        }

        private string CreateXml(string xml, string cookie, int page, int count)
        {
            StringReader stringReader = new StringReader(xml);
            XmlTextReader reader = new XmlTextReader(stringReader);

            // Load document
            XmlDocument doc = new XmlDocument();
            doc.Load(reader);

            return CreateXml(doc, cookie, page, count);
        }

        private string CreateXml(XmlDocument doc, string cookie, int page, int count)
        {
            XmlAttributeCollection attrs = doc.DocumentElement.Attributes;

            if (cookie != null)
            {
                XmlAttribute pagingAttr = doc.CreateAttribute("paging-cookie");
                pagingAttr.Value = cookie;
                attrs.Append(pagingAttr);
            }

            XmlAttribute pageAttr = doc.CreateAttribute("page");
            pageAttr.Value = System.Convert.ToString(page);
            attrs.Append(pageAttr);

            XmlAttribute countAttr = doc.CreateAttribute("count");
            countAttr.Value = System.Convert.ToString(count);
            attrs.Append(countAttr);

            StringBuilder sb = new StringBuilder(1024);
            StringWriter stringWriter = new StringWriter(sb);

            XmlTextWriter writer = new XmlTextWriter(stringWriter);
            doc.WriteTo(writer);
            writer.Close();

            return sb.ToString();
        }

        public ExecuteMultipleResponse BulkCreate(EntityCollection entities)
        {
            try
            {
                // Create an ExecuteMultipleRequest object.
                var multipleRequest = new ExecuteMultipleRequest()
                {
                    // Assign settings that define execution behavior: continue on error, return responses. 
                    Settings = new ExecuteMultipleSettings()
                    {
                        ContinueOnError = true,
                        ReturnResponses = true
                    },
                    // Create an empty organization request collection.
                    Requests = new OrganizationRequestCollection()
                };

                // Add a CreateRequest for each entity to the request collection.
                foreach (var entity in entities.Entities)
                {
                    CreateRequest createRequest = new CreateRequest { Target = entity };
                    multipleRequest.Requests.Add(createRequest);
                }

                // Execute all the requests in the request collection using a single web method call.
                ExecuteMultipleResponse multipleResponse = (ExecuteMultipleResponse)service.Execute(multipleRequest);

                return multipleResponse;
            }
            catch (Exception ex)
            {
                //return BulkCreate(entities);
                return null;
            }

        }

        public ExecuteMultipleResponse BulkUpdate(EntityCollection entities, out string msg)
        {
            try
            {
                // Create an ExecuteMultipleRequest object.
                var multipleRequest = new ExecuteMultipleRequest()
                {
                    // Assign settings that define execution behavior: continue on error, return responses. 
                    Settings = new ExecuteMultipleSettings()
                    {
                        ContinueOnError = true,
                        ReturnResponses = true
                    },
                    // Create an empty organization request collection.
                    Requests = new OrganizationRequestCollection()
                };

                // Add a CreateRequest for each entity to the request collection.
                foreach (var entity in entities.Entities)
                {
                    UpdateRequest updateRequest = new UpdateRequest { Target = entity };
                    multipleRequest.Requests.Add(updateRequest);
                }

                // Execute all the requests in the request collection using a single web method call.
                ExecuteMultipleResponse multipleResponse = (ExecuteMultipleResponse)service.Execute(multipleRequest);
                msg = string.Empty;
                return multipleResponse;
            }
            catch (Exception ex)
            {
                //return BulkUpdate(entities);
                msg = ex.Message;
                return null;
            }

        }

        public ExecuteMultipleResponse BulkUpdateNoReturn(EntityCollection entities, out string msg)
        {
            try
            {
                // Create an ExecuteMultipleRequest object.
                var multipleRequest = new ExecuteMultipleRequest()
                {
                    // Assign settings that define execution behavior: continue on error, return responses. 
                    Settings = new ExecuteMultipleSettings()
                    {
                        ContinueOnError = true,
                        ReturnResponses = false
                    },
                    // Create an empty organization request collection.
                    Requests = new OrganizationRequestCollection()
                };

                // Add a CreateRequest for each entity to the request collection.
                foreach (var entity in entities.Entities)
                {
                    UpdateRequest updateRequest = new UpdateRequest { Target = entity };
                    multipleRequest.Requests.Add(updateRequest);
                }

                // Execute all the requests in the request collection using a single web method call.
                ExecuteMultipleResponse multipleResponse = (ExecuteMultipleResponse)service.Execute(multipleRequest);
                msg = string.Empty;
                return multipleResponse;
            }
            catch (Exception ex)
            {
                //return BulkUpdate(entities);
                msg = ex.Message;
                return null;
            }

        }

        public void SetStatus(Guid recordId, string entityName, int state, int status)
        {
            SetStateRequest setStateRequest = new SetStateRequest()
            {
                EntityMoniker = new EntityReference
                {
                    Id = recordId,
                    LogicalName = entityName,
                },
                State = new OptionSetValue(state),
                Status = new OptionSetValue(status)
            };

            SetStateResponse setStateResponse = (SetStateResponse)Execute(setStateRequest);
        }

        public Entity GetByDocumentNumber(string documentNumber)
        {
            QueryExpression query = new QueryExpression("lead");
            query.ColumnSet = new ColumnSet(true);
            query.Criteria.AddCondition("ctm_documentnumber", ConditionOperator.Equal, documentNumber);

            EntityCollection collection = RetrieveMultiple(query);

            return collection.Entities.Count > 0 ? collection.Entities[0] : null;
        }

        public void Create(EntityCollection collection)
        {
            var multipleRequest = new ExecuteMultipleRequest()
            {
                Settings = new ExecuteMultipleSettings()
                {
                    ContinueOnError = true,
                    ReturnResponses = true
                }
            };

            int limit = 300;

            for (int i = 0; i <= Convert.ToInt32(collection.Entities.Count / limit); i++)
            {
                multipleRequest.Requests = new OrganizationRequestCollection();

                try
                {
                    for (int j = i * limit; j < i * limit + limit; j++)
                    {
                        CreateRequest createRequest = new CreateRequest { Target = collection.Entities[j] };
                        multipleRequest.Requests.Add(createRequest);
                    }
                }
                catch (Exception ex) { }

                service.Execute(multipleRequest);
            }
        }
    }
}
