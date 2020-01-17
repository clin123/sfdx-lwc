@isTest
private class Mg2_AccountSetupLwcController_Test {
	@TestSetup
    static void setup(){
        Account testAcct = TestDataFactory.createRandomAccount();  
        Contact testCon = TestDataFactory.createContact(testAcct.Id);
        testAcct.Primary_Billing_Contact__c = testCon.Id;
        update testAcct;
        List<Mbr_Group__c> mgTest = TestDataFactory.createMbrGroup(testAcct.Id);       
    }    
    
    @IsTest
    static void errorCheck_Test() {
        Account TestAcct = [SELECT Id FROM Account LIMIT 1];
        Map<String, String> error = Mg2_AccountSetupLwcController.errorCheck(TestAcct.Id);
        system.assertNotEquals(Null, error);       
    }
    
    @IsTest
    static void filterMbrGroup_Test() {
        Account TestAcct = [SELECT Id FROM Account LIMIT 1];
        String search1 = 'notExist';
        String search2 = 'Pending';
        Mg2_AccountSetupLwcController.filterMbrGroup(TestAcct.Id, search1, search2);
    }
    
    @IsTest
    static void CreateCase_Test() {
        List<Mbr_Group__c> mgTestLis = [SELECT Id, Name, Name__c, Group_Number__c, Status__c, LastModifiedBy.Name, LastModifiedDate, CreatedDate,
                                        (select Id,Name,Consult_Fee_Mbr_Pd__c, Consult_Fee_Plan_Pd__c FROM Plan_Specific_Fees_By_Product__r where Product__c ='General Medical' LIMIT 1)
       									FROM Mbr_Group__c LIMIT 3];
        List<String> mbIds = new List<String>();
        for(Mbr_Group__c mg : mgTestLis){
            mbIds.add(string.valueOf(mg.Id));
        }
        String caseId = Mg2_AccountSetupLwcController.CreateCase(mbIds);
        system.assertNotEquals(null, caseId);
        
    }
    
    @IsTest
    static void sendForm_Test(){
        List<Mbr_Group__c> mgTestLis = [SELECT Id, Name, Name__c, Group_Number__c, Status__c, LastModifiedBy.Name, LastModifiedDate, CreatedDate,
                                        (select Id,Name,Consult_Fee_Mbr_Pd__c, Consult_Fee_Plan_Pd__c FROM Plan_Specific_Fees_By_Product__r where Product__c ='General Medical' LIMIT 1)
       									FROM Mbr_Group__c LIMIT 3];
        List<String> mbIds = new List<String>();
        for(Mbr_Group__c mg : mgTestLis){
            mbIds.add(string.valueOf(mg.Id));
        }
        String emails = Mg2_AccountSetupLwcController.sendForm(mbIds);
        system.assertNotEquals(null, emails);
        
    }
    
    @IsTest
    static void flowCheck_Test() {
        Account TestAcct = [SELECT Id FROM Account LIMIT 1];
        String error = Mg2_AccountSetupLwcController.flowCheck(TestAcct.Id);
        system.assertNotEquals(Null, error);       
    }
    
    @IsTest
    static void findContactIdTest() {
        Account TestAcct = [SELECT Id, Primary_Billing_Contact__c FROM Account LIMIT 1];
        String findCon = Mg2_AccountSetupLwcController.findContactId(TestAcct.Id);
        system.assertEquals(findCon, TestAcct.Primary_Billing_Contact__c);
    }
    
    @IsTest
	static void srvAcctWrapper_Test() {
        Mg2_AccountSetupLwcController.srvAcctWrapper wrapper = new Mg2_AccountSetupLwcController.srvAcctWrapper(null, null, null);
        wrapper.isChecked = null;
        wrapper.srvAcctId = null;
        wrapper.srvAcctName = null;
        system.assertEquals(null, wrapper.isChecked);
        system.assertEquals(null, wrapper.srvAcctId);
        system.assertEquals(null, wrapper.srvAcctName);
    }
    
    @IsTest
    static void findSrvAcctTest() {
        Account TestAcct = [SELECT Id, Primary_Billing_Contact__c FROM Account LIMIT 1];
        Account acct2 = new Account();
        acct2.Name ='Acct Rel Test';
        Insert acct2;        
        Acct_Rel__c acctRel = new Acct_Rel__c();
        acctRel.Benefit_Sponsor__c = TestAcct.Id;
        acctRel.Svc_Acct__c = acct2.Id;
        acctRel.Relationship_Type__c = 'Contractee';
        acctRel.Start_Date__c = system.today();
        insert acctRel;
        Mg2_AccountSetupLwcController.findSrvAcct(TestAcct.Id);
    }
}