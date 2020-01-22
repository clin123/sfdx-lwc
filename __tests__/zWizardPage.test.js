/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
import { createElement } from 'lwc';
import wizardPage from 'c/zWizardPage';

// Sample data for imperative Apex call
const errorMessage = [
    {
     "key": "MailingAddress",
      "Value": "Missing Required Primary Contact Value: Mailing Address [MailingAddress]"
    }
]

describe('c-z-wizard-page', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('see if button renders', () => {
        const todosLength = errorMessage.length;
        // Create initial element
        const element = createElement('c-z-wizard-page', {
            is: wizardPage
        });
        element.errorList = errorMessage;
        document.body.appendChild(element);

        // Query chart-bar component
        const button = element.shadowRoot.querySelector('[data-id="startButton"]');
        expect(button.label).toBe("Start Wizard");
        const buttonC = element.shadowRoot.querySelector('[data-id="cancelButton"]');
        expect(buttonC.label).toBe("Cancel");
    });

    it('redner corret error message', () => {
        const todosLength = errorMessage.length;
        // Create initial element
        const element = createElement('c-z-wizard-page', {
            is: wizardPage
        });
        element.errorList = errorMessage;
        document.body.appendChild(element);
        // Query chart-bar component
        let listItemEls = element.shadowRoot.querySelectorAll('tr');
        expect(listItemEls.length).toBe(todosLength + 1);
    });



});       