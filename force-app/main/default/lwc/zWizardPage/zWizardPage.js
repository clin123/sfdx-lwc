/* eslint-disable no-unused-vars */
import { LightningElement, track, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
export default class ZWizardPage extends NavigationMixin(LightningElement) {
  @api errorList; 
  @api acctErrorList;
  @api conErrorList;
  @api acctRelErrorList;
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

  startWiz() {
    if (this.acctErrorList.length > 0) {
      const pasEvt = new CustomEvent("pass", { detail: "account"  });
      this.dispatchEvent(pasEvt);
    } else if (this.conErrorList.length > 0) {
        const pasEvt = new CustomEvent("pass", { detail: "contact"  });
        this.dispatchEvent(pasEvt);
    } else if (this.acctRelErrorList.length > 0) {
        const pasEvt = new CustomEvent("pass", { detail: "acctRel"  });
        this.dispatchEvent(pasEvt);
    }
  }
}