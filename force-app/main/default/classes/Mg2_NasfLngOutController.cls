public with sharing class Mg2_NasfLngOutController {    
    public Id accountId { get; private set; }   
    public Mg2_NasfLngOutController() {
        system.debug(accountId);   
        PageReference page = System.currentPageReference();
        accountId = page.getParameters().get('aid');       
    }  
}