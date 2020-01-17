@isTest
private class Mg2_NASFCreateCasePDF_Test {
	@TestSetup
    static void setup(){
        Account testAcct = TestDataFactory.createRandomAccount();       
        List<Mbr_Group__c> mgTest = TestDataFactory.createMbrGroup(testAcct.Id);
    }
    
    @IsTest
    static void passToConfig_Test() {
        List<Mbr_Group__c> mgTestLis = [SELECT Id, Name, Name__c, Group_Number__c, Status__c, LastModifiedBy.Name, LastModifiedDate, CreatedDate,
                                        (select Id,Name,Consult_Fee_Mbr_Pd__c, Consult_Fee_Plan_Pd__c FROM Plan_Specific_Fees_By_Product__r where Product__c ='General Medical' LIMIT 1)
       									FROM Mbr_Group__c LIMIT 3];
        List<String> mbIds = new List<String>();
        for(Mbr_Group__c mg : mgTestLis){
            mbIds.add(string.valueOf(mg.Id));
        }
        Mg2_NASFCreateCasePDF test = new Mg2_NASFCreateCasePDF();
        String caseId = test.passToConfig(mbIds);
        system.assertNotEquals(null, caseId);
        
    }
    
    @IsTest
    static void AcctForm_Test(){
        List<Mbr_Group__c> mgTestLis = [SELECT Id, Name, Name__c, Group_Number__c, Status__c, LastModifiedBy.Name, LastModifiedDate, CreatedDate,
                                        (select Id,Name,Consult_Fee_Mbr_Pd__c, Consult_Fee_Plan_Pd__c FROM Plan_Specific_Fees_By_Product__r where Product__c ='General Medical' LIMIT 1)
       									FROM Mbr_Group__c LIMIT 3];
        List<String> mbIds = new List<String>();
        for(Mbr_Group__c mg : mgTestLis){
            mbIds.add(string.valueOf(mg.Id));
        }
        Mg2_NASFCreateCasePDF test = new Mg2_NASFCreateCasePDF();
        List<String> emails = test.AcctForm(mbIds);
        system.assertNotEquals(null, emails);
        
    }
}