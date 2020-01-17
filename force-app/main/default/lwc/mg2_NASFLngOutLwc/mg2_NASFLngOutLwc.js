/* eslint-disable array-callback-return */
/* eslint-disable consistent-return */
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
import errorCheck from "@salesforce/apex/Mg2_AccountSetupLwcController.errorCheck";
import findContact from "@salesforce/apex/Mg2_AccountSetupLwcController.findContactId";
import srvAcctSearch from "@salesforce/apex/Mg2_AccountSetupLwcController.findSrvAcct";
import searchMbr from "@salesforce/apex/Mg2_AccountSetupLwcController.filterMbrGroup";
import CreateCase from "@salesforce/apex/Mg2_AccountSetupLwcController.CreateCase";
import flowCheck from "@salesforce/apex/Mg2_AccountSetupLwcController.flowCheck";
import sendForm from "@salesforce/apex/Mg2_AccountSetupLwcController.sendForm";
import { NavigationMixin } from "lightning/navigation";

const columns = [
  { label: "GROUP NAME", fieldName: "Name__c", type: "text", sortable: true, cellAttribute: { alignment: "left" } },
  { label: "LEGACY ID", fieldName: "Group_Number__c", type: "text", sortable: true, cellAttribute: { alignment: "left" } },
  { label: "STATUS", fieldName: "Status__c", type: "text", sortable: true, cellAttribute: { alignment: "left" } },
  { label: "LAST MODIFIED DATW", fieldName: "LastModifiedDate", type: "date", sortable: true, cellAttribute: { alignment: "left" },
    typeAttributes: { day: 'numeric', month: 'short', year: 'numeric',hour: '2-digit', minute: '2-digit',second: '2-digit',hour12: true }, },
  { label: "CREATED DATE", fieldName: "CreatedDate", type: 'date', sortable: true, cellAttribute: { alignment: "left" }, 
    typeAttributes: { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }, }
];

export default class AcctSetUpLWC extends NavigationMixin(LightningElement) {
  
  @api recordId; //current account record Id
  @track conId; //primary billing contact record Id
  @track caseId; //new case Id when passing to config 
  @track indexNum; //validation table row index
  @track validateId; //selected validation row account record Id
  @track vfURL; //url for PDF vf page 
  @track timeoutId; //keyup delay
  @track searchString; //name/Id search string
  @track statusString; //status search option
  @track warningMessage; //warning message for account not eligible for flow
  @track lastField; //last sorting field Name
  @track sortDirection; //sorting direction
  @track sortedField //sort by field name
  @track preSelectedRows; //preselected row for member group checkbox
  @track page = 1; //this is initialize for 1st page
  @track startingRecord = 1; //start record position per page
  @track endingRecord = 0; //end record position per page
  @track pageSize = 20; //default value we are assigning
  @track totalRecountCount = 0; //total record count received from all retrieved records
  @track totalPage = 0; //total number of page is needed to display all records
  @track recordCnt = 0; //total count for selected member group
  @track statusDefault = "";
  @track columns = columns; //holds column info
  @track wizardPage = false; //boolean to render wizard page
  @track wizardAcct = false; //boolean to render account record edit page
  @track wizardCon = false; //boolean to render contact record edit page
  @track wizardAcctRel = false; //boolean to render account relationship record edit page
  @track srvAcctPage = false; //boolean to render account validation page
  @track financialType = false; //boolean to render finalcial type field for account record
  @track validationAcct = false; //boolean to render child componnet for record edit
  @track finalButton = true; //boolean to render view setup form button
  @track firstPage = false; //boolean to render first page of memeber group selection
  @track secondPage = false; //boolean to render second page of memeber group selection
  @track flowMessage = false; //boolean to render flow error message
  @track isSamePage = true; //boolean for current member group selection is same page from last handleSelect 
  @track acctErrorList = []; //list of account error message
  @track acctRelErrorList = []; //list of account relationship error message
  @track conErrorList = []; //list of contact error message
  @track errorList = []; //list of all error message
  @track srvAcctList = []; //list of servicing account for currnet account record
  @track acctError = []; //account error list for forloop 
  @track conError = []; //contact error list for forloop
  @track acctRelError = []; //account relationship error list for forloop
  @track srvAcctIdList = []; //list of servicing account id
  @track allList = []; //list of all the selected memeber group
  @track oldList = []; //list of all selected member group without current view page record
  @track items = []; //it contains all the records.
  @track data = []; //data to be display in the table

  acctErrorMap = [];
  conErrorMap = [];
  acctRelErrorMap = [];


  // doInit component
  connectedCallback() {
    this.checkError();
    this.contactFind();
    this.Search();
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
              this.conErrorList.push({ value: "zip", key: "MailingPostalCode" });
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
          this.wizardPage = true;
          this.wizardAcct = false;
          this.wizardCon = false;
          this.wizardAcctRel = false;
        } else {
          this.wizardAcctRel = false;
          this.firstPage = true; //default is false
          //this.srvAcctPage = true;
          //this.searchSrvAcct();
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
    let url = window.location.origin;
    window.location.href = url + "/" + this.recordId;
  }

  handleTypeChange(event) {
    let isYes = event.detail.value;
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
        }
      })
      .catch(error => {
        console.error("there is error");
      });
  }

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
    this.srvAcctPage = false;
    this.firstPage = true;
    this.secondPage = false;
    this.wizardPage = false;
    this.wizardAcct = false;
    this.wizardCon = false;
    this.wizardAcctRel = false;
    this.validationAcct = false;
    this.Search();
  }

  get statusOptions() {
    return [
      { label: "Active", value: "Active" },
      { label: "Pending", value: "Pending" },
      { label: "Termed", value: "Termed" },
      { label: "None", value: "" }
    ];
  }

  SearchKeyDelay() {
    clearTimeout(this.timeoutId); // no-op if invalid id
    this.timeoutId = setTimeout(this.Search.bind(this), 500); // Adjust as necessary
  }

  Search() {
    try {
      this.searchString = this.template.querySelector('[data-id="searchInput"]').value;
    } catch (error) {
      this.searchString = "";
    }
    try {
      this.statusString = this.template.querySelector('[data-id="select"]').value;
    } catch (error) {
      this.statusString = "";
    }
    searchMbr({
      recordId: this.recordId,
      searchStr: this.searchString,
      statusStr: this.statusString
    })
      .then(response => {
        if (response) {
          this.isSamePage = false;
          this.page = 1;
          this.items = response;
          this.totalRecountCount = response.length;
          if (this.totalRecountCount < this.pageSize){
            this.pageSize = this.totalRecountCount;
          } else {
            this.pageSize = 20;
          }
          if (this.totalRecountCount === 0){
            this.startingRecord = 0;
            this.totalPage = 1;
          } else {
            this.startingRecord = 1;
            this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);
          }             
          this.data = this.items.slice(0, this.pageSize);
          this.endingRecord = this.pageSize;
          this.error = undefined;
          this.handleRowSelect();
          this.isSamePage = false;
        }

      }).catch(error => {
        console.error("there is error: ");
      });
  }

  handleSort(event) {
    this.page = 1;
    if (this.totalRecountCount === 0){
      this.startingRecord = 0;
    } else {
      this.startingRecord = 1;
    }     
    this.endingRecord = this.pageSize;
    this.isSamePage = false;
    let preField = this.lastField;
    if (preField === event.detail.fieldName) {
      if (this.sortDirection === 'desc') {
        this.sortDirection = 'asc';
      } else {
        this.sortDirection = 'desc';
      }
    } else {
      this.sortDirection = 'asc'
    }
    this.sortedField = event.detail.fieldName;
    this.lastField = this.sortedField;
    this.sortData(this.sortedField, this.sortDirection);
    this.handleRowSelect();
    this.isSamePage = false;
  }

  sortData(fieldName, sortDirection) {
    let newOrderData = JSON.parse(JSON.stringify(this.items));
    let key = (a) => a[fieldName];
    let reverse = sortDirection === 'asc' ? 1 : -1;
    newOrderData.sort((a, b) => {
      let valueA = key(a) ? key(a).toLowerCase() : '';
      let valueB = key(b) ? key(b).toLowerCase() : '';
      return reverse * ((valueA > valueB) - (valueB > valueA));
    });
    this.items = newOrderData;
    this.data = newOrderData.slice(0, this.pageSize);
  }
  
  handleRowSelect(event) {
    if (this.isSamePage) {
      let selRows = event.detail.selectedRows;
      let newList = selRows.map(r => r.Id);
      let newListFiltered = newList.filter(function (el) { return el != null; });
      let oldListiltered = this.oldList.filter(function (el) { return el != null; });
      this.oldList = oldListiltered;
      this.allList = this.oldList.concat(newListFiltered);
      this.preSelectedRows = newListFiltered;
    } else {
      this.oldList = this.allList;
      let preSelect = this.data.map((d) => {
        const index = this.oldList.indexOf(d.Id);
          if (index > -1) {
              this.oldList.splice(index, 1);
              return d.Id
          }
      });
      let preSelectFiltered = preSelect.filter(function (el) { return el != null; });
      let oldListiltered = this.oldList.filter(function (el) { return el != null; });
      this.oldList = oldListiltered;
      this.preSelectedRows = preSelectFiltered;
      this.allList = this.oldList.concat(preSelectFiltered);
    }
    this.isSamePage = true;
    this.recordCnt = this.allList.length;
  }

  previousHandler() {
    if (this.page > 1) {
      this.isSamePage = false;
      this.page = this.page - 1;
      this.displayRecordPerPage(this.page);
      this.handleRowSelect();
      this.isSamePage = false;
    }
  }

  nextHandler() {
    if ((this.page < this.totalPage) && this.page !== this.totalPage) {
      this.isSamePage = false;
      this.page = this.page + 1;
      this.displayRecordPerPage(this.page);
      this.handleRowSelect();
      this.isSamePage = false;
    }
  }

  displayRecordPerPage(page) {
    this.startingRecord = ((page - 1) * this.pageSize);
    this.endingRecord = (this.pageSize * page);
    this.endingRecord = (this.endingRecord > this.totalRecountCount) ? this.totalRecountCount : this.endingRecord;
    this.data = this.items.slice(this.startingRecord, this.endingRecord);
    this.startingRecord = this.startingRecord + 1;
  }

  getSelectedRecords() {
    let selectString = this.allList.join();
    let url = window.location.origin;
    this.vfURL = url + "/apex/Mg2_NASFView?aid=" + this.recordId + "&renderAs=" + "&Mbr_Group__c=" + selectString; 
    this.firstPage = false;
    this.secondPage = true;
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
    let vfURL =
      url +
      "/apex/Mg2_NASFView?aid=" +
      this.recordId +
      "&renderAs=PDF" +
      "&Mbr_Group__c=" +
      selectString;
    window.open(vfURL);
  }

  passToConfig(event) {
    if (this.allList.length > 0) {
      CreateCase({ memberGroupIds: this.allList })
        .then(response => {
          if (response) {
            event.preventDefault();
            window.alert("Case created, redirect to the case record page now....");
            let url = window.location.origin;
            window.location.href = url + "/" + response;
          }
        })
        .catch(error => {
          console.error("there is error");
        });
    } else {
        event.preventDefault();
        window.alert("Please select at least one member group");      
    }
  }

  sendAcctForm(event) {
    if (this.allList.length > 0) {
    sendForm({ memberGroupIds: this.allList })
      .then(response => {
        if (response) {
            event.preventDefault();
            window.alert("New account setup form sent to " + response);
      }
      })
      .catch(error => {
        console.error("there is error");
      });
    } else {
      event.preventDefault();
      window.alert("Please select at least one member group");      
    }
  }
}