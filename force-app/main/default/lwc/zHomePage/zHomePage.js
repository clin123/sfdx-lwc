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
import findContact from "@salesforce/apex/NASFGroupSelectLightningController.findContactId";
import srvAcctSearch from "@salesforce/apex/NASFGroupSelectLightningController.findSrvAcct";
import CreateCase from "@salesforce/apex/NASFGroupSelectLightningController.CreateCase";
import flowCheck from "@salesforce/apex/NASFGroupSelectLightningController.flowCheck";
import sendForm from "@salesforce/apex/NASFGroupSelectLightningController.sendForm";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";


export default class zHomePage extends NavigationMixin(LightningElement) {
  @api recordId; //current account record Id
  @track conId; //primary billing contact record Id
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
  @track srvAcctList = []; //list of servicing account for currnet account record
  @track acctError = []; //account error list for forloop 
  @track conError = []; //contact error list for forloop
  @track acctRelError = []; //account relationship error list for forloop
  @track vfUrl; //url for PDF vf page 

  //helper map for error list creation
  acctErrorMap = []; 
  conErrorMap = [];
  acctRelErrorMap = [];
 
 
 
 
  @track indexNum; //validation table row index
  @track validateId; //selected validation row account record Id

  @track warningMessage; //warning message for account not eligible for flow

  @track validationAcct = false; //boolean to render child componnet for record edit
  @track finalButton = true; //boolean to render view setup form button
  @track srvAcctIdList = []; //list of servicing account id

  @track flowMessage = false; //boolean to render flow error message

  

  // doInit component
  connectedCallback() {
    this.checkError();
    this.checkFlow();
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
        let details = response;
        if (JSON.stringify(details) !== "{}") {
          for (let key in details) {
            if (key === "Primary_Billing_Contact_Email__c") {
              this.errorList.push({ value: details[key], key: key });
              this.conErrorList.push({ value: details[key], key: key });
            } else if (key === "MailingAddress") {
              this.errorList.push({ value: details[key], key: key });
              this.conErrorList.push({ value: "street", key: "MailingStreet" });
              this.conErrorList.push({ value: "city", key: "MailingCity" });
              this.conErrorList.push({ value: "state", key: "MailingState" });
              this.conErrorList.push({
                value: "zip",
                key: "MailingPostalCode"
              });
              this.conErrorList.push({
                value: "country",
                key: "MailingCountry"
              });
            } else if (key === "Acct_Rel__c") {
              this.errorList.push({ value: details[key], key: key });
              this.acctRelErrorList.push({ value: details[key], key: key });
            } else if (key === "Receives_Invoice__c") {
              this.errorList.push({ value: details[key], key: key });
              this.acctErrorList.push({ value: details[key], key: key });
            } else if (key === "BillingAddress") {
              this.errorList.push({ value: details[key], key: key });
              this.acctErrorList.push({
                value: "street",
                key: "BillingStreet"
              });
              this.acctErrorList.push({ value: "city", key: "BillingCity" });
              this.acctErrorList.push({ value: "state", key: "BillingState" });
              this.acctErrorList.push({
                value: "zip",
                key: "BillingPostalCode"
              });
              this.acctErrorList.push({
                value: "country",
                key: "BillingCountry"
              });
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
          this.wizardPage = true;
          this.wizardAcct = false;
          this.wizardCon = false;
          this.wizardAcctRel = false;
          this.mbrPage = false;
        } else {
          this.mbrPage = true;
          this.srvAcctPage = false;
          this.searchSrvAcct();

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
        this.srvAcctPage = true;
    } else if(pageName === "acctRel") {
        this.wizardAcctRel = true;
    } else{
        this.wizardCon = true;
        this.conId = pageName;
    }
    this.wizardAcct = false;
  }

  goAcctRelPage(event) {
    let pageName = event.detail;
    if(pageName === "acctRel") {
      this.wizardAcctRel = true;
    } else{
        this.srvAcctPage = true;
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
      this.vfUrl = event.detail;
      this.mbrPage = false;
      this.pdfPage = true;
  }

  




  //placeholder for validation piece
  searchSrvAcct() {
    srvAcctSearch({ recordId: this.recordId })
      .then(response => {
        if (response) {
          this.srvAcctList = response;
        }
      })
      .catch(error => {
        console.error("there is error");
      });
  }

  validate(event) {
    this.srvAcctIdList = [];
    this.validationAcct = false;
    var index = event.currentTarget.dataset.rowIndex;
    this.indexNum = index;
    this.validateId = this.srvAcctList[index].srvAcctId;
    for (var i = 0; i < this.srvAcctList.length; i++) {
      this.srvAcctIdList.push({
        value: this.srvAcctList[i].srvAcctId,
        key: false
      });
    }
    this.srvAcctIdList[index].key = true;
    this.validationAcct = true;
  }

  handleValidation(event) {
    let isPassed = event.detail;
    let failCnt = 0;
    let vList = [];

    for (let i = 0; i < this.srvAcctList.length; i++) {
      vList.push({
        srvAcctId: this.srvAcctList[i].srvAcctId,
        isChecked: this.srvAcctList[i].isChecked,
        srvAcctName: this.srvAcctList[i].srvAcctName
      });
    }

    if (isPassed) {
      vList[this.indexNum].isChecked = true;
    }
    
    this.srvAcctList = vList;

    for (var i = 0; i < this.srvAcctList.length; i++) {
      if (!this.srvAcctList[i].isChecked) {
        failCnt = failCnt + 1;
      }
    }

    if (failCnt === 0) {
      this.finalButton = false;
    }
  }

  passedValidation() {
    this.errorPage = false;
    this.srvAcctPage = false;
    this.mbrPage = true;
    this.firstPage = true;
    this.secondPage = false;
    this.wizardPage = false;
    this.wizardAcct = false;
    this.wizardCon = false;
    this.wizardAcctRel = false;
    this.validationAcct = false;
    this.Search();
  }

  checkFlow() {
    flowCheck({ recordId: this.recordId })
      .then(response => {
        if (response) {
          this.flowMessage = true;
          this.warningMessage = response;
        }
      })
      .catch(error => {
        console.error("there is error");
      });
  }

  handleLast() {
    this.statusString = "";
    this.searchString = "";
    this.firstPage = true;
    this.secondPage = false;
    this.Search();
  }

  renderPDF() {
    let url = window.location.origin;
    let selectString = this.allList.join();
    let vfUrl = url + "/apex/NASFView?aid=" + this.recordId + "&renderAs=PDF" + "&Mbr_Group__c=" + selectString;
    window.open(vfUrl);
  }

  passToConfig() {
    if (this.allList.length > 0) {
      CreateCase({ memberGroupIds: this.allList })
        .then(response => {
          if (response) {
            this[NavigationMixin.Navigate]({
              type: "standard__recordPage",
              attributes: {
                recordId: response,
                objectApiName: "Case",
                actionName: "view"
              }
            });
          }
        })
        .catch(error => {
          console.error("there is error");
        });
    } else {
      const caseEvent = new ShowToastEvent({
        title: "Can not Create Case ",
        message: "Please select at least one member group",
        variant: "error",
        mode: "dismissable"
      });
      this.dispatchEvent(caseEvent);
    }
  }

  sendAcctForm() {
    if (this.allList.length > 0) {
      sendForm({ memberGroupIds: this.allList })
        .then(response => {
          if (response) {
            const emailEvent = new ShowToastEvent({
              title: "Email Sent",
              message: "New account setup form sent to " + response,
              variant: "success",
              mode: "dismissable"
            });
            this.dispatchEvent(emailEvent);
          }
        })
        .catch(error => {
          console.error("there is error");
        });
    } else {
        const caseEvent = new ShowToastEvent({
          title: "Can not Create Case ",
          message: "Please select at least one member group",
          variant: "error",
          mode: "dismissable"
    });
    this.dispatchEvent(caseEvent);
    }
  }
}