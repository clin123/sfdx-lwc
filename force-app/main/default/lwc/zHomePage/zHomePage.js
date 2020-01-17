/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
/* eslint-disable no-useless-concat */
/* eslint-disable no-else-return */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-alert */
/* eslint-disable @lwc/lwc/no-async-operation */
/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
/* eslint-disable guard-for-in */
/* eslint-disable no-console */
/* eslint-disable vars-on-top */
import { LightningElement, track, api } from "lwc";
import errorCheck from "@salesforce/apex/NASFGroupSelectLightningController.errorCheck";
import { NavigationMixin } from "lightning/navigation";

export default class zHomePage extends NavigationMixin(LightningElement) {
  @api recordId; //current account record Id
  @track wizardPage = false; //boolean to render wizard page
  @track wizardAcct = false; //boolean to render account record edit page
  @track wizardCon = false; //boolean to render contact record edit page
  @track wizardAcctRel = false; //boolean to render account relationship record edit page
  @track mbrPage = false; //boolean to render member group selection page
  @track srvAcctPage = false; //boolean to render account validation page
  @track acctErrorList = []; //list of account error message
  @track acctRelErrorList = []; //list of account relationship error message
  @track conErrorList = []; //list of contact error message
  @track errorList = []; //list of all error message
  @track acctError = []; //account error list for forloop 
  @track conError = []; //contact error list for forloop
  @track acctRelError = []; //account relationship error list for forloop
  @track selectString; //url for PDF vf page 
  @track allList = [];

  //helper map for error list creation
  acctErrorMap = []; 
  conErrorMap = [];
  acctRelErrorMap = [];
 
 
 
  //@track srvAcctList = []; //list of servicing account for currnet account record
  //@track indexNum; //validation table row index
  //@track validateId; //selected validation row account record Id
  //@track warningMessage; //warning message for account not eligible for flow
  //@track validationAcct = false; //boolean to render child componnet for record edit
  //@track finalButton = true; //boolean to render view setup form button
  //@track srvAcctIdList = []; //list of servicing account id


  // doInit component
  connectedCallback() {
    this.checkError();
  }
  
  checkError() {
    this.emptyAllList();
    errorCheck({ recordId: this.recordId })
      .then(response => {
        let details = response;
        if (JSON.stringify(details) !== "{}") {
          for (let key in details) {
            if (key === "Primary_Billing_Contact_Email__c") {
              this.errorList.push({ value: details[key], key: key });
              this.conErrorList.push({ value: details[key], key: key });
            } else if (key === "MailingAddress") {
              this.pushMailingKeysToConErrorList(details, key);
            } else if (key === "Acct_Rel__c") {
              this.errorList.push({ value: details[key], key: key });
              this.acctRelErrorList.push({ value: details[key], key: key });
            } else if (key === "Receives_Invoice__c") {
              this.errorList.push({ value: details[key], key: key });
              this.acctErrorList.push({ value: details[key], key: key });
            } else if (key === "BillingAddress") {
              this.pushBillingKeysToAcctErrorList(details, key);
            } else {
              this.errorList.push({ value: details[key], key: key });
              this.acctErrorList.push({ value: details[key], key: key });
            }
          }
        } else {
          this.emptyAllList();
        }
        if (this.errorList.length > 0) {
          this.wizardPage = true;
          this.wizardAcct = false;
          this.wizardCon = false;
          this.wizardAcctRel = false;
          this.mbrPage = false;
        } else {
          this.mbrPage = true;
        }

        for (let i = 0; i < this.acctErrorList.length; i++) {
          this.acctErrorMap.push(this.acctErrorList[i].key);
        }
        this.acctError = this.acctErrorMap.map(apiName => {
          return {
            api: apiName,
            isFriendly: apiName === "Friendly_Account_Name__c",
            isAcctType: apiName === "Account_Type__c",
            isBillingCon: apiName === "Primary_Billing_Contact__c",
            isPayTerm: apiName === "Payment_Terms__c",
            isPhone: apiName === "Phone",
            isAcctMgr: apiName === "Account_Manager__c",
            isInvoice: apiName === "Receives_Invoice__c",
            isStreet: apiName === "BillingStreet",
            isCity: apiName === "BillingCity",
            isState: apiName === "BillingState",
            isZip: apiName === "BillingPostalCode",
            isCountry: apiName === "BillingCountry"
          };
        });

        for (let x = 0; x < this.conErrorList.length; x++) {
          this.conErrorMap.push(this.conErrorList[x].key);
        }
        this.conError = this.conErrorMap.map(apiName => {
          return {
            api: apiName,
            isEmail: apiName === "Primary_Billing_Contact_Email__c",
            isStreet: apiName === "MailingStreet",
            isCity: apiName === "MailingCity",
            isState: apiName === "MailingState",
            isZip: apiName === "MailingPostalCode",
            isCountry: apiName === "MailingCountry"
          };
        });
      })
      .catch(error => {
        console.error("there is error");
      });
  }
  emptyAllList() {
    this.errorList = [];
    this.acctErrorList = [];
    this.acctRelErrorList = [];
    this.conErrorList = [];
    this.acctError = [];
    this.conError = [];
    this.acctErrorMap = [];
    this.conErrorMap = [];
  }

  pushMailingKeysToConErrorList(details, key) {
    this.errorList.push({ value: details[key], key: key });
    this.conErrorList.push({ value: "street", key: "MailingStreet" });
    this.conErrorList.push({ value: "city", key: "MailingCity" });
    this.conErrorList.push({ value: "state", key: "MailingState" });
    this.conErrorList.push({ value: "zip", key: "MailingPostalCode" });
    this.conErrorList.push({ value: "country", key: "MailingCountry" });
  }

  pushBillingKeysToAcctErrorList(details, key) {
    this.errorList.push({ value: details[key], key: key });
    this.acctErrorList.push({ value: "street", key: "BillingStreet" });
    this.acctErrorList.push({ value: "city", key: "BillingCity" });
    this.acctErrorList.push({ value: "state", key: "BillingState" });
    this.acctErrorList.push({ value: "zip", key: "BillingPostalCode" });
    this.acctErrorList.push({ value: "country", key: "BillingCountry"});
  }

  cancelDialog() {
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: this.recordId,
        objectApiName: "Account",
        actionName: "view"
      }
    });
  }

  goAcctPage(event) {
    let pageName = event.detail;
    if(pageName === "account") {
        this.wizardAcct = true;
    } else if(pageName === "contact") {
        this.wizardCon = true;
    } else{
        this.wizardAcctRel = true;
    }
    this.wizardPage = false;
  }

  goConPage(event) {
    let pageName = event.detail;
    console.log(pageName);
    if(pageName === "validate") {
        this.mbrPage = true;
    } else if(pageName === "acctRel") {
        this.wizardAcctRel = true;
    } else{
        this.wizardCon = true;
    }
    this.wizardAcct = false;
  }

  goAcctRelPage(event) {
    let pageName = event.detail;
    if(pageName === "acctRel") {
      this.wizardAcctRel = true;
    } else{
        this.mbrPage = true;
    }
    this.wizardCon = false;
  }

  //for now we skip the validation page for more information on the behavior
  goValidatePage(event) {
    if(event.detail === "saved"){
        this.mbrPage = true;
        //this.srvAcctPage = true;
        this.wizardAcctRel = false;
    }
  }

  goPdfpage(event) {
      this.allList = event.detail;
      this.selectString = this.allList.join();
      this.mbrPage = false;
      this.pdfPage = true;
  }

  goBack(event) {
    this.mbrPage = true;
    this.pdfPage = false;
  }
}