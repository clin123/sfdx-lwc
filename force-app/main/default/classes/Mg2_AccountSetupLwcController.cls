public with sharing class Mg2_AccountSetupLwcController {
    @AuraEnabled
    public static Map<String, String> errorCheck(Id recordId) {
        Map<String, String> errorMap = new Map<String, String>();
        Mg2_NASFHelper.Mg2_NASFInfo rawNASFInfo = Mg2_NASFHelper.getNasfInfoByAccountId(recordId, new Set<Id>());
        if (rawNASFInfo.errors != null) {
            for (Mg2_NASFHelper.valError e : rawNASFInfo.errors) {
                if (e.field_name == null) {
                     errorMap.put('Acct_Rel__c', ('Missing Information: ' + e.error_msg));
                } else {
                     errorMap.put(e.field_label, ('Missing Required Account Value: ' + e.field_name + ' [' + e.field_label + ']'));
                }
            }         
        }
        
        Account acct = [SELECT Id, Primary_Billing_Contact__r.MailingAddress FROM Account WHERE Id =: recordId];
        if (acct.Primary_Billing_Contact__r.MailingAddress == null){
            errorMap.put('MailingAddress', ('Missing Required Primary Contact Value: Mailing Address [MailingAddress]'));
        }
        return errorMap;
    }
   
    @AuraEnabled
    public static List<Mbr_Group__c> filterMbrGroup(Id recordId, string searchStr, string statusStr){
        List<Mbr_Group__c> mg = new List<Mbr_Group__c>();
        String grpquery = 'SELECT Id, Name, Name__c, Group_Number__c, Status__c, LastModifiedDate, CreatedDate, ';
        grpquery += '(select Id,Name,Consult_Fee_Mbr_Pd__c, Consult_Fee_Plan_Pd__c FROM Plan_Specific_Fees_By_Product__r where Product__c = \'General Medical\' LIMIT 1) ';
        grpquery += 'FROM Mbr_Group__c WHERE Client_Account__c = \'' + recordId + '\' ';
        
        List<String> SearchList = new List<String>();
        if (searchStr != null){
            String grpnumber = searchStr.replaceAll('n\\s+','');
            set<string> grpnumbers = new set<string>(grpnumber.split(','));
            for (String str : grpnumbers){
                str = '%'+str+'%';
                SearchList.add(str);
            }
        }       
        if (searchStr != null && searchStr.length() >= 2) {
            grpquery += ' and (Group_Number__c Like :SearchList or name__c like :SearchList)';
        }
        if (!String.isBlank(statusStr)) {
            grpquery += ' and Status__c = \'' + statusStr + '\' ';
        }
        grpquery += ' order by LastModifiedDate desc';
        if (recordId != null) {
            mg = Database.query(grpquery);
        }
        return mg;
    }

    
    @AuraEnabled
    public static String CreateCase(List<String> memberGroupIds){
        Mg2_NASFCreateCasePDF createCase = new Mg2_NASFCreateCasePDF();
        string resResponse = createCase.passToConfig(memberGroupIds);       
        return resResponse;

    }
    
    @AuraEnabled
    public static String sendForm(List<String> memberGroupIds){
        Mg2_NASFCreateCasePDF sendEmail = new Mg2_NASFCreateCasePDF();
        system.debug(memberGroupIds);
        List<String> emails = sendEmail.AcctForm(memberGroupIds);
        String email = emails[0];
        return email;
    }
    
    @AuraEnabled
    public static String flowCheck(String recordId){       
        String warningMessage ='';
        Account selAccount = [SELECT Name, Allow_Flow__c FROM Account WHERE Id =: recordId];
        Flow__c FS = Flow__c.getInstance(UserInfo.getProfileId());
        Boolean toggle_flow_code;        
        if(FS == null)
            toggle_flow_code = false;
        else
            toggle_flow_code = FS.Enabled__c;
        
        if(selAccount.Allow_Flow__c == false && toggle_flow_code == TRUE){
            warningMessage = 'ACCOUNT (' + selAccount.Name + ') is not eligible for FLOW. The group(s) below must be MANUALLY configured in ADMIN.';
            
        }
        return warningMessage;
    }
    
    @AuraEnabled
    public static String findContactId(String recordId){       
        Account acct = [SELECT Primary_Billing_Contact__c FROM Account WHERE Id =: recordId];
        return acct.Primary_Billing_Contact__c;
    }
    
    @AuraEnabled
    public static List<srvAcctWrapper> findSrvAcct(String recordId) {       
        Set<String> acctId = new Set<String>();
        List<srvAcctWrapper> srvAcctWrapper = new List<srvAcctWrapper>();
        List<Acct_Rel__c> acctRelList = [SELECT Svc_Acct__c, Svc_Acct__r.Name FROM Acct_Rel__c WHERE Benefit_Sponsor__c =: recordId];              
        for(Acct_Rel__c acctRel : acctRelList){
            acctId.add(acctRel.Svc_Acct__c);
        }
        List<Account> acctList = [SELECT Id, Name FROM Account WHERE Id IN :acctId];              
        for(Account acct : acctList){
             srvAcctWrapper.add(new srvAcctWrapper(false, acct.Id, acct.Name));
        }
        return srvAcctWrapper;
    }
    
    public class srvAcctWrapper{
        @auraEnabled
        public Boolean isChecked {get; set;}
        @auraEnabled
        public Id srvAcctId {get; set;} 
        @auraEnabled
        public String srvAcctName {get; set;} 
        public srvAcctWrapper(Boolean isChecked, Id srvAcctId, String srvAcctName ){
            this.isChecked = isChecked;
            this.srvAcctId = srvAcctId;
            this.srvAcctName = srvAcctName;
        }
    } 
}