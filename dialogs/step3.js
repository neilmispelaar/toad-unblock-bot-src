// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TextPrompt, ChoicePrompt, ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { LuisRecognizer } = require('botbuilder-ai');

const STEP_3 = 'STEP_3';

const TEXT_PROMPT = 'TEXT_PROMPT';

const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class Step3 extends ComponentDialog {
    constructor() {
        super(STEP_3);

        // Define a "done" response for the company selection prompt.
        this.doneOption = 'done';

        // Define value names for values tracked inside the dialogs.
        this.companiesSelected = 'value-companiesSelected';

        // Define the company choices for the company selection prompt.
        this.companyOptions = ['Adatum Corporation', 'Contoso Suites', 'Graphic Design Institute', 'Wide World Importers'];

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.emailPromptStep.bind(this),
            this.emailProvidedStep.bind(this),
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }


    async emailPromptStep(step) {

        // We can send messages to the user at any point in the WaterfallStep.
        return await step.prompt(TEXT_PROMPT, 'Ok, what email address should I send it to?');
    
    }

    async emailProvidedStep(step) {
        if (step.result) {
            // User said "yes" so we will be prompting for the next thing.
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            console.log('Step data', step);
            step.values.email = step.result;

            await step.context.sendActivity(`Ok, email sent!`);

            return await step.endDialog();
            
            // We can send messages to the user at any point in the WaterfallStep.
            //const promptOptions = { 
            //    prompt: 'Do you want me to notify you when we’ve received the Record of Employment?', 
            //    retryPrompt: ['yes', 'no'] 
            //};

            // We can send messages to the user at any point in the WaterfallStep.
            return await step.prompt(TEXT_PROMPT, 'Do you want me to notify you when we’ve received the Record of Employment?');

        } else {
            // User said "no" so we will skip the next step. Give -1 as the age.
            return await step.endDialog();
        }

    }

}

module.exports.Step3 = Step3;
module.exports.STEP_3 = STEP_3;
