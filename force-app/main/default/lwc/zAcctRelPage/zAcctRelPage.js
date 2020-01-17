/* eslint-disable no-unused-vars */
import { LightningElement, track, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ZAcctRelPage extends NavigationMixin(LightningElement) {
  @api recordId;

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

  showErrorToast() {
    const toastEvent = new ShowToastEvent({
      title: "Update Error",
      message: "Please fill out all fields",
      variant: "error",
      mode: "dismissable"
    });
    this.dispatchEvent(toastEvent);
  }

  showAcctReloast() {
    const toastEvent = new ShowToastEvent({
      title: "Success",
      message: "Account Relationship info has been saved.",
      variant: "success",
      mode: "dismissable"
    });
    this.dispatchEvent(toastEvent);
  }

  saveActtRel(event) {
    event.preventDefault();
    const fields = event.detail.fields;
    this.template.querySelector('[data-id="editAcctRelForm"]').submit(fields);
  }

  acctRelSuccess() {
    this.showAcctReloast();
    const pasEvt = new CustomEvent("pass", { detail: "saved"  });
    this.dispatchEvent(pasEvt);
  }
}