public with sharing class Mg2_NASFCreateCasePDF {    
	public String passToConfig(List<String> memberGroupIds) {              
        system.debug(memberGroupIds);
        Mbr_Group__c mg = [Select Client_Account__c FROM Mbr_Group__c WHERE Id = :memberGroupIds[0] LIMIT 1];
        Account selAccount = [SELECT Id, Name, Allow_Flow__c FROM Account WHERE Id =: mg.Client_Account__c];
		        
		Boolean toggle_flow_code;
        Flow__c FS = Flow__c.getInstance(UserInfo.getProfileId());
        if(FS == null)
            toggle_flow_code = false;
        else
	        toggle_flow_code = FS.Enabled__c;
            
        
        Attachment att = new Attachment(Name = getPDFFilename(selAccount));              
        Blob content = getPDFasBlob(selAccount.Id, memberGroupIds);
        att.ContentType = 'application/pdf';
        att.Body = content;
        
        User current_user = [select id, alias from User where id = :UserInfo.getUserId()];
        if(current_user.alias != 'emart')
            sendEmailToUser(content, selAccount);
        
        
        Group adminQueue = [select Id,name, type from group where name = 'Admin Config User Queue' and type = 'Queue' limit 1];
        
        // Make a new Case
        Case newCase = new Case();
        newCase.Subject = 'New Account Setup (' + selAccount.Name + ') - '+ date.today().format();
        newCase.AccountId = selAccount.Id;
        newCase.status = 'Not Started';
        newCase.ownerId = adminQueue.id;
        newCase.recordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Admin Config').getRecordTypeId();
        
        // Save the Case
        try {
            insert newCase;
            String caseId = String.valueOf(newCase.Id);
            att.ParentId = newCase.Id;
            insert att;
            newCase.Description = 'New account setup requested for (' + selAccount.Name+' ) - Link to account setup form pdf: ' + URL.getSalesforceBaseUrl().toExternalForm() + '/servlet/servlet.FileDownload?file=' + att.id;
            update newCase;
            
            
            Boolean showNewCase = true;
            String newCaseId = newCase.Id;
            List<Mbr_Group__c> outgoing_groups = [select id, guid__c from Mbr_Group__c where id in :memberGroupIds];
            // Build our list of group guids
            Set<String> group_guids = new Set<String>();
            for(Mbr_Group__c temp_group : outgoing_groups)
                group_guids.add(temp_group.GUID__c);
            
            if(selAccount.Allow_Flow__c == true && toggle_flow_code){
                System.Debug('guids being submitted for tas tasks: ' + group_guids);
                Boolean processing_needed = Eds2MwProcs.CreateTasTasks(group_guids, newCaseId);
                Database.executeBatch(new FlowOut_Bch(null),1);
                if(processing_needed == true){
                    newCase.Sent_to_Admin__c = true;
                    newCase.Due_Date__c = Date.today() + 3;
                    update newCase;
                    
                }
                
            }
            return caseId;
            
            
        } catch (DmlException e) {
            return null;
        }    
        
    }
    
    private String getSelectedIds(List<String> memberGroupIds) {
        String selIds = String.join(memberGroupIds,',');
        return selIds;
    }
    
    private Blob getPDFasBlob(Id accountId, List<String> memberGroupIds) {
        // Getting the page as email does not work with cookies, so get/post here
        PageReference callPage = Page.Mg2_NASFView;
        callPage.getParameters().put('aid',accountId);
        callPage.getParameters().put('view','pdf');
        callPage.getParameters().put('ids',getSelectedIds(memberGroupIds));
        
        Blob content;
        try
        {
            content = callPage.getContentAsPDF();
        }
        catch(VisualforceException e)
        {
            // This makes your unit tests work.
            content = Blob.valueOf('Unable to generate PDF');
        }
        return content;
        
    }
       
    private String getPDFFilename(Account selAccount) {     
        return 'Teladoc NASF ' + selAccount.Name.replaceAll('[\\\\/:*?\'<>|]', '') + ' - ' + Datetime.now() + '.pdf';
    }
    
    private List<String> sendEmailToUser(Blob content, Account selAccount) {
        // Create the email attachment
        Messaging.EmailFileAttachment efa = new Messaging.EmailFileAttachment();
        efa.setFileName(getPDFFilename(selAccount));
        efa.setBody(content);
        
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        String[] ToAddresses;
        ToAddresses = new String[]{
            UserInfo.getUserEmail()
                };
                    mail.setToAddresses(ToAddresses);
        
        // Specify the address used when the recipients reply to the email.
        mail.setReplyTo('salesforcesupport@teladoc.com');
        mail.setSenderDisplayName('Salesforce New Account Form');
        mail.setBccSender(false);
        mail.setUseSignature(false);
        mail.setSaveAsActivity(false);
        
        mail.setSubject('Account setup form: ' + selAccount.Name);
        mail.setHtmlBody('<html><body>Please find attached a pdf version of the Account Setup Form for ' + selAccount.Id + '.</body></html>');
        
        mail.setFileAttachments(new Messaging.EmailFileAttachment[]{
            efa
                });
        try {
            Messaging.sendEmail(new Messaging.SingleEmailMessage[]{
                mail
                    });
        }catch (Exception e ) {            
            throw new AuraHandledException(e.getMessage());    
        }
		return ToAddresses;        
    }
    
    public List<String> AcctForm(List<String> memberGroupIds) {
        system.debug(memberGroupIds);
        List<String> emails = sendEmailToUser1(memberGroupIds);
        return emails;
    }
    
    private List<String> sendEmailToUser1(List<String> memberGroupIds){
        Mbr_Group__c mg = [Select Client_Account__c FROM Mbr_Group__c WHERE Id = :memberGroupIds[0] LIMIT 1];
        Account selAccount = [SELECT Id, Name, Allow_Flow__c FROM Account WHERE Id =: mg.Client_Account__c];
        
        List<String> emails = sendEmailToUser(getPDFasBlob(selAccount.Id, memberGroupIds), selAccount);
        return emails;
    }
}