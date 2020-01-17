/* eslint-disable no-alert */
/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
/* eslint-disable guard-for-in */
/* eslint-disable no-console */
/* eslint-disable vars-on-top */
import { LightningElement, track, api, wire } from "lwc";
import errorCheck from "@salesforce/apex/Mg2_AccountSetupLwcController.errorCheck";
import findContact from "@salesforce/apex/Mg2_AccountSetupLwcController.findContactId";
import srvAcctSearch from "@salesforce/apex/Mg2_AccountSetupLwcController.findSrvAcct";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class AcctSetUpLWC extends LightningElement {
  @api recordId;
  @track conId;
  @track acctErrorList = [];
  @track acctRelErrorList = [];
  @track conErrorList = [];
  @track errorList = [];
  @track srvAcctList = [];
  @track errorPage = false;
  @track wizardPage = false;
  @track wizardAcct = false;
  @track wizardCon = false;
  @track wizardAcctRel = false;
  @track financialType = false;
  @track validationAcct = false;
  @track passed = false;
  @track acctError = [];
  @track conError = [];
  @track acctRelError = [];
  acctErrorMap = [];
  conErrorMap = [];
  acctRelErrorMap = [];
  

  /*
  @wire(errorCheck, { recordId: "$recordId" })
  wiredResult(result) {
    if (result.data) 
      
  */

  // initialize component
  connectedCallback() {
    this.checkError();
    this.contactFind();
  }

  checkError() {
    this.errorList = [];
    this.acctErrorList = [];
    this.acctRelErrorList = [];
    this.conErrorList = [];
    this.acctError = [];
    this.conError = [];
    this.acctErrorMap = [];
    this.conErrorMap = [];
    errorCheck({ recordId: this.recordId })
      .then(response => {
        var details = response;
        if (JSON.stringify(details) !=="{}") {
          for (var key in details) {
            if (key === "Primary_Billing_Contact_Email__c") {
              this.errorList.push({ value: details[key], key: key });
              this.conErrorList.push({ value: details[key], key: key });
            } else if (key === "MailingAddress") {
              this.errorList.push({ value: details[key], key: key });
              this.conErrorList.push({ value: "street", key: "MailingStreet" });
              this.conErrorList.push({ value: "city", key: "MailingCity" });
              this.conErrorList.push({ value: "state", key: "MailingState" });
              this.conErrorList.push({ value: "zip",key: "MailingPostalCode" });
              this.conErrorList.push({ value: "country", key: "MailingCountry" });
            } else if (key === "Acct_Rel__c") {
              this.errorList.push({ value: details[key], key: key });
              this.acctRelErrorList.push({ value: details[key], key: key });
            } else if (key === "Receives_Invoice__c") {
              this.errorList.push({ value: details[key], key: key });
              this.acctErrorList.push({ value: details[key], key: key });
            } else if (key === "BillingAddress") {
              this.errorList.push({ value: details[key], key: key });
              this.acctErrorList.push({ value: "street", key: "BillingStreet" });
              this.acctErrorList.push({ value: "city", key: "BillingCity" });
              this.acctErrorList.push({ value: "state", key: "BillingState" });
              this.acctErrorList.push({ value: "zip", key: "BillingPostalCode" });
              this.acctErrorList.push({ value: "country", key: "BillingCountry" });
            } else {
              this.errorList.push({ value: details[key], key: key });
              this.acctErrorList.push({ value: details[key], key: key });
            }
          }
        } else {
          this.errorList = [];
          this.acctErrorList = [];
          this.acctRelErrorList = [];
          this.conErrorList = [];
        }
        if (this.errorList.length > 0) {
          this.errorPage = true;
          this.wizardPage = true;
          this.wizardAcct = false;
          this.wizardCon = false;
          this.wizardAcctRel = false;
          this.mbrPage = false;
        } else {
          console.log("noERROR child");
          this.errorPage = false;
          this.passed = true;
          const pasEvt = new CustomEvent('pass', {detail : this.passed});
          this.dispatchEvent(pasEvt);
          this.showValidatetoast();
        }

        for (var i = 0; i < this.acctErrorList.length; i++) {
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

        for (var x = 0; x < this.conErrorList.length; x++) {
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

  cancelDialog() {
    const closeQA = new CustomEvent("close");
    // Dispatches the event.
    this.dispatchEvent(closeQA);
  }

  handleTypeChange(event) {
    var isYes = event.detail.value;
    if (isYes === "Yes") {
      this.financialType = true;
    } else {
      this.financialType = false;
    }
  }

  startWiz() {
    if (this.acctErrorList.length > 0) {
      this.wizardAcct = true;
      this.wizardPage = false;
      this.wizardCon = false;
      this.wizardAcctRel = false;
    } else if (this.conErrorList.length > 0) {
      this.wizardAcct = false;
      this.wizardPage = false;
      this.wizardCon = true;
      this.wizardAcctRel = false;
    } else if (this.acctRelErrorList.length > 0) {
      this.wizardAcct = false;
      this.wizardPage = false;
      this.wizardCon = false;
      this.wizardAcctRel = true;
    }
  }


  saveAcct(event) {
    let errorCount = false;
    try {
      if ((this.template.querySelector('[data-id="acctName"]').value === null) || (this.template.querySelector('[data-id="acctName"]').value === "")){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="acctType"]').value === null) || (this.template.querySelector('[data-id="acctType"]').value === "")){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="acctContact"]').value === null) || (this.template.querySelector('[data-id="acctContact"]').value === "")){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="acctPhone"]').value === null) || (this.template.querySelector('[data-id="acctPhone"]').value === "")){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if (this.template.querySelector('[data-id="payTerms"]').value === ""){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="acctMgr"]').value === null) || (this.template.querySelector('[data-id="acctMgr"]').value === "")){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if (this.template.querySelector('[data-id="acctInvoice"]').value === "") {
        errorCount = true;
      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="street"]').value === null) || (this.template.querySelector('[data-id="street"]').value === "")){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="city"]').value === null) || (this.template.querySelector('[data-id="city"]').value === "")){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="state"]').value === null) || (this.template.querySelector('[data-id="state"]').value === "")){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="zip"]').value === null) || (this.template.querySelector('[data-id="zip"]').value === "")){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="country"]').value === null) || (this.template.querySelector('[data-id="country"]').value === "")){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if (this.template.querySelector('[data-id="type"]').value === "") {
        errorCount = true;
      }
    } catch (error) {}

    if (!errorCount) {
      event.preventDefault();
      const fields = event.detail.fields;
      this.template.querySelector('[data-id="editAccountForm"]').submit(fields);
    } else {
        event.preventDefault();
        window.alert("Please fill out all fields before submitting form");      
    }
  }

  acctSuccess(event) {
    this.contactFind();
    event.preventDefault();
    window.alert("Account record updated!");
    if (this.conErrorList.length > 0) {
      this.wizardAcct = false;
      this.wizardPage = false;
      this.wizardCon = true;
      this.wizardAcctRel = false;
    } else if (this.acctRelErrorList.length > 0) {
      this.wizardAcct = false;
      this.wizardPage = false;
      this.wizardCon = false;
      this.wizardAcctRel = true;
    } else {
      this.checkError();
    }
  }

  saveCont(event) {
    let errorCount = false;
    try {
      if ((this.template.querySelector('[data-id="emailCon"]').value === null) || (this.template.querySelector('[data-id="emailCon"]').value === "")){
        errorCount = true;
      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="streetCon"]').value === null) || (this.template.querySelector('[data-id="streetCon"]').value === "")){
        errorCount = true;      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="cityCon"]').value === null) || (this.template.querySelector('[data-id="cityCon"]').value === "")){
        errorCount = true;      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="stateCon"]').value === null) || (this.template.querySelector('[data-id="stateCon"]').value === "")){
        errorCount = true;      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="zipCon"]').value === null) || (this.template.querySelector('[data-id="zipCon"]').value === "")){
        errorCount = true;      }
    } catch (error) {}
    try {
      if ((this.template.querySelector('[data-id="countryCon"]').value === null) || (this.template.querySelector('[data-id="countryCon"]').value === "")){
        errorCount = true;      }
    } catch (error) {}

    if (!errorCount) {
      event.preventDefault();
      const fields = event.detail.fields;
      this.template.querySelector('[data-id="editContactForm"]').submit(fields);
    } else {
        event.preventDefault();
        window.alert("Please fill out all fields before submitting form"); 
    }
  }

  contSuccess(event) {
    event.preventDefault();
    window.alert("Contact record updated!"); 
    if (this.acctRelErrorList.length > 0) {
      this.wizardAcct = false;
      this.wizardPage = false;
      this.wizardCon = false;
      this.wizardAcctRel = true;
    } else {
      this.checkError();
    }
  }

  saveActtRel(event) {
    event.preventDefault();
    const fields = event.detail.fields;
    this.template.querySelector('[data-id="editAcctRelForm"]').submit(fields);
  }

  acctRelSuccess(event) {
    this.checkError();
    event.preventDefault();
    window.alert("Account Relationship Record Created"); 
  }

  contactFind() {
    findContact({ recordId: this.recordId })
      .then(response => {
        if (response) {
          this.conId = response;
          console.log("contact Id: " + this.conId);
        }
      })
      .catch(error => {
        console.error("there is error");
      });
  }


}