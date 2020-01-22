/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
import { createElement } from 'lwc';
import accountPage from 'c/zAccountPage';

// Sample data for imperative Apex call
const acctError = require('./data/getAcctError.json');
const acctNoError = require('./data/getNoError.json');
const financialError = require('./data/getFinError.json');

describe('c-z-account-page', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('see if button renders', () => {
        // Create initial element
        const element = createElement('c-z-account-page', {
            is: accountPage
        });
        document.body.appendChild(element);

        // Query chart-bar component
        const button = element.shadowRoot.querySelector('[data-id="saveNext"]');
        expect(button.label).toBe("Save and Next");
        const buttonC = element.shadowRoot.querySelector('[data-id="cancel"]');
        expect(buttonC.label).toBe("Cancel");
    });

    it('redner corret error message', () => {
        const acctErrorLength = acctError.length;
        // Create initial element
        const element = createElement('c-z-account-page', {
            is: accountPage
        });
        element.acctError = acctError;
        document.body.appendChild(element);
        // Query chart-bar component
        let listItemEls = element.shadowRoot.querySelectorAll('lightning-input-field');
        expect(listItemEls.length).toBe(acctErrorLength + 1);
    });

    it('no error message', () => {

        const element = createElement('c-z-account-page', {
            is: accountPage
        });
        element.acctError = acctNoError;
        document.body.appendChild(element);
        let listItemEls = element.shadowRoot.querySelectorAll('lightning-input-field');
        expect(listItemEls.length).toBe(1);
    });

    it('no error message', () => {

        const element = createElement('c-z-account-page', {
            is: accountPage
        });
        element.acctError = financialError;
        document.body.appendChild(element);

        const inputEl = element.shadowRoot.querySelector('[data-id="acctInvoice"]');

        inputEl.value = 'Yes';   
        inputEl.dispatchEvent(new CustomEvent('change'));

        return Promise.resolve().then(() => {
            // Verify displayed greeting
            let listItemEls = element.shadowRoot.querySelectorAll('lightning-input-field');
            expect(listItemEls.length).toBe(3);
        });

    });

    

});       