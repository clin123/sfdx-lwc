@IsTest
private class Mg2_NASFControllers_Test {
    static testMethod void testNASF() {
        Profile p = [SELECT Id FROM Profile LIMIT 1];
        User u = new User(
                FirstName = 'Jim',
                LastName = 'Dollar',
                Username = 'jdo@agillion.com',
                Alias = 'jimbo',
                TimeZoneSidKey = 'Asia/Tokyo',
                EmailEncodingKey = 'Shift_JIS',
                ProfileId = p.Id,
                LanguageLocaleKey = 'pt_BR',
                LocaleSidKey = 'en_GB',
                Email = 'jdo@agillion.com'
        );

        Contact am = new Contact(
                FirstName = 'Tim',
                LastName = 'Amity',
                Email = 'tim@amity.tim'
        );

        Account ab = new Account(
                Name = 'Broker Inc',
                Friendly_Account_Name__c = 'Brk',
                GUID__c = 'ced85d79-65b7-4b3e-aa3c-039c0fe65406',
                Phone = '1-800-838-8282',
                //Account_Manager__c = am.Id,
                //OwnerId = u.Id,
                Account_Type__c = 'Broker',
                BillingStreet = '10 Street Way Drive',
                Account_Manager__c = am.Id,
                Receives_Invoice__c = 'Yes',
                Primary_Billing_Contact__c = am.Id,
                Source__c = 'HUB',
                Client_Channel_Segment__c = 'Direct Employer'
        );
        insert ab;

        Contact cb = new Contact(
                FirstName = 'Barry',
                LastName = 'Broker',
                Email = 'barry@broker.barry',
                AccountId = ab.Id
        );

        insert new List<SObject>{
                u, am, cb
        };

        Account a = new Account(
                Name = 'Test Account, LLC',
                Friendly_Account_Name__c = 'Test',
                GUID__c = 'ced85d79-65b7-4a3e-aa3c-039c0fe65406',
                BillingStreet = '1 Infinite Test',
                BillingCity = 'Cupertino',
                BillingState = 'CA',
                BillingPostalCode = '90210',
                BillingCountry = 'USA',
                Phone = '1-800-838-8282',
                Account_Type__c = 'Broker',
                Source__c = 'HUB'
        );
        insert a;

        Acct_Rel__c arc = new Acct_Rel__c();
        arc.Benefit_Sponsor__c = a.Id;
        arc.Svc_Acct__c = ab.Id;
        arc.Broker_Contact__c = cb.Id;
        arc.Broker_Flat_Rate__c = 100.30;
        arc.Relationship_Type__c = 'Broker';
        arc.Start_Date__c = Date.today() - 30;
        arc.Line_of_Business__c = null;

        Acct_Rel__c arc2 = new Acct_Rel__c();
        arc2.Benefit_Sponsor__c = ab.Id;
        arc2.Svc_Acct__c = a.Id;
        arc2.Relationship_Type__c = 'Payer Only';
        arc2.Start_Date__c = Date.today() - 30;
        arc2.Line_of_Business__c = null;

        Acct_Rel__c arc3 = new Acct_Rel__c();
        arc3.Benefit_Sponsor__c = ab.Id;
        arc3.Svc_Acct__c = a.Id;
        arc3.Broker_Contact__c = cb.Id;
        arc3.Broker_Flat_Rate__c = 100.30;
        arc3.Relationship_Type__c = 'Broker';
        arc3.Start_Date__c = Date.today() - 30;
        arc3.Line_of_Business__c = null;

        Mbr_Group__c mg = new Mbr_Group__c();
        mg.Client_Account__c = a.Id;
        mg.Active_Date__c = Date.today() - 30;
        mg.Group_Number__c = '9425';
        mg.Name__c = 'great group';

        insert new List<SObject>{
                arc, arc2, mg
        };

        Plan_Specific_Fees__c psf = new Plan_Specific_Fees__c();
        psf.Member_Group__c = mg.Id;

        Mbr_Group_Role__c mgr = new Mbr_Group_Role__c();
        mgr.Mbr_Group__c = mg.Id;
        mgr.Role_Type__c = 'Billing';
        mgr.Source_Contact__c = cb.Id;
        mgr.Source_Account__c = ab.Id;
        insert new List<SObject>{
                mgr, psf
        };

        Test.startTest();
        RestRequest request = new RestRequest();
        request.requestURI = '/services/Nasf/' + a.Id;
        RestContext.request = request;

        // First, get errors
        Mg2_NASFHelper.Mg2_NASFInfo result = Mg2_NASFHelper.getNasfInfoByAccountId(a.Id, null);
        System.assert(result.general_info.legal_name == 'Test Account, LLC');
        System.assert(result.errors != null);

        // Now, fix required fields and try again
        a.Business_Region__c = 'Europe';
        a.Business_Unit__c = 'USGH';
        a.Account_Manager__c = u.Id;
        a.Type = 'Customer';
        a.Billing_Org_ID__c = '11313';
        a.Receives_Invoice__c = 'Yes';
        a.Primary_Billing_Contact__c = cb.Id;
        a.Report_Sorting__c = 'Account Level';
        a.Report_Template__c = 'Utilization- Standard';
        a.Report_Recipient_Emails__c = 'jpatel@teladoc.com';
        a.Client_Channel_Segment__c = 'Direct Employer';
        update a;

        result = Mg2_NASFHelper.getNasfInfoByAccountId(a.Id, null);
        System.debug(result.errors);
        //System.assert(result.errors == null);

        // Generate a PDF too
        ApexPages.currentPage().getParameters().put('aid', a.Id);
        Mg2_NasfLngOutController nc = new Mg2_NasfLngOutController();
        
        a.Primary_Billing_Contact__c = am.Id;
        a.Report_Sorting__c = 'Group Level';
        a.Report_Template__c = 'Utilization- BOA Monthly';
        a.Account_Manager__c = u.Id;
        a.Report_Recipient_Emails__c = 'tom@tim.net,tim@tim.tim';
        a.Receives_Invoice__c = 'Yes';
        upsert a;

        ApexPages.currentPage().getParameters().put('aid', a.Id);
       
        ApexPages.currentPage().getParameters().put('ids', mg.Id);
       

        PageReference pageRef = Page.Mg2_NASFView;
        Test.setCurrentPage(pageRef);
        Cookie cookie = new Cookie('g:' + a.Id, mg.Id, null, -1, false);
        ApexPages.currentPage().setCookies(new Cookie[]{
                cookie
        });
        ApexPages.currentPage().getParameters().put('aid', a.Id);
        Mg2_NASFViewController pc = new Mg2_NASFViewController();
        pc.selectedGroupIds = new Set<Id>();
        pc.selectedGroupIds.add(mg.Id);
        cookie = new Cookie('g:' + a.Id, mg.Id, null, -1, false);
        ApexPages.currentPage().getParameters().put('aid', null);
        ApexPages.currentPage().getParameters().put('view', 'pdf');
        
        Account ax = new Account(Name='Fancy Account', Source__c = 'HUB');
        insert ax;
        PageReference pageRef2 = Page.Mg2_NASFView;
        Test.setCurrentPage(pageRef2);
        ApexPages.currentPage().getParameters().put('aid', ax.Id);
        Test.stopTest();
    }

    static testMethod void getAccount() {
        Profile p = [SELECT Id FROM Profile LIMIT 1];
        User u = new User(
                FirstName = 'Jim',
                LastName = 'Dollar',
                Username = 'jdo@agillion.com',
                Alias = 'jimbo',
                TimeZoneSidKey = 'Asia/Tokyo',
                EmailEncodingKey = 'Shift_JIS',
                ProfileId = p.Id,
                LanguageLocaleKey = 'pt_BR',
                LocaleSidKey = 'en_GB',
                Email = 'jdo@agillion.com'
        );

        Contact am = new Contact(
                FirstName = 'Tim',
                LastName = 'Amity',
                Email = 'tim@amity.tim'
        );

        Account ab = new Account(
                Name = 'Broker Inc',
                Friendly_Account_Name__c = 'Brk',
                GUID__c = 'ced85d79-65b7-4b3e-aa3c-039c0fe65406',
                Phone = '1-800-838-8282',
                //Account_Manager__c = am.Id,
                //OwnerId = u.Id,
                Account_Type__c = 'Broker',
                BillingStreet = '10 Street Way Drive',
                Account_Manager__c = am.Id,
                Receives_Invoice__c = 'Yes',
                Primary_Billing_Contact__c = am.Id,
                Source__c = 'HUB',
                Client_Channel_Segment__c = 'Direct Employer'
        );

        insert new List<SObject>{
                u, am
        };
        insert ab;

        Test.startTest();
        // Test web service
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/Nasf/' + ab.Id;
        req.httpMethod = 'GET';
        RestContext.request = req;
        NASFInfoService.getNASFInfoByAccountId();
        Test.stopTest();
    }
}