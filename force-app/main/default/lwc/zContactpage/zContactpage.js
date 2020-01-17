/* eslint-disable no-console */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import { LightningElement, track, api } from "lwc";
import findContact from "@salesforce/apex/NASFGroupSelectLightningController.findContactId";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ZContactpage extends NavigationMixin(LightningElement) {

  @api recordId;
  @api conError;
  @api acctRelErrorList;
  @track financialType = false;
  @track conId;


  connectedCallback() {
    this.contactFind();
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

  showErrorToast() {
    const toastEvent = new ShowToastEvent({
      title: "Update Error",
      message: "Please fill out all fields",
      variant: "error",
      mode: "dismissable"
    });
    this.dispatchEvent(toastEvent);
  }

  showConToast() {
    const toastEvent = new ShowToastEvent({
      title: "Success",
      message: "Contact info has been updated.",
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
      this.showErrorToast();
    }
  }

  contSuccess() {
    this.showConToast();
    if (this.acctRelErrorList.length > 0) {
        const pasEvt = new CustomEvent("pass", { detail: "acctRel"  });
        this.dispatchEvent(pasEvt);
    } else {
        const pasEvt = new CustomEvent("pass", { detail: "validate"  });
        this.dispatchEvent(pasEvt);
    }
  }
}