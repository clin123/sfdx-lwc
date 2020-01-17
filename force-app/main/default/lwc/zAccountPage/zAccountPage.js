/* eslint-disable no-console */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import { LightningElement, track, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ZAccountPage extends NavigationMixin(LightningElement) {

  @api acctError
  @api recordId;
  @api conErrorList;
  @api acctRelErrorList;
  @track financialType = false;

  showErrorToast() {
    const toastEvent = new ShowToastEvent({
      title: "Update Error",
      message: "Please fill out all fields",
      variant: "error",
      mode: "dismissable"
    });
    this.dispatchEvent(toastEvent);
  }

  showAcctToast() {
    const toastEvent = new ShowToastEvent({
      title: "Success",
      message: "Account info has been updated.",
      variant: "success",
      mode: "dismissable"
    });
    this.dispatchEvent(toastEvent);
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

  handleTypeChange(event) {
    let isYes = event.detail.value;
    if (isYes === "Yes") {
      this.financialType = true;
    } else {
      this.financialType = false;
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
      this.showErrorToast();
    }
  }

  acctSuccess() {
    if (this.conErrorList.length > 0) {
      const pasEvt = new CustomEvent("pass", { detail: "contact" });
      this.dispatchEvent(pasEvt);
    } else if (this.acctRelErrorList.length > 0) {
        const pasEvt = new CustomEvent("pass", { detail: "acctRel"  });
        this.dispatchEvent(pasEvt);
    } else {
        const pasEvt = new CustomEvent("pass", { detail: "validate" });
        this.dispatchEvent(pasEvt);
    }
    this.showAcctToast();  
  }
}